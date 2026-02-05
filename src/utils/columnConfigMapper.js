/**
 * columnConfigMapper.js
 * 
 * Maps folder IDs to column configuration keys.
 * Enables shared configuration for related folders (e.g., all Book folders).
 * 
 * Rules:
 * - Folders containing "book" (case-insensitive) → "BOOK_SHARED"
 * - All other folders → "FOLDER_{folderName}"
 */

/**
 * Get the column configuration key for a folder
 * 
 * @param {string} folderId - The folder ID (e.g., "Book 1", "Kanji", "Note")
 * @returns {string|null} - The configuration key or null if invalid
 */
export function getColumnConfigKey(folderId) {
    if (!folderId || typeof folderId !== 'string') {
        return null;
    }

    // Check if folder name contains "book" (case-insensitive)
    if (folderId.toLowerCase().includes('book')) {
        return 'BOOK_SHARED';
    }

    // All other folders get their own unique key
    return `FOLDER_${folderId}`;
}

/**
 * Check if a folder ID belongs to the Book group
 * 
 * @param {string} folderId - The folder ID
 * @returns {boolean} - True if folder is a Book folder
 */
export function isBookFolder(folderId) {
    if (!folderId || typeof folderId !== 'string') {
        return false;
    }
    return folderId.toLowerCase().includes('book');
}
