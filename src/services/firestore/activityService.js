/**
 * activityService.js
 * 
 * RESPONSIBILITY:
 * - Handle reading and writing Learning Progress (marks).
 * - This will eventually replace the Google Sheets "sync" logic for progress data.
 */

import { getDb } from './firestoreClient';
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, writeBatch } from "firebase/firestore";
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

        // Add timeout protection to prevent blocking when offline
        const snapshotPromise = getDocs(colRef);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('getDocs timeout')), 2000)
        );

        const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);

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
        console.warn("[Firestore] Progress fetch skipped (offline/timeout):", e.message);
        return {};
    }
};

/**
 * Update progress for a single item.
 * @param {string} itemId 
 * @param {Object} partialData - e.g. { isMarked: true }
 * @param {boolean} skipQueue - If true, skip queue (used during queue replay)
 */
export const updateProgress = async (itemId, partialData, skipQueue = false) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    if (!userId) {
        console.warn("[Firestore] No user ID available. Skipping save.");
        return;
    }

    let operationId = null;

    // 1. Enqueue operation FIRST (unless replaying from queue)
    if (!skipQueue) {
        const { enqueueOperation, dequeueOperation } = await import('../offlineSyncQueue');
        operationId = enqueueOperation('updateProgress', {
            itemId,
            data: partialData,
            userId
        });
    }

    // 2. Attempt immediate Firestore write
    try {
        console.log(`[Firestore] Updating progress for ${itemId}`, partialData);
        const docRef = doc(db, "users", userId, "progress", itemId);
        await setDoc(docRef, { ...partialData, updatedAt: new Date().toISOString() }, { merge: true });

        // 3. Success → Remove from queue
        if (operationId) {
            const { dequeueOperation } = await import('../offlineSyncQueue');
            dequeueOperation(operationId);
            console.log(`[Firestore] ✓ updateProgress succeeded, dequeued ${operationId}`);
        }
    } catch (e) {
        if (operationId) {
            console.warn(`[Firestore] ✗ updateProgress failed, queued as ${operationId}`, e.message);
        } else {
            console.error("[Firestore] Failed to update progress (queue replay)", e);
        }
        throw e; // Rethrow to let UI handle optimism revert
    }
};

/**
 * Add a tag snapshot to an item's tags array
 * Progress documents now store tag snapshots {id, name} instead of just tagIds
 * This ensures instant display and offline compatibility
 * @param {string} itemId - The item ID
 * @param {string} tagId - The tag ID
 * @param {string} tagName - The tag name
 * @param {boolean} skipQueue - If true, skip queue (used during queue replay)
 */
export const addTagIdToProgress = async (itemId, tagId, tagName, skipQueue = false) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    console.log(`[Firestore] addTagIdToProgress called for itemId: ${itemId}, tagId: ${tagId}, tagName: ${tagName}. User: ${userId}`);

    if (!userId) {
        const error = new Error("User not authenticated");
        console.error("[Firestore] Cannot add tag: User not authenticated");
        throw error;
    }

    if (!tagName) {
        console.error("[Firestore] tagName is required for snapshot storage");
        throw new Error("tagName is required");
    }

    const tagSnapshot = { id: tagId, name: tagName };

    let operationId = null;

    // 1. Enqueue operation FIRST (unless replaying from queue)
    if (!skipQueue) {
        const { enqueueOperation } = await import('../offlineSyncQueue');
        operationId = enqueueOperation('addTag', {
            itemId,
            tagId,
            tagName,
            userId
        });
    }

    // 2. Attempt immediate Firestore write
    try {
        console.log(`[Firestore] Adding tag snapshot to progress/${itemId}:`, tagSnapshot);
        const docRef = doc(db, "users", userId, "progress", itemId);
        await updateDoc(docRef, {
            tags: arrayUnion(tagSnapshot),
            updatedAt: new Date().toISOString()
        });
        console.log(`[Firestore] Successfully added tag snapshot to ${itemId}`);

        // 3. Success → Remove from queue
        if (operationId) {
            const { dequeueOperation } = await import('../offlineSyncQueue');
            dequeueOperation(operationId);
            console.log(`[Firestore] ✓ addTag succeeded, dequeued ${operationId}`);
        }
    } catch (e) {
        console.warn(`[Firestore] updateDoc failed for ${itemId}, error: ${e.code}. trying setDoc...`, e);
        // If document doesn't exist, create it with setDoc
        if (e.code === 'not-found') {
            try {
                const docRef = doc(db, "users", userId, "progress", itemId);
                await setDoc(docRef, {
                    tags: [tagSnapshot],
                    updatedAt: new Date().toISOString()
                });
                console.log(`[Firestore] Created new progress doc for ${itemId} with tag snapshot`);

                // Success → Remove from queue
                if (operationId) {
                    const { dequeueOperation } = await import('../offlineSyncQueue');
                    dequeueOperation(operationId);
                    console.log(`[Firestore] ✓ addTag succeeded (setDoc), dequeued ${operationId}`);
                }
            } catch (innerError) {
                console.error("[Firestore] Failed to create new progress doc", innerError);
                if (operationId) {
                    console.warn(`[Firestore] ✗ addTag failed, queued as ${operationId}`, innerError.message);
                }
                throw innerError;
            }
        } else {
            console.error("[Firestore] Failed to add tag snapshot (updateDoc)", e);
            if (operationId) {
                console.warn(`[Firestore] ✗ addTag failed, queued as ${operationId}`, e.message);
            }
            throw e;
        }
    }
};

