import { useState } from 'react';

export const useKanjiColumnVisibility = () => {
    const [isKanjiVisible, setIsKanjiVisible] = useState(true);

    const toggleKanji = () => {
        setIsKanjiVisible(prev => !prev);
    };

    return {
        isKanjiVisible,
        toggleKanji
    };
};
