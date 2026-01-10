import { useMemo } from 'react';

/**
 * Calculates result counts for display, ensuring consistency between Mobile and Desktop.
 * 
 * @param {Array} globalVocabList - The full list of all vocabulary items
 * @param {Array} filteredData - The currently visible/filtered list
 * @param {string} currentFolderId - The ID of the current folder ('root' for all)
 * @returns {Object} { showingCount, totalCount }
 */
export const useResultStats = (globalVocabList, filteredData, currentFolderId) => {
    return useMemo(() => {
        // Calculate Total Base Count (Denominator)
        let totalCount = 0;
        if (currentFolderId === 'root') {
            totalCount = globalVocabList.length;
        } else {
            // Count items belonging to the current folder
            totalCount = globalVocabList.filter(v => v.folderId === currentFolderId).length;
        }

        // Calculate Showing Count (Numerator)
        const showingCount = filteredData.length;

        return { showingCount, totalCount };
    }, [globalVocabList, filteredData, currentFolderId]);
};