/**
 * Remove a tag snapshot from an item's tags array
 * Handles snapshot objects {id, name} instead of just tagIds
 * @param {string} itemId - The item ID
 * @param {string} tagId - The tag ID to remove
 * @param {boolean} skipQueue - If true, skip queue (used during queue replay)
 */
export const removeTagIdFromProgress = async (itemId, tagId, skipQueue = false) => {
    const db = getDb();
    if (!db) return;

    const userId = getUserId();
    console.log(`[Firestore] removeTagIdFromProgress called for itemId: ${itemId}, tagId: ${tagId}. User: ${userId}`);

    if (!userId) {
        const error = new Error("User not authenticated");
        console.error("[Firestore] Cannot remove tag: User not authenticated");
        throw error;
    }

    let operationId = null;

    // 1. Enqueue operation FIRST (unless replaying from queue)
    if (!skipQueue) {
        const { enqueueOperation } = await import('../offlineSyncQueue');
        operationId = enqueueOperation('removeTag', {
            itemId,
            tagId,
            userId
        });
    }

    // 2. Attempt immediate Firestore write
    try {
        console.log(`[Firestore] Removing tag snapshot with id "${tagId}" from progress/${itemId}`);
        const docRef = doc(db, "users", userId, "progress", itemId);

        // Read current tags, filter out the one with matching id, then write back
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.warn(`[Firestore] Progress doc ${itemId} does not exist`);

            // Success (no-op) → Remove from queue
            if (operationId) {
                const { dequeueOperation } = await import('../offlineSyncQueue');
                dequeueOperation(operationId);
                console.log(`[Firestore] ✓ removeTag succeeded (doc not found), dequeued ${operationId}`);
            }
            return;
        }

        const currentTags = docSnap.data().tags || [];
        const newTags = currentTags.filter(tag => {
            // Handle both old format (string) and new format (object)
            if (typeof tag === 'string') {
                return tag !== tagId;
            }
            return tag.id !== tagId;
        });

        await updateDoc(docRef, {
            tags: newTags,
            updatedAt: new Date().toISOString()
        });
        console.log(`[Firestore] Successfully removed tag snapshot from ${itemId}`);

        // 3. Success → Remove from queue
        if (operationId) {
            const { dequeueOperation } = await import('../offlineSyncQueue');
            dequeueOperation(operationId);
            console.log(`[Firestore] ✓ removeTag succeeded, dequeued ${operationId}`);
        }
    } catch (e) {
        console.error("[Firestore] Failed to remove tag snapshot", e);
        if (operationId) {
            console.warn(`[Firestore] ✗ removeTag failed, queued as ${operationId}`, e.message);
        }
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

/**
 * Batch update tag name in all progress documents
 * Used when a tag is renamed in the global registry
 * Updates the name field in all tag snapshots with matching tagId
 * @param {string} tagId - The tag ID to update
 * @param {string} newName - The new tag name
 * @returns {Promise<number>} Number of documents updated
 */
export const batchUpdateTagNameInProgress = async (tagId, newName) => {
    const db = getDb();
    if (!db) return 0;

    const userId = getUserId();
    if (!userId) {
        console.error("[Firestore] Cannot batch update: User not authenticated");
        throw new Error("User not authenticated");
    }

    try {
        console.log(`[Firestore] Batch updating tag name for tagId ${tagId} to "${newName}"`);
        const progressRef = collection(db, "users", userId, "progress");
        const snapshot = await getDocs(progressRef);

        console.log(`[Firestore] Found ${snapshot.size} progress documents to check`);

        let updateCount = 0;
        const batchSize = 500; // Firestore batch limit
        let currentBatch = writeBatch(db);
        let batchCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const tags = data.tags || [];

            // Check if this document has the tag
            let hasTag = false;
            const updatedTags = tags.map(tag => {
                // Handle both old format (string) and new format (object)
                if (typeof tag === 'string') {
                    if (tag === tagId) {
                        hasTag = true;
                        return { id: tagId, name: newName }; // Convert to snapshot
                    }
                    return tag;
                }
                if (tag.id === tagId) {
                    hasTag = true;
                    return { ...tag, name: newName }; // Update name in snapshot
                }
                return tag;
            });

            if (hasTag) {
                const docRef = doc(db, "users", userId, "progress", docSnap.id);
                currentBatch.update(docRef, {
                    tags: updatedTags,
                    updatedAt: new Date().toISOString()
                });
                batchCount++;
                updateCount++;

                // Commit batch if we hit the limit
                if (batchCount >= batchSize) {
                    console.log(`[Firestore] Committing batch of ${batchCount} updates...`);
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    batchCount = 0;
                }
            }
        }

        // Commit remaining updates
        if (batchCount > 0) {
            console.log(`[Firestore] Committing final batch of ${batchCount} updates...`);
            await currentBatch.commit();
        }

        console.log(`[Firestore] ✓ Batch update complete: Updated ${updateCount} progress documents`);
        return updateCount;
    } catch (e) {
        console.error("[Firestore] ✗ Batch update failed", e);
        throw e;
    }
};

