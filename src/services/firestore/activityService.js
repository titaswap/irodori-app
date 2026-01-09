/**
 * activityService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing Learning Progress (marks, mistakes, confidence, lastPracticed).
 * - This will eventually replace the Google Sheets "sync" logic for progress data.
 * 
 * DATA STRUCTURE (Planned):
 * - Collection: `users/{userId}/progress`
 * - Document: `{itemId}` (or batched documents)
 * - Fields: `isMarked`, `mistakes`, `confidence`, `lastPracticed`
 */

import { getDb } from './firestoreClient';

/**
 * Save a batch of progress updates.
 * @param {string} userId 
 * @param {Array<Object>} updates - Array of objects { id, isMarked, ... }
 */
export const syncProgress = async (userId, updates) => {
    console.log(`[Firestore] Syncing ${updates.length} progress items for user: ${userId} (Placeholder)`);
    // const db = getDb();
    // Implementation: Batch write to Firestore
};

/**
 * Fetch all progress for a user to overlay on static content.
 * @param {string} userId 
 * @returns {Promise<Object>} Map of itemId -> progressData
 */
export const fetchAllProgress = async (userId) => {
    console.log(`[Firestore] Fetching all progress for user: ${userId} (Placeholder)`);
    // Implementation: getDocs(collection(db, "users", userId, "progress"))
    return {};
};
