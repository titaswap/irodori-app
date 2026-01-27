/**
 * Vocabulary Controller Hook
 * Orchestrates all vocabulary view logic and state management
 * Contains NO JSX - pure coordination layer
 */

import { useEffect, useCallback } from 'react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useTags } from '../../tags/useTags';
import { useRowTags } from '../../tags/useRowTags';
import { useResultStats } from '../../hooks/useResultStats';
import { useTableHoverLock } from '../../hooks/useTableHoverLock.jsx';
import { preferenceStore } from '../../utils/preferenceStore';
import { useVocabularyState } from '../hooks/useVocabularyState';
import { useVocabularyData } from '../../hooks/useVocabularyData';
import { useColumnManagement } from '../hooks/useColumnManagement';
import { useEditMode } from '../hooks/useEditMode';
import { usePracticeMode } from '../hooks/usePracticeMode';
import { useVocabularyActions } from '../hooks/useVocabularyActions';
import { useImportHandler } from '../handlers/useImportHandler';
import { useDeleteHandler } from '../handlers/useDeleteHandler';
import { useEditFlowHandler } from '../handlers/useEditFlowHandler';
import { useVocabularyModals } from '../handlers/useVocabularyModals';
import { useVocabularyViewModel } from '../hooks/useVocabularyViewModel';

