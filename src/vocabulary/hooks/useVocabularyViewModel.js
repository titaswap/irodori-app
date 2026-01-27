/**
 * Vocabulary View Model Hook
 * Manages derived state and view logic for VocabularyView.
 * Purely synchronous derivations from props/state.
 */

import { useMemo } from 'react';
import { INTERNAL_KEYS, FIXED_SYSTEM_COLUMNS, SELECTION_COLUMN } from '../../utils/vocabularyUtils';

export function useVocabularyViewModel({
    vocabList,
    currentFolderId,
    displayData,
    currentPage,
    itemsPerPage,
    playbackMode,
    playbackQueue,
    currentIndex,
    currentSingleId,
    lastPlayedRowId,
    isPlaying,
    isAudioBarManuallyHidden
}) {
    // 1. Context Data for Toolbar
    const contextData = useMemo(() => {
        if (currentFolderId === 'root') return vocabList;
        return vocabList.filter(v => v.folderId === currentFolderId);
    }, [vocabList, currentFolderId]);

    // 2. All Columns Generation
    const allColumns = useMemo(() => {
        let dynamicCols = [];
        if (vocabList && vocabList.length > 0) {
            const first = vocabList[0];
            const keys = Object.keys(first);

            dynamicCols = keys
                .filter(key => !INTERNAL_KEYS.has(key))
                .filter(key => key !== 'japanese' || !first._isSyntheticJapanese)
                .map(key => ({
                    id: key,
                    label: key,
                    width: 'min-w-[140px]',
                    type: 'text',
                    sortable: true
                }));
        }
        return [SELECTION_COLUMN, ...dynamicCols, ...FIXED_SYSTEM_COLUMNS];
    }, [vocabList]);

    // 3. Pagination Logic
    const paginatedData = useMemo(() => {
        if (!Array.isArray(displayData)) return [];
        const start = (currentPage - 1) * itemsPerPage;
        return displayData.slice(start, start + itemsPerPage);
    }, [displayData, currentPage, itemsPerPage]);

    const totalPages = Array.isArray(displayData) ? Math.ceil(displayData.length / itemsPerPage) : 0;


    // 4. Audio Visibility Logic
    // Check if there's any audio content (queue, single audio, or recently played)
    const hasAudioContent = (
        (playbackMode === 'playlist' && Array.isArray(playbackQueue) && playbackQueue.length > 0) ||
        (playbackMode === 'single' && currentSingleId) ||
        (playbackMode === 'idle' && lastPlayedRowId) // Preserve bar for recently played audio
    );

    const isAudioBarVisible = hasAudioContent && !isAudioBarManuallyHidden;

    const isAudioActiveButHidden = hasAudioContent && isAudioBarManuallyHidden;

    // 5. Current Audio Row ID (for highlighting)
    let currentAudioRowId = null;
    if (playbackMode === 'playlist' && Array.isArray(playbackQueue) && playbackQueue.length > 0 && currentIndex >= 0) {
        currentAudioRowId = playbackQueue[currentIndex];
    } else if (playbackMode === 'single') {
        currentAudioRowId = currentSingleId;
    } else {
        // Fallback for idle/paused state (persists highlight)
        currentAudioRowId = lastPlayedRowId || null;
    }

    return {
        contextData,
        allColumns,
        paginatedData,
        totalPages,
        isAudioBarVisible,
        isAudioActiveButHidden,
        currentAudioRowId
    };
}
