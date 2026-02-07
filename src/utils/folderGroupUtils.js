/**
 * folderGroupUtils.js
 * Utilities for detecting folder groups and managing group-specific filter support
 */

// Folder group identifiers
export const FOLDER_GROUPS = {
    KANJI: 'KANJI_GROUP',
    BOOK: 'BOOK_GROUP',
    OTHER: 'OTHER_GROUP'
};

// Filter type constants
export const FILTER_TYPES = {
    BOOK: 'book',
    LESSON: 'lesson',
    CANDO: 'cando',
    TAG: 'tags',
    MARKED: 'marked'
};

// Supported filters per group
const GROUP_FILTER_SUPPORT = {
    [FOLDER_GROUPS.KANJI]: [
        FILTER_TYPES.BOOK,
        FILTER_TYPES.LESSON,
        FILTER_TYPES.CANDO,
        FILTER_TYPES.TAG,
        FILTER_TYPES.MARKED
    ],
    [FOLDER_GROUPS.BOOK]: [
        FILTER_TYPES.LESSON,
        FILTER_TYPES.CANDO,
        FILTER_TYPES.TAG,
        FILTER_TYPES.MARKED
    ],
    [FOLDER_GROUPS.OTHER]: [
        FILTER_TYPES.TAG,
        FILTER_TYPES.MARKED
    ]
};

/**
 * Detect which group a folder belongs to based on its name
 * @param {string} folderName - The name of the folder
 * @returns {string} Group identifier (KANJI_GROUP, BOOK_GROUP, or OTHER_GROUP)
 */
export function getFolderGroup(folderName) {
    if (!folderName || typeof folderName !== 'string') {
        return FOLDER_GROUPS.OTHER;
    }

    const normalizedName = folderName.toLowerCase();

    // Check for Kanji group
    if (normalizedName.includes('kanji')) {
        return FOLDER_GROUPS.KANJI;
    }

    // Check for Book group
    if (normalizedName.includes('book')) {
        return FOLDER_GROUPS.BOOK;
    }

    // Default to OTHER group
    return FOLDER_GROUPS.OTHER;
}

/**
 * Get the folder group for a given folder ID
 * @param {string} folderId - The folder ID
 * @param {Array} folders - Array of folder objects with id and name properties
 * @returns {string} Group identifier
 */
export function getFolderGroupById(folderId, folders) {
    if (!folderId || !folders || !Array.isArray(folders)) {
        return FOLDER_GROUPS.OTHER;
    }

    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
        return FOLDER_GROUPS.OTHER;
    }

    return getFolderGroup(folder.name);
}

/**
 * Get array of supported filter types for a group
 * @param {string} groupId - Group identifier
 * @returns {string[]} Array of supported filter type keys
 */
export function getSupportedFilters(groupId) {
    return GROUP_FILTER_SUPPORT[groupId] || GROUP_FILTER_SUPPORT[FOLDER_GROUPS.OTHER];
}

/**
 * Check if a specific filter type is supported by a group
 * @param {string} filterType - Filter type to check
 * @param {string} groupId - Group identifier
 * @returns {boolean} True if filter is supported
 */
export function isFilterSupported(filterType, groupId) {
    const supportedFilters = getSupportedFilters(groupId);
    return supportedFilters.includes(filterType);
}

/**
 * Remove unsupported filters from a filter object for a given group
 * @param {Object} filters - Filter object with filter types as keys
 * @param {string} groupId - Group identifier
 * @returns {Object} Cleaned filter object with only supported filters
 */
export function filterUnsupportedFilters(filters, groupId) {
    if (!filters || typeof filters !== 'object') {
        return {};
    }

    const supportedFilters = getSupportedFilters(groupId);
    const cleanedFilters = {};

    // Only include filters that are supported by this group
    supportedFilters.forEach(filterType => {
        if (filters.hasOwnProperty(filterType)) {
            cleanedFilters[filterType] = filters[filterType];
        }
    });

    return cleanedFilters;
}

/**
 * Get default/empty filter state for a group
 * @param {string} groupId - Group identifier
 * @returns {Object} Default filter object with empty values
 */
export function getDefaultFiltersForGroup(groupId) {
    const supportedFilters = getSupportedFilters(groupId);
    const defaultFilters = {};

    // Set defaults for supported filters
    supportedFilters.forEach(filterType => {
        if (filterType === FILTER_TYPES.TAG || filterType === FILTER_TYPES.TAGS) {
            defaultFilters[filterType] = [];
        } else if (filterType === FILTER_TYPES.LESSON || filterType === FILTER_TYPES.CANDO) {
            defaultFilters[filterType] = [];
        } else if (filterType === FILTER_TYPES.BOOK) {
            defaultFilters[filterType] = 'all';
        } else if (filterType === FILTER_TYPES.MARKED) {
            defaultFilters[filterType] = false;
        } else {
            defaultFilters[filterType] = [];
        }
    });

    return defaultFilters;
}
