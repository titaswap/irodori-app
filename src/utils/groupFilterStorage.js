/**
 * groupFilterStorage.js
 * Centralized localStorage management for group-based filter persistence
 */

const STORAGE_KEY_PREFIX = 'irodori:filters:group:';

export const groupFilterStorage = {
    /**
     * Save filters for a specific group
     * @param {string} groupId - Group identifier (KANJI_GROUP, BOOK_GROUP, etc.)
     * @param {Object} filters - Filter object to save
     */
    saveGroupFilters: (groupId, filters) => {
        try {
            const key = `${STORAGE_KEY_PREFIX}${groupId}`;
            if (filters && Object.keys(filters).length > 0) {
                localStorage.setItem(key, JSON.stringify(filters));
            } else {
                // Clear storage when filters are empty
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn(`Failed to save filters for group ${groupId}:`, e);
        }
    },

    /**
     * Load filters for a specific group
     * @param {string} groupId - Group identifier
     * @returns {Object|null} Saved filter object, or null if none saved
     */
    loadGroupFilters: (groupId) => {
        try {
            const key = `${STORAGE_KEY_PREFIX}${groupId}`;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.warn(`Failed to load filters for group ${groupId}:`, e);
            return null;
        }
    },

    /**
     * Clear filters for a specific group
     * @param {string} groupId - Group identifier
     */
    clearGroupFilters: (groupId) => {
        try {
            const key = `${STORAGE_KEY_PREFIX}${groupId}`;
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Failed to clear filters for group ${groupId}:`, e);
        }
    },

    /**
     * Clear all group filters (useful for debugging/reset)
     */
    clearAllGroupFilters: () => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('Failed to clear all group filters:', e);
        }
    },

    /**
     * Get all saved group filter keys (for debugging)
     * @returns {string[]} Array of group IDs that have saved filters
     */
    getSavedGroups: () => {
        try {
            const groups = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                    const groupId = key.replace(STORAGE_KEY_PREFIX, '');
                    groups.push(groupId);
                }
            }
            return groups;
        } catch (e) {
            console.warn('Failed to get saved groups:', e);
            return [];
        }
    }
};