export function useVocabularyController({
    vocabList,
    setVocabList,
    folders,
    currentFolderId,
    setCurrentFolderId,
    isLoading,
    isSyncing,
    setIsSyncing,
    apiService,
    fetchSheetData,
    user
}) {
    // --- STATE MANAGEMENT ---
    const {
        isEditMode, setIsEditMode,
        draftVocabList, setDraftVocabList,
        hasUnsavedChanges, setHasUnsavedChanges,
        toast, setToast, showToast,
        hiddenColumns, setHiddenColumns,
        revealedCells, setRevealedCells,
        columnOrder, setColumnOrder,
        columnVisibility, setColumnVisibility,
        columnWidths, setColumnWidths,
        theme, toggleTheme,
        isColumnManagerOpen, setIsColumnManagerOpen,
        isMobileSidebarOpen, setIsMobileSidebarOpen,
        sortConfig, setSortConfig,
        filters, setFilters,
        searchTerm,
        viewMode, setViewMode,
        selectedIds, setSelectedIds,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage
    } = useVocabularyState();

    // --- DATA PROCESSING ---
    const { filteredAndSortedData, trendData, weaknessSuggestion, safeDataList } = useVocabularyData(
        vocabList, currentFolderId, searchTerm, filters, sortConfig, viewMode, isEditMode, draftVocabList
    );

    const displayData = filteredAndSortedData;

    // --- TAG MANAGEMENT ---
    const { allTags, searchTags, createTag, renameTag, deleteTag, getTagName } = useTags(vocabList, setVocabList, user);
    const { toggleRowTag } = useRowTags(vocabList, setVocabList, showToast);

    // --- STATS ---
    const { showingCount, totalCount } = useResultStats(vocabList, displayData, currentFolderId);

    // --- TABLE HOVER LOCK ---
    const { isLocked: isTableHoverLocked } = useTableHoverLock();

    // --- AUDIO PLAYER ---
    const {
        playbackMode, isPlaying, playbackQueue, currentIndex, currentSingleId, lastPlayedRowId, audioConfig, isAudioBarManuallyHidden,
        setAudioConfig, setIsAudioBarManuallyHidden,
        togglePlayPause, startPlaylist, handlePlaySingle,
        onPrevTrack, onNextTrack
    } = useAudioPlayer(vocabList, displayData, showToast);

    // --- VIEW MODEL (Derived Data) ---
    const {
        contextData,
        allColumns,
        paginatedData,
        totalPages,
        isAudioBarVisible,
        isAudioActiveButHidden,
        currentAudioRowId
    } = useVocabularyViewModel({
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
    });

    // --- COLUMN MANAGEMENT ---
    useColumnManagement({
        allColumns,
        columnOrder,
        setColumnOrder,
        columnVisibility,
        setColumnVisibility,
        columnWidths,
        setColumnWidths,
        itemsPerPage,
        setItemsPerPage,
        preferenceStore
    });

    // --- PAGINATION RESET ---
    useEffect(() => {
        setCurrentPage(1);
    }, [currentFolderId, searchTerm, filters, viewMode, sortConfig]);

    // --- UI STATE RESET ON FOLDER CHANGE ---
    useEffect(() => {
        setSelectedIds(new Set());
        setRevealedCells({ japanese: null, bangla: null });
    }, [currentFolderId, setSelectedIds, setRevealedCells]);

    // --- EDIT MODE ---
    const {
        saveChanges,
        discardChanges,
        updateDraftCell,
        toggleMarkInDraft
    } = useEditMode({
        isEditMode,
        setIsEditMode,
        draftVocabList,
        setDraftVocabList,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        vocabList,
        setVocabList,
        isSyncing,
        setIsSyncing,
        apiService,
        fetchSheetData,
        showToast
    });

    // --- EDIT FLOW HANDLER ---
    const {
        editConfirmationOpen,
        setEditConfirmationOpen,
        unsavedChangesModal,
        startEditMode,
        requestActionWithUnsavedCheck: attemptAction,
        confirmExitWithSave,
        confirmExitWithDiscard,
        cancelEditModeAttempt
    } = useEditFlowHandler({
        isEditMode,
        hasUnsavedChanges,
        setIsEditMode,
        setHasUnsavedChanges,
        saveChanges,
        showToast,
        vocabList,
        setDraftVocabList
    });

    // --- PRACTICE MODE ---
    const {
        startPractice,
        handlePracticeStart,
        handleStartSmartPractice,
        nextCard,
        previousCard,
        finishPractice,
        practiceQueue,
        setPracticeQueue,
        currentCardIndex,
        setCurrentCardIndex,
        practiceModeActive,
        setPracticeModeActive
    } = usePracticeMode({
        filteredAndSortedData,
        vocabList,
        showToast,
        attemptAction
    });

    // --- VOCABULARY ACTIONS ---
    const {
        handleFolderChange,
        handleFilterChange,
        handlePlaylistStart,
        handleViewModeChange,
        handleApplySuggestion,
        handlePracticeStart: handlePracticeStartAction,
        handleRefresh,
        handleSort,
        isTransitioning,
        handleShuffle,
        handleUpdateCell,
        toggleMark
    } = useVocabularyActions({
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
        vocabList,
        setVocabList,
        updateDraftCell,
        toggleMarkInDraft,
        apiService
    });

    // --- IMPORT HANDLER ---
    const {
        importModalOpen,
        openImport,
        closeImport,
        handleImport
    } = useImportHandler({
        isEditMode,
        setDraftVocabList,
        setHasUnsavedChanges,
        setIsSyncing,
        apiService,
        fetchSheetData,
        showToast,
        currentFolderId,
        folders
    });

    // --- DELETE HANDLER ---
    const {
        deleteModal,
        setDeleteModal,
        requestDelete,
        closeDeleteModal,
        executeDelete
    } = useDeleteHandler({
        isEditMode,
        draftVocabList,
        setDraftVocabList,
        setHasUnsavedChanges,
        selectedIds,
        setSelectedIds,
        showToast
    });

    // --- MODAL HANDLERS ---
    const { toggleSelection } = useVocabularyModals({
        setSelectedIds
    });

    // --- REVEAL CELL LOGIC ---
    useEffect(() => {
        setRevealedCells({ japanese: null, bangla: null });
    }, [currentFolderId, filters, searchTerm, sortConfig, viewMode]);

    const toggleGlobalVisibility = (k) => {
        setHiddenColumns(p => ({ ...p, [k]: !p[k] }));
        setRevealedCells(p => ({ ...p, [k]: null }));
    };

    const revealSingleCell = useCallback((id, k) => setRevealedCells(p => ({ ...p, [k]: id })), []);

    // --- COLUMN DRAG AND DROP ---
    const handleColumnDragStart = (e, colId) => {
        e.dataTransfer.setData("text/plain", colId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColumnDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleColumnDrop = (e, targetColId) => {
        e.preventDefault();
        const draggedColId = e.dataTransfer.getData("text/plain");
        if (draggedColId === targetColId) return;
        const fromIndex = columnOrder.indexOf(draggedColId);
        const toIndex = columnOrder.indexOf(targetColId);
        if (fromIndex < 0 || toIndex < 0) return;
        const newOrder = [...columnOrder];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        setColumnOrder(newOrder);
    };

    // --- RETURN ORCHESTRATED STATE ---
    return {
        // Loading State
        isLoading,
        isSyncing,

        // Data
        vocabList,

        // Practice Mode
        practiceModeActive,
        practiceQueue,
        currentCardIndex,
        nextCard,
        finishPractice,

        // Theme
        theme,
        toggleTheme,

        // Folders & Filters
        folders,
        currentFolderId,
        filters,
        viewMode,
        trendData,
        weaknessSuggestion,

        // Handlers
        handleFolderChange,
        handleFilterChange,
        handlePlaylistStart,
        handleViewModeChange,
        handleApplySuggestion,
        handlePracticeStart,
        handleStartSmartPractice,
        handleRefresh,
        openImport,
        attemptAction,
        isTransitioning,

        // Sidebar
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,

        // Edit Mode
        isEditMode,
        hasUnsavedChanges,
        saveChanges,
        discardChanges,

        // Stats
        showingCount,
        totalCount,

        // Table Data
        displayData,
        paginatedData,
        currentPage,
        totalPages,
        itemsPerPage,
        setCurrentPage,
        setItemsPerPage,

        // Columns
        allColumns,
        columnOrder,
        setColumnOrder,
        columnVisibility,
        setColumnVisibility,
        columnWidths,
        setColumnWidths,
        isColumnManagerOpen,
        setIsColumnManagerOpen,
        toggleGlobalVisibility,
        handleColumnDragStart,
        handleColumnDragOver,
        handleColumnDrop,

        // Sorting
        sortConfig,
        handleSort,
        handleShuffle,

        // Selection
        selectedIds,
        toggleSelection,

        // Audio
        playbackMode,
        playbackQueue,
        currentIndex,
        currentSingleId,
        isPlaying,
        audioConfig,
        setAudioConfig,
        isAudioBarVisible,
        isAudioActiveButHidden,
        togglePlayPause,
        onPrevTrack,
        onNextTrack,
        setIsAudioBarManuallyHidden,
        currentAudioRowId,
        lastPlayedRowId,
        handlePlaySingle,

        // Cell Visibility
        hiddenColumns,
        revealedCells,
        revealSingleCell,

        // Row Actions
        handleUpdateCell,
        toggleMark,
        requestDelete,

        // Tags
        allTags,
        searchTags,
        createTag,
        renameTag,
        deleteTag,
        getTagName,
        toggleRowTag,

        // Table State
        isTableHoverLocked,

        // Modals
        deleteModal,
        setDeleteModal,
        executeDelete,
        editConfirmationOpen,
        setEditConfirmationOpen,
        startEditMode,
        unsavedChangesModal,
        confirmExitWithSave,
        confirmExitWithDiscard,
        cancelEditModeAttempt,
        importModalOpen,
        closeImport,
        handleImport,

        // Toast
        toast,
        setToast,

        // Auth
        isAuthenticated: !!user
    };
}
