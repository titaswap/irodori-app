/**
 * activityService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing Learning Progress (marks).
 * - This will eventually replace the Google Sheets "sync" logic for progress data.
 */

import { getDb } from './firestoreClient';
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { getUserId } from "../userService";

/**
 * Fetch all progress for a user to overlay on static content.
 * @returns {Promise<Object>} Map of itemId -> progressData
 */
export const fetchAllProgress = async () => {
    const db = getDb();
    if (!db) return {};

    const userId = getUserId();
    if (!userId) {
        console.warn("[Firestore] No user ID available for progress fetch.");
        return {};
    }

    try {
        console.log(`[Firestore] Fetching learning progress for ${userId}`);
        const colRef = collection(db, "users", userId, "progress");
        const snapshot = await getDocs(colRef);

        const progressMap = {};
        if (snapshot.empty) {
            console.log("[Firestore] No progress data found.");
            return {};
        }

        snapshot.forEach(doc => {
            progressMap[doc.id] = doc.data();
        });

        console.log(`[Firestore] Loaded ${Object.keys(progressMap).length} progress items.`);
        return progressMap;
    } catch (e) {
        console.error("[Firestore] Failed to fetch progress", e);
        return {};
    }
};

/**
 * Update progress for a single item.
 * @param {string} itemId 
 * @param {Object} partialData - e.g. { isMarked: true }
 */
export const updateProgress = async (itemId, partialData) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    if (!userId) {
        console.warn("[Firestore] No user ID available. Skipping save.");
        return;
    }

    try {
        console.log(`[Firestore] Updating progress for ${itemId}`, partialData);
        const docRef = doc(db, "users", userId, "progress", itemId);
        await setDoc(docRef, { ...partialData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
        console.error("[Firestore] Failed to update progress", e);
        throw e; // Rethrow to let UI handle optimism revert
    }
};

/**
 * Add a tag ID to an item's tags array using Firestore arrayUnion
 * Progress documents now store tagIds instead of tag names
 * @param {string} itemId 
 * @param {string} tagId - The tag ID to add
 */
export const addTagIdToProgress = async (itemId, tagId) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    console.log(`[Firestore] addTagIdToProgress called for itemId: ${itemId}, tagId: ${tagId}. User: ${userId}`);

    if (!userId) {
        const error = new Error("User not authenticated");
        console.error("[Firestore] Cannot add tag: User not authenticated");
        throw error;
    }

    try {
        console.log(`[Firestore] Adding tagId "${tagId}" to progress/${itemId} for user ${userId}`);
        const docRef = doc(db, "users", userId, "progress", itemId);
        await updateDoc(docRef, {
            tags: arrayUnion(tagId),
            updatedAt: new Date().toISOString()
        });
        console.log(`[Firestore] Successfully added tagId "${tagId}" to ${itemId}`);
    } catch (e) {
        console.warn(`[Firestore] updateDoc failed for ${itemId}, error: ${e.code}. trying setDoc...`, e);
        // If document doesn't exist, create it with setDoc
        if (e.code === 'not-found') {
            try {
                const docRef = doc(db, "users", userId, "progress", itemId);
                await setDoc(docRef, {
                    tags: [tagId],
                    updatedAt: new Date().toISOString()
                });
                console.log(`[Firestore] Created new progress doc for ${itemId} with tagId "${tagId}"`);
            } catch (innerError) {
                console.error("[Firestore] Failed to create new progress doc", innerError);
                throw innerError;
            }
        } else {
            console.error("[Firestore] Failed to add tag ID (updateDoc)", e);
            throw e;
        }
    }
};

/**
 * Remove a tag ID from an item's tags array using Firestore arrayRemove
 * @param {string} itemId 
 * @param {string} tagId - The tag ID to remove
 */
export const removeTagIdFromProgress = async (itemId, tagId) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    console.log(`[Firestore] removeTagIdFromProgress called for itemId: ${itemId}, tagId: ${tagId}. User: ${userId}`);

    if (!userId) {
        const error = new Error("User not authenticated");
        console.error("[Firestore] Cannot remove tag: User not authenticated");
        throw error;
    }

    try {
        console.log(`[Firestore] Removing tagId "${tagId}" from progress/${itemId}`);
        const docRef = doc(db, "users", userId, "progress", itemId);
        await updateDoc(docRef, {
            tags: arrayRemove(tagId),
            updatedAt: new Date().toISOString()
        });
        console.log(`[Firestore] Successfully removed tagId "${tagId}" from ${itemId}`);
    } catch (e) {
        console.error("[Firestore] Failed to remove tag ID", e);
        throw e;
    }
};

/**
 * @deprecated Use addTagIdToProgress instead
 * Keeping for backward compatibility during transition
 */
export const addTagToProgress = async (itemId, tag) => {
    console.warn("[Firestore] addTagToProgress is deprecated. Use addTagIdToProgress instead.");
    return addTagIdToProgress(itemId, tag);
};

/**
 * @deprecated Use removeTagIdFromProgress instead
 * Keeping for backward compatibility during transition
 */
export const removeTagFromProgress = async (itemId, tag) => {
    console.warn("[Firestore] removeTagFromProgress is deprecated. Use removeTagIdFromProgress instead.");
    return removeTagIdFromProgress(itemId, tag);
};

/**
 * Fetch progress for a single item.
 * @param {string} itemId
 * @returns {Promise<Object|null>} Progress data or null
 */
export const fetchItemProgress = async (itemId) => {
    const db = getDb();
    if (!db) return null;

    const userId = getUserId();
    if (!userId) return null;

    try {
        const docRef = doc(db, "users", userId, "progress", itemId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    } catch (e) {
        console.error("[Firestore] Failed to fetch item progress", e);
        return null;
    }
};

