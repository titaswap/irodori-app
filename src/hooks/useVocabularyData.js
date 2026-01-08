
import { useMemo } from 'react';

export const useVocabularyData = (vocabList = [], currentFolderId, searchTerm, filters, sortConfig, viewMode, isEditMode, draftVocabList) => {
    const activeDataList = isEditMode ? draftVocabList : vocabList;
    const safeDataList = Array.isArray(activeDataList) ? activeDataList : [];

    const filteredAndSortedData = useMemo(() => {
        let data = [...safeDataList];
        if (currentFolderId !== 'root') data = data.filter(i => i.folderId === currentFolderId);
        if (searchTerm) { const l = searchTerm.toLowerCase(); data = data.filter(i => i.japanese.includes(l) || i.bangla.includes(l) || i.kanji.includes(l)); }

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
        else if (viewMode === 'weak') data = data.filter(i => i.confidence < 60 || i.mistakes >= 3);

        if (sortConfig.key === 'random') {
            // Fisher-Yates Shuffle
            for (let i = data.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
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

    const trendData = useMemo(() => {
        if (!vocabList || !Array.isArray(vocabList)) return [];

        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });
        return last7Days.map(date => {
            const practicedItems = vocabList.filter(v => v.last_practiced && v.last_practiced.startsWith(date));
            let score = 0; let hasActivity = practicedItems.length > 0;
            if (hasActivity) {
                const avgConf = practicedItems.reduce((sum, v) => sum + (v.confidence || 0), 0) / practicedItems.length;
                const avgMistakes = practicedItems.reduce((sum, v) => sum + (v.mistakes || 0), 0) / practicedItems.length;
                score = Math.max(0, avgConf - (avgMistakes * 10));
            }
            return { date, score, hasActivity };
        });
    }, [vocabList]);

    const weaknessSuggestion = useMemo(() => {
        if (!vocabList || !Array.isArray(vocabList)) return null;
        const weakItems = vocabList.filter(v => v.confidence < 60 || v.mistakes >= 3 || v.isMarked);
        if (weakItems.length === 0) return null;
        const grouping = {};
        weakItems.forEach(item => {
            const key = `${item.lesson}-${item.cando}`;
            if (!grouping[key]) grouping[key] = { count: 0, lesson: item.lesson, cando: item.cando };
            grouping[key].count++;
        });
        return Object.values(grouping).sort((a, b) => b.count - a.count)[0] || null;
    }, [vocabList]);

    return { filteredAndSortedData, trendData, weaknessSuggestion, safeDataList };
};
