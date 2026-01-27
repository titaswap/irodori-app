/**
 * Practice Mode Hook
 * Manages practice mode state and queue generation
 */

export function usePracticeMode({
    practiceQueue,
    setPracticeQueue,
    currentCardIndex,
    setCurrentCardIndex,
    practiceModeActive,
    setPracticeModeActive,
    filteredAndSortedData,
    vocabList,
    showToast,
    attemptAction
}) {
    // Start Practice (Standard Mode)
    const startPractice = (mode = 'standard') => {
        let queue = filteredAndSortedData;
        if (mode === 'smart') queue = queue.filter(v => v.isMarked);
        if (queue.length === 0) queue = filteredAndSortedData.slice(0, 10);
        if (queue.length === 0) {
            showToast('No words to practice!', 'error');
            return;
        }
        setPracticeQueue([...queue].sort(() => Math.random() - 0.5));
        setCurrentCardIndex(0);
        setPracticeModeActive(true);
    };

    // Handle Practice Start (with attemptAction wrapper)
    const handlePracticeStart = () => attemptAction(() => startPractice());

    // Handle Smart Practice Start
    const handleStartSmartPractice = () => attemptAction(() => {
        const problemItems = vocabList.filter(v => v.isMarked);
        const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
        let queue = [...shuffle(problemItems).slice(0, 15), ...shuffle(vocabList.filter(v => !v.isMarked)).slice(0, 5)];
        if (queue.length === 0) queue = shuffle(vocabList).slice(0, 20);
        setPracticeQueue(queue);
        setCurrentCardIndex(0);
        setPracticeModeActive(true);
    });

    // Next Card
    const nextCard = () => {
        if (currentCardIndex < practiceQueue.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            finishPractice();
        }
    };

    // Previous Card
    const previousCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
        }
    };

    // Finish Practice
    const finishPractice = () => {
        setPracticeModeActive(false);
        setPracticeQueue([]);
        setCurrentCardIndex(0);
    };

    return {
        startPractice,
        handlePracticeStart,
        handleStartSmartPractice,
        nextCard,
        previousCard,
        finishPractice
    };
}
