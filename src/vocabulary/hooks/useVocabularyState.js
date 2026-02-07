/**
 * Vocabulary State Hook
 * Manages all state for VocabularyView component
 */

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { preferenceStore } from '../../utils/preferenceStore';
import { tagFilterStorage } from '../../utils/tagFilterStorage';
import { uiStateStorage } from '../../utils/uiStateStorage';
import { uiConfig } from '../../config/uiConfig';

export function useVocabularyState() {
    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [draftVocabList, setDraftVocabList] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Toast State
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
    }, []);

    // Column Visibility State
    const [hiddenColumns, setHiddenColumns] = useState({ japanese: false, bangla: false });
    const [revealedCells, setRevealedCells] = useState({ japanese: null, bangla: null });

    // Dynamic Column State
    // Dynamic Column State - Initialized to empty, managed by useColumnManagement per folder
    const [columnOrder, setColumnOrder] = useState([]);

    const [columnVisibility, setColumnVisibility] = useState({});



    const [columnWidths, setColumnWidths] = useState({});

    // Theme State
    const [theme, setTheme] = useState(() => {
        let initial = 'light';
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) {
                initial = saved;
            } else {
                initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                localStorage.setItem('theme', initial);
            }

            // Immediate application
            if (initial === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        return initial;
    });

    useLayoutEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // Modal State
    const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Filter and Sort State
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // NOTE: Filter state is now managed by useGroupFilters hook in the controller
    // This provides group-based filter isolation (Kanji/Book/Other groups)
    // Keeping this placeholder for backward compatibility during migration
    const [filters, setFilters] = useState({
        lesson: [],
        cando: [],
        book: 'all',
        tags: []
    });

    const [searchTerm] = useState('');
    const [viewMode, setViewMode] = useState(() => uiStateStorage.loadViewMode());

    useEffect(() => {
        uiStateStorage.saveViewMode(viewMode);
    }, [viewMode]);

    const [selectedIds, setSelectedIds] = useState(new Set());

    // Practice Mode State
    const [practiceQueue, setPracticeQueue] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [practiceModeActive, setPracticeModeActive] = useState(false);



    // Delete and Confirmation Modals


    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => preferenceStore.loadPreferences().itemsPerPage);

    useEffect(() => {
        preferenceStore.savePreferences({ itemsPerPage });
    }, [itemsPerPage]);



    return {
        // Edit Mode
        isEditMode,
        setIsEditMode,
        draftVocabList,
        setDraftVocabList,
        hasUnsavedChanges,
        setHasUnsavedChanges,

        // Toast
        toast,
        setToast,
        showToast,

        // Column Visibility
        hiddenColumns,
        setHiddenColumns,
        revealedCells,
        setRevealedCells,

        // Dynamic Columns
        columnOrder,
        setColumnOrder,
        columnVisibility,
        setColumnVisibility,
        columnWidths,
        setColumnWidths,

        // Theme
        theme,
        setTheme,
        toggleTheme,

        // Modals
        isColumnManagerOpen,
        setIsColumnManagerOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,

        // Filters and Sort
        sortConfig,
        setSortConfig,
        filters,
        setFilters,
        searchTerm,
        viewMode,
        setViewMode,
        selectedIds,
        setSelectedIds,

        // Practice Mode
        practiceQueue,
        setPracticeQueue,
        currentCardIndex,
        setCurrentCardIndex,
        practiceModeActive,
        setPracticeModeActive,






        // Pagination
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage
    };
}
