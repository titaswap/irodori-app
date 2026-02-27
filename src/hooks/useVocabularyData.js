import { useMemo } from 'react';
import { globalSearch } from '../utils/globalSearch';

export const useVocabularyData = (vocabList = [], currentFolderId, searchTerm, filters, sortConfig, viewMode, isEditMode, draftVocabList, allTags = [], sortMode = 'serial', randomOrderIds = null) => {
    const activeDataList = isEditMode ? draftVocabList : vocabList;
    const safeDataList = Array.isArray(activeDataList) ? activeDataList : [];

    const filteredAndSortedData = useMemo(() => {
        let data = [...safeDataList];

        // 1. Random ordering BEFORE filtering
        if (sortMode === 'random' && Array.isArray(randomOrderIds) && randomOrderIds.length > 0) {
            const itemMap = new Map(data.map(i => [i.id || i.localId, i]));
            const reordered = [];
            // Push items in the saved order
            randomOrderIds.forEach(id => {
                if (itemMap.has(id)) {
                    reordered.push(itemMap.get(id));
                    itemMap.delete(id);
                }
            });
            // Push any remaining new items that weren't in the saved random order
            for (const item of itemMap.values()) {
                reordered.push(item);
            }
            data = reordered;
        }

        if (currentFolderId !== 'root') data = data.filter(i => i.folderId === currentFolderId);

        // DEBUG LOGGING
        // console.log("Filtering Debug:", { ... });

        const initialCount = data.length;

        if (Array.isArray(filters.lesson) && filters.lesson.length > 0) {
            // Normalize filter values to strings
            const filterStrings = filters.lesson.map(String);
            data = data.filter(i => {
                // Handle both 'Lesson' (uppercase) and 'lesson' (lowercase)
                const lessonValue = i.Lesson !== undefined ? i.Lesson : i.lesson;
                return filterStrings.includes(String(lessonValue));
            });
        }
        else if (filters.lesson !== 'all' && filters.lesson !== undefined && !Array.isArray(filters.lesson)) {
            data = data.filter(i => {
                const lessonValue = i.Lesson !== undefined ? i.Lesson : i.lesson;
                return String(lessonValue) === String(filters.lesson);
            });
        }

        if (Array.isArray(filters.cando) && filters.cando.length > 0) {
            const filterStrings = filters.cando.map(String);
            data = data.filter(i => {
                // Handle both 'Cando' (uppercase) and 'cando' (lowercase)
                const candoValue = i.Cando !== undefined ? i.Cando : i.cando;
                return filterStrings.includes(String(candoValue));
            });
        }
        else if (filters.cando !== 'all' && filters.cando !== undefined && !Array.isArray(filters.cando)) {
            data = data.filter(i => {
                const candoValue = i.Cando !== undefined ? i.Cando : i.cando;
                return String(candoValue) === String(filters.cando);
            });
        }

        // Book filter (for sheets that have book column)
        // IMPORTANT: Use 'Book' (uppercase) for row-level data, fall back to 'book' (lowercase)
        if (Array.isArray(filters.book) && filters.book.length > 0) {
            const filterStrings = filters.book.map(String);
            data = data.filter(i => {
                const bookValue = i.Book !== undefined ? i.Book : i.book;
                return filterStrings.includes(String(bookValue));
            });
        }
        // FIXED: Check for undefined to prevent filtering out all items when key is missing (e.g. Book folders)
        else if (filters.book !== 'all' && filters.book !== undefined && !Array.isArray(filters.book)) {
            data = data.filter(i => {
                const bookValue = i.Book !== undefined ? i.Book : i.book;
                return String(bookValue) === String(filters.book);
            });
        }

        // Tag filter: Show rows with ANY selected tag (OR logic)
        // Special mode: "__ONLY_TAGGED__" shows only rows with at least one tag
        if (Array.isArray(filters.tags) && filters.tags.length > 0) {
            const ONLY_TAGGED_MODE = '__ONLY_TAGGED__';
            const UNMARKED_MODE = 'UNMARKED';

            // Check if "Unmarked Only" mode is active
            if (filters.tags.length === 1 && filters.tags[0] === UNMARKED_MODE) {
                data = data.filter(item => item.marked === false || (!item.marked && !item.isMarked));
            }
            // Check if "Only Tagged" mode is active
            else if (filters.tags.length === 1 && filters.tags[0] === ONLY_TAGGED_MODE) {
                // Show only rows that have at least one tag
                data = data.filter(item => {
                    const itemTags = Array.isArray(item.tags) ? item.tags : [];
                    return itemTags.length > 0;
                });
            } else {
                // Normal tag filtering: show rows with ANY selected tag
                data = data.filter(item => {
                    const itemTags = Array.isArray(item.tags) ? item.tags : [];
                    return filters.tags.some(selectedTag => {
                        // Check if selectedTag (tagId) exists in itemTags
                        return itemTags.some(tag => {
                            // Handle legacy string format
                            if (typeof tag === 'string') return tag === selectedTag;
                            // Handle new snapshot object format {id, name}
                            return tag.id === selectedTag;
                        });
                    });
                });
            }
        }

        if (viewMode === 'problem') data = data.filter(i => i.isMarked);
        else if (viewMode === 'weak') data = data.filter(i => i.isMarked); // Stats removed, fallback to marked

        // UNIVERSAL SEARCH (Moved to end of pipeline for performance)
        if (searchTerm) {
            data = globalSearch(data, searchTerm, allTags);
        }

        // Secondary sorting for columns
        if (sortConfig.key && sortConfig.key !== 'random') {
            data.sort((a, b) => {
                let va = a[sortConfig.key], vb = b[sortConfig.key];
                if (typeof va === 'string') va = va.toLowerCase();
                if (typeof vb === 'string') vb = vb.toLowerCase();
                return (va < vb ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1);
            });
        }
        return data;
    }, [safeDataList, currentFolderId, searchTerm, filters, sortConfig, viewMode, allTags, sortMode, randomOrderIds]);

    return { filteredAndSortedData, safeDataList };
};
