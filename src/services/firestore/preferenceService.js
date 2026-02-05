/**
 * preferenceService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing User Preferences (rowsPerPage, columnOrder, etc.) to Firestore.
 * - Provide a consistent API that `preferenceStore.js` can eventually switch to.
 */

import { getDb } from './firestoreClient';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getUserId } from "../userService";

/**
 * Load all user preferences (config) from Firestore.
 * @returns {Promise<Object|null>} The stored config object or null.
 */
export const loadUserConfig = async () => {
    const db = getDb();
    if (!db) return null;

    const userId = getUserId();
    if (!userId) {
        console.warn("[Firestore] No user ID available. Skipping load.");
        return null;
    }

    try {
        console.log(`[Firestore] Fetching config for ${userId}`);
        const docRef = doc(db, "users", userId, "preferences", "config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.error("[Firestore] Failed to load config", e);
        return null;
    }
};

/**
 * Save partial config to Firestore.
 * @param {Object} changes - e.g., { rowsPerPage: 100, columnOrder: [...] }
 */
export const saveUserConfig = async (changes) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    if (!userId) {
        console.warn("[Firestore] No user ID available. Skipping save.");
        return;
    }

    try {
        console.log(`[Firestore] Saving config for ${userId}`, changes);
        const docRef = doc(db, "users", userId, "preferences", "config");
        await setDoc(docRef, changes, { merge: true });
    } catch (e) {
        console.error("[Firestore] Failed to save config", e);
    }
};

/**
 * Load folder-specific table configuration (columns, widths, visibility).
 * Path: users/{uid}/tableConfig/{folderId}
 */
export const loadFolderConfig = async (folderId) => {
    const db = getDb();
    if (!db) return null;

    const userId = getUserId();
    if (!userId || !folderId) return null;

    try {
        console.log(`[Firestore] Fetching table config for ${folderId}`);
        const docRef = doc(db, "users", userId, "tableConfig", folderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.error(`[Firestore] Failed to load table config for ${folderId}`, e);
        return null;
    }
};

/**
 * Save folder-specific table configuration.
 * Path: users/{uid}/tableConfig/{folderId}
 */
export const saveFolderConfig = async (folderId, config) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    if (!userId || !folderId) return;

    try {
        // Debounce logic could be here, but usually handled by hook
        const docRef = doc(db, "users", userId, "tableConfig", folderId);
        await setDoc(docRef, config, { merge: true });
    } catch (e) {
        console.error(`[Firestore] Failed to save table config for ${folderId}`, e);
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
