
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
