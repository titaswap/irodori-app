/**
 * activityService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing Learning Progress (marks, mistakes, confidence, lastPracticed).
 * - This will eventually replace the Google Sheets "sync" logic for progress data.
 */

import { getDb } from './firestoreClient';
import { collection, getDocs, doc, setDoc } from "firebase/firestore"; // Import needed Firestore functions
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