/**
 * Batch remove tag from all progress documents
 * Used when a tag is deleted from the global registry
 * Removes all tag snapshots with matching tagId
 * @param {string} tagId - The tag ID to remove
 * @returns {Promise<number>} Number of documents updated
 */
export const batchRemoveTagFromProgress = async (tagId) => {
    const db = getDb();
    if (!db) return 0;

    const userId = getUserId();
    if (!userId) {
        console.error("[Firestore] Cannot batch remove: User not authenticated");
        throw new Error("User not authenticated");
    }

    try {
        console.log(`[Firestore] Batch removing tag ${tagId} from all progress documents`);
        const progressRef = collection(db, "users", userId, "progress");
        const snapshot = await getDocs(progressRef);

        console.log(`[Firestore] Found ${snapshot.size} progress documents to check`);

        let updateCount = 0;
        const batchSize = 500; // Firestore batch limit
        let currentBatch = writeBatch(db);
        let batchCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const tags = data.tags || [];

            // Filter out the tag with matching id
            const updatedTags = tags.filter(tag => {
                // Handle both old format (string) and new format (object)
                if (typeof tag === 'string') {
                    return tag !== tagId;
                }
                return tag.id !== tagId;
            });

            // Only update if tags changed
            if (updatedTags.length !== tags.length) {
                const docRef = doc(db, "users", userId, "progress", docSnap.id);
                currentBatch.update(docRef, {
                    tags: updatedTags,
                    updatedAt: new Date().toISOString()
                });
                batchCount++;
                updateCount++;

                // Commit batch if we hit the limit
                if (batchCount >= batchSize) {
                    console.log(`[Firestore] Committing batch of ${batchCount} removals...`);
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    batchCount = 0;
                }
            }
        }

        // Commit remaining updates
        if (batchCount > 0) {
            console.log(`[Firestore] Committing final batch of ${batchCount} removals...`);
            await currentBatch.commit();
        }

        console.log(`[Firestore] ✓ Batch remove complete: Updated ${updateCount} progress documents`);
        return updateCount;
    } catch (e) {
        console.error("[Firestore] ✗ Batch remove failed", e);
        throw e;
    }
};
