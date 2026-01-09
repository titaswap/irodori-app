/**
 * preferenceService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing User Preferences (rowsPerPage, columnOrder, etc.) to Firestore.
 * - Provide a consistent API that `preferenceStore.js` can eventually switch to.
 * 
 * DATA STRUCTURE (Planned):
 * - Collection: `users`
 * - Document: `{userId}`
 * - Sub-collection or Field: `preferences`
 */

import { getDb } from './firestoreClient';

import { doc, getDoc, setDoc } from "firebase/firestore";

const DEMO_USER_ID = 'demoUser'; // Placeholder for Phase 5

/**
 * Load all user preferences (config) from Firestore.
 * @returns {Promise<Object|null>} The stored config object or null.
 */
export const loadUserConfig = async () => {
    const db = getDb();
    if (!db) return null;

    try {
        console.log(`[Firestore] Fetching config for ${DEMO_USER_ID}`);
        const docRef = doc(db, "users", DEMO_USER_ID, "preferences", "config");
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

    try {
        console.log(`[Firestore] Saving config for ${DEMO_USER_ID}`, changes);
        const docRef = doc(db, "users", DEMO_USER_ID, "preferences", "config");
        await setDoc(docRef, changes, { merge: true });
    } catch (e) {
        console.error("[Firestore] Failed to save config", e);
    }
};

// --- Refactored Aliases (to maintain compatibility if strictly needed, but better to update Store) ---
export const loadRowsPerPage = async () => {
    const config = await loadUserConfig();
    return config?.rowsPerPage || null;
};
export const saveRowsPerPage = async (val) => saveUserConfig({ rowsPerPage: val });


// Deprecated placeholders (kept for interface compatibility if needed later)
export const fetchUserPreferences = async (userId) => null;
export const saveUserPreferences = async (userId, preferences) => { };

