/**
 * tagFilterStorage.js
 * Centralized localStorage management for tag filter persistence
 */

const STORAGE_KEY = 'irodori:selectedTagFilters';

export const tagFilterStorage = {
    /**
     * Save tag filters to localStorage
     * @param {string[]} tags - Array of selected tag names
     */
    save: (tags) => {
        try {
            if (Array.isArray(tags) && tags.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
            } else {
                // Clear storage when no tags selected
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.warn('Failed to save tag filters:', e);
        }
    },

    /**
     * Load tag filters from localStorage
     * @returns {string[]} Array of selected tag names, or empty array if none saved
     */
    load: () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load tag filters:', e);
            return [];
        }
    },

    /**
     * Clear tag filters from localStorage
     */
    clear: () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear tag filters:', e);
        }
    }
};
