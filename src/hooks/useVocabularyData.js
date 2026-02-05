
import { useMemo } from 'react';

export const useVocabularyData = (vocabList = [], currentFolderId, searchTerm, filters, sortConfig, viewMode, isEditMode, draftVocabList) => {
    const activeDataList = isEditMode ? draftVocabList : vocabList;
    const safeDataList = Array.isArray(activeDataList) ? activeDataList : [];

    const filteredAndSortedData = useMemo(() => {
        let data = [...safeDataList];
        if (currentFolderId !== 'root') data = data.filter(i => i.folderId === currentFolderId);
        if (searchTerm) { const l = searchTerm.toLowerCase(); data = data.filter(i => i.japanese.includes(l) || i.bangla.includes(l)); }

        // DEBUG LOGGING
        // console.log("Filtering Debug:", {
        //     filters,
        //     uniqueLessons: [...new Set(data.map(i => i.lesson))],
        //     uniqueKando: [...new Set(data.map(i => i.cando))]
        // });

        if (Array.isArray(filters.lesson) && filters.lesson.length > 0) {
            // Normalize filter values to strings
            const filterStrings = filters.lesson.map(String);
            data = data.filter(i => filterStrings.includes(String(i.lesson)));
        }
        else if (filters.lesson !== 'all' && !Array.isArray(filters.lesson)) {
            data = data.filter(i => String(i.lesson) === String(filters.lesson));
        }

        if (Array.isArray(filters.cando) && filters.cando.length > 0) {
            const filterStrings = filters.cando.map(String);
            data = data.filter(i => filterStrings.includes(String(i.cando)));
        }
        else if (filters.cando !== 'all' && !Array.isArray(filters.cando)) {
            data = data.filter(i => String(i.cando) === String(filters.cando));
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
        else if (filters.book !== 'all' && !Array.isArray(filters.book)) {
            data = data.filter(i => {
                const bookValue = i.Book !== undefined ? i.Book : i.book;
                return String(bookValue) === String(filters.book);
            });
        }

        // Tag filter: Show rows with ANY selected tag (OR logic)
        // Special mode: "__ONLY_TAGGED__" shows only rows with at least one tag
        if (Array.isArray(filters.tags) && filters.tags.length > 0) {
            const ONLY_TAGGED_MODE = '__ONLY_TAGGED__';

            // Check if "Only Tagged" mode is active
            if (filters.tags.length === 1 && filters.tags[0] === ONLY_TAGGED_MODE) {
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

        if (sortConfig.key === 'random') {
            // Deterministic Shuffle using Seed
            // We need a stable seed to ensure the order stays the same 
            // even when item attributes (like isMarked) change.
            let seed = sortConfig.seed || 12345;

            const random = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            // Fisher-Yates Shuffle with stable random generator
            for (let i = data.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [data[i], data[j]] = [data[j], data[i]];
            }
        } else if (sortConfig.key) {
            data.sort((a, b) => {
                let va = a[sortConfig.key], vb = b[sortConfig.key];
                if (typeof va === 'string') va = va.toLowerCase();
                if (typeof vb === 'string') vb = vb.toLowerCase();
                return (va < vb ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1);
            });
        }
        return data;
    }, [safeDataList, currentFolderId, searchTerm, filters, sortConfig, viewMode]);

    return { filteredAndSortedData, safeDataList };
};
