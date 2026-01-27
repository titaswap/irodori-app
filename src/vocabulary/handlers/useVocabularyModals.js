/**
 * Vocabulary Modals Handler Hook
 * Manages delete and other modal interactions
 */

import { useCallback } from 'react';

export function useVocabularyModals({
    setSelectedIds
}) {
    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id);
            else s.add(id);
            return s;
        });
    }, [setSelectedIds]);

    return { toggleSelection };
}
