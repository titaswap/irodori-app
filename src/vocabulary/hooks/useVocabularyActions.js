/**
 * Vocabulary Actions Hook
 * Manages general vocabulary actions like folder change, filter update, refresh, etc.
 * Also manages row-level actions like cell updates and marking.
 */

import { useRef, useCallback, useTransition } from 'react';
import { updateProgress } from '../../services/firestore/activityService';

export function useVocabularyActions({
    attemptAction,
    setCurrentFolderId,
    setFilters,
    startPlaylist,
    viewMode,
    setViewMode,
    isEditMode,
    hasUnsavedChanges,
    setIsSyncing,
    fetchSheetData,
    showToast,
    sortConfig,
    setSortConfig,
    startPractice,
    // Row Handler Props
    vocabList,
    setVocabList,
    updateDraftCell,
    toggleMarkInDraft,
    apiService
}) {
    // Sync state for optimistic updates
    const activeSyncs = useRef(0);
    const [isTransitioning, startTransition] = useTransition();

    const handleFolderChange = (id) => attemptAction(() => {
        startTransition(() => {
            setCurrentFolderId(id);
        });
    });
    const handleFilterChange = (f) => attemptAction(() => setFilters(f));
    const handlePlaylistStart = () => attemptAction(() => startPlaylist(0));
    const handleViewModeChange = (m) => attemptAction(() => setViewMode(viewMode === m ? 'all' : m));
    const handleApplySuggestion = (s) => attemptAction(() => setFilters({ lesson: s.lesson, cando: s.cando }));

    // Wrapper for practice start using attemptAction
    const handlePracticeStart = () => attemptAction(() => startPractice());

    const handleRefresh = async () => {
        if (isEditMode && hasUnsavedChanges) {
            showToast("Save or discard changes before refreshing", "warning");
            return;
        }
        setIsSyncing(true);
        try {
            await fetchSheetData(true);
            showToast("Data refreshed from Sheet", "success");
        } catch (e) {
            console.error(e);
            showToast("Refresh failed", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSort = (key) => setSortConfig({
        key,
        direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });

    const handleShuffle = () => {
        setSortConfig({ key: 'random', direction: 'asc', seed: Date.now() });
    };

    // --- Row Actions ---

    const handleUpdateCell = useCallback(async (lid, f, v) => {
        // Special handling for 'tag' field - works outside edit mode
        if (f === 'tag') {
            const item = vocabList.find(i => i.localId === lid);
            if (!item || !item.id) return;
            setVocabList(p => p.map(i => i.localId === lid ? { ...i, tag: v } : i));
            try {
                await updateProgress(item.id, { tag: v });
            } catch (e) {
                console.error('Failed to update tag:', e);
                setVocabList(p => p.map(i => i.localId === lid ? { ...i, tag: item.tag } : i));
                showToast("Failed to update tag", "error");
            }
            return;
        }
        // All other fields use edit mode
        updateDraftCell(lid, f, v);
    }, [vocabList, setVocabList, showToast, updateDraftCell]);

    const toggleMark = useCallback(async (lid) => {
        if (isEditMode) {
            toggleMarkInDraft(lid);
        } else {
            const item = vocabList.find(v => v.localId === lid);
            if (!item || !item.id) return;

            const newState = !item.isMarked;

            // Optimistic Update
            setVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: newState } : v));

            // Sync Management
            if (activeSyncs.current === 0) setIsSyncing(true);
            activeSyncs.current += 1;

            try {
                // Phase 8.3-A: Firestore Write
                await updateProgress(item.id, { isMarked: newState });
            } catch (e) {
                console.error(e);
                // Revert state for this specific item only
                setVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: !newState } : v));
                showToast("Failed to update mark", "error");
            } finally {
                activeSyncs.current -= 1;
                if (activeSyncs.current === 0) setIsSyncing(false);
            }
        }
    }, [isEditMode, vocabList, apiService, setVocabList, showToast, setIsSyncing, toggleMarkInDraft]);

    return {
        handleFolderChange,
        handleFilterChange,
        handlePlaylistStart,
        handleViewModeChange,
        handleApplySuggestion,
        handlePracticeStart,
        handleRefresh,
        handleSort,
        isTransitioning,

        handleShuffle,
        handleUpdateCell,
        toggleMark
    };
}
