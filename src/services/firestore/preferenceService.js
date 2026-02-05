/**
 * preferenceService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing User Preferences (rowsPerPage, columnOrder, etc.) to Firestore.
 * - Provide a consistent API that `preferenceStore.js` can eventually switch to.
 */

import { getDb } from './firestoreClient';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getUserId } from '../userService';
import { getColumnConfigKey } from '../../utils/columnConfigMapper';

/**
 * Load all user preferences (config) from Firestore.
 * @returns {Promise<Object|null>} The stored config object or null.
 */
export const loadUserConfig = async () => {
    try {
        const db = getDb();
        if (!db) return null;

        const userId = getUserId();
        if (!userId) return null; // Silent skip if offline/not logged in

        const docRef = doc(db, "users", userId, "preferences", "config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (e) {
        // Silent fail - offline or network error
        return null;
    }
};

/**
 * Save partial config to Firestore.
 * @param {Object} changes - e.g., { rowsPerPage: 100, columnOrder: [...] }
 */
export const saveUserConfig = async (changes) => {
    try {
        const db = getDb();
        if (!db) return;

        const userId = getUserId();
        if (!userId) return; // Silent skip if offline/not logged in

        const docRef = doc(db, "users", userId, "preferences", "config");
        await setDoc(docRef, changes, { merge: true });
    } catch (e) {
        // Silent fail - offline or network error
    }
};

/**
 * Load folder-specific table configuration (columns, widths, visibility).
 * Path: users/{uid}/tableConfig/{folderId}
 */
export const loadFolderConfig = async (folderId) => {
    try {
        const db = getDb();
        if (!db) return null;

        const userId = getUserId();
        if (!userId || !folderId) return null; // Silent skip if offline/not logged in

        const configKey = getColumnConfigKey(folderId);
        if (!configKey) return null;

        const docRef = doc(db, "users", userId, "tableConfig", configKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (e) {
        // Silent fail - offline or network error
        return null;
    }
};

/**
 * Save folder-specific table configuration.
 * Path: users/{uid}/tableConfig/{folderId}
 */
export const saveFolderConfig = async (folderId, config) => {
    try {
        const db = getDb();
        if (!db) return;

        const userId = getUserId();
        if (!userId || !folderId) return; // Silent skip if offline/not logged in

        const configKey = getColumnConfigKey(folderId);
        if (!configKey) return;

        const docRef = doc(db, "users", userId, "tableConfig", configKey);
        await setDoc(docRef, config, { merge: true });
    } catch (e) {
        // Silent fail - offline or network error
    }
};

/**
 * Migrate existing Book folder configs to BOOK_SHARED
 * Called once on first load if BOOK_SHARED doesn't exist
 * Provides backward compatibility for existing users
 */
export const migrateBookFolderConfig = async () => {
    try {
        const db = getDb();
        if (!db) return;

        const userId = getUserId();
        if (!userId) return; // Silent skip if offline/not logged in

        // Check if BOOK_SHARED already exists
        const sharedRef = doc(db, "users", userId, "tableConfig", "BOOK_SHARED");
        const sharedSnap = await getDoc(sharedRef);

        if (sharedSnap.exists()) {
            return; // Already migrated
        }

        // Try to find config from any Book folder
        const bookFolders = ['Book 1', 'Book 2', 'Book 3', 'Book 4', 'Book 5'];

        for (const bookFolder of bookFolders) {
            const bookRef = doc(db, "users", userId, "tableConfig", bookFolder);
            const bookSnap = await getDoc(bookRef);

            if (bookSnap.exists()) {
                // Copy config to BOOK_SHARED
                await setDoc(sharedRef, bookSnap.data());
                return;
            }
        }
    } catch (e) {
        // Silent fail - offline or network error
    }
};

/**
 * Reset column configuration for a folder
 * For Book folders, this resets ALL Book folders (deletes BOOK_SHARED)
 * For other folders, only that folder's config is reset
 * 
 * @param {string} folderId - The folder ID to reset
 */
export const resetFolderConfig = async (folderId) => {
    try {
        const db = getDb();
        if (!db) return;

        const userId = getUserId();
        if (!userId || !folderId) return; // Silent skip if offline/not logged in

        const configKey = getColumnConfigKey(folderId);
        if (!configKey) return;

        const docRef = doc(db, "users", userId, "tableConfig", configKey);
        await deleteDoc(docRef);
    } catch (e) {
        // Silent fail - offline or network error
    }
};

// --- Refactored Aliases (to maintain compatibility if strictly needed, but better to update Store) ---
export const loadRowsPerPage = async () => {
    const config = await loadUserConfig();
    return config?.rowsPerPage || null;
};
export const saveRowsPerPage = async (val) => saveUserConfig({ rowsPerPage: val });

// Deprecated placeholders (kept for interface compatibility if needed later)
export const fetchUserPreferences = async () => null;
export const saveUserPreferences = async () => { };
