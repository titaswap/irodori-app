/**
 * tagService.js
 * 
 * RESPONSIBILITY:
 * - Handle all tag CRUD operations in Firestore (users/{uid}/tags collection).
 * - Global tags are first-class entities with name, color, timestamps.
 * - Tags persist across reloads and can exist without being attached to any row.
 */

import { getDb } from './firestoreClient';
import {
    doc,
    collection,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    writeBatch,
    serverTimestamp
} from "firebase/firestore";
import { getUserId } from "../userService";
import { batchUpdateTagNameInProgress, batchRemoveTagFromProgress } from './activityService';

/**
 * Generate a unique tag ID (using Firestore document IDs).
 * @returns {string} A unique ID
 */
/**
 * Generate a unique tag ID (using Firestore document IDs).
 * @returns {string} A unique ID
 */
export const generateTagId = () => {
    return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Fetch all global tags for the current user.
 * @returns {Promise<Array>} Array of tag objects with {tagId, name, color, createdAt, updatedAt}
 */
export const fetchAllTags = async () => {
    const db = getDb();
    if (!db) return [];

    const userId = getUserId();
    if (!userId) {
        console.log("[TagService] No user ID. Returning empty tags.");
        return [];
    }

    try {
        console.log(`[TagService] Fetching all tags for user ${userId}`);
        const tagsRef = collection(db, "users", userId, "tags");
        const snapshot = await getDocs(tagsRef);

        const tags = [];
        snapshot.forEach(docSnap => {
            tags.push({
                tagId: docSnap.id,
                ...docSnap.data()
            });
        });

        console.log(`[TagService] Fetched ${tags.length} tags:`, tags);
        return tags;
    } catch (e) {
        console.error("[TagService] Failed to fetch tags", e);
        return [];
    }
};

/**
 * Create a new global tag.
 * @param {string} name - The tag name
 * @param {string} color - Optional color code (default: #3b82f6)
 * @param {string} specificId - Optional specific ID to use (for optimistic updates)
 * @returns {Promise<string|null>} The created tagId, or null if failed
 */
export const createTag = async (name, color = "#3b82f6", specificId = null) => {
    const db = getDb();
    if (!db) return null;

    const userId = getUserId();
    if (!userId) {
        console.warn("[TagService] No user ID. Cannot create tag.");
        return null;
    }

    if (!name || typeof name !== 'string') {
        console.warn("[TagService] Invalid tag name");
        return null;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
        console.warn("[TagService] Empty tag name");
        return null;
    }

    try {
        const tagId = specificId || generateTagId();
        const tagData = {
            name: trimmedName,
            color: color,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const tagRef = doc(db, "users", userId, "tags", tagId);
        await setDoc(tagRef, tagData);

        console.log(`[TagService] Created tag "${trimmedName}" with ID ${tagId}`);
        return tagId;
    } catch (e) {
        console.error("[TagService] Failed to create tag", e);
        return null;
    }
};

/**
 * Rename a global tag.
 * Updates the tag name in the global registry AND all progress documents.
 * This ensures tag snapshots in progress documents stay in sync.
 * 
 * @param {string} tagId - The tag ID to rename
 * @param {string} newName - The new tag name
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const renameTag = async (tagId, newName) => {
    const db = getDb();
    if (!db) return false;

    const userId = getUserId();
    if (!userId) {
        console.warn("[TagService] No user ID. Cannot rename tag.");
        return false;
    }

    if (!tagId || !newName || typeof newName !== 'string') {
        console.warn("[TagService] Invalid tag ID or name");
        return false;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
        console.warn("[TagService] Empty tag name");
        return false;
    }

    try {
        // Step 1: Update global tag registry
        const tagRef = doc(db, "users", userId, "tags", tagId);
        await updateDoc(tagRef, {
            name: trimmedName,
            updatedAt: serverTimestamp()
        });
        console.log(`[TagService] Updated global tag ${tagId} to "${trimmedName}"`);

        // Step 2: Batch update all progress documents with this tag
        const updateCount = await batchUpdateTagNameInProgress(tagId, trimmedName);
        console.log(`[TagService] ✓ Rename complete: Updated tag in ${updateCount} progress documents`);

        return true;
    } catch (e) {
        console.error("[TagService] Failed to rename tag", e);
        return false;
    }
};

/**
 * Delete a global tag.
 * Removes the tag from the global registry AND all progress documents.
 * This ensures no orphaned tag snapshots remain.
 * 
 * @param {string} tagId - The tag ID to delete
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const deleteTag = async (tagId) => {
    const db = getDb();
    if (!db) return false;

    const userId = getUserId();
    if (!userId) {
        const error = new Error("User not authenticated");
        console.error("[TagService] Cannot delete tag: User not authenticated");
        throw error;
    }

    if (!tagId) {
        console.warn("[TagService] Invalid tag ID");
        return false;
    }

    try {
        // Step 1: Batch remove tag from all progress documents
        const removeCount = await batchRemoveTagFromProgress(tagId);
        console.log(`[TagService] Removed tag from ${removeCount} progress documents`);

        // Step 2: Delete the tag from global registry
        const tagRef = doc(db, "users", userId, "tags", tagId);
        await deleteDoc(tagRef);
        console.log(`[TagService] Deleted global tag ${tagId}`);

        console.log(`[TagService] ✓ Delete complete: Removed tag and cleaned up ${removeCount} progress documents`);
        return true;

    } catch (e) {
        console.error("[TagService] ✗ FAILED to delete tag");
        console.error("[TagService] Error code:", e.code);
        console.error("[TagService] Error message:", e.message);
        if (e.stack) console.error("[TagService] Error stack:", e.stack);
        return false;
    }
};

/**
 * Check if a tag with the given name already exists for the current user.
 * @param {string} name - The tag name to check
 * @returns {Promise<boolean>} True if tag exists, false otherwise
 */
export const tagExists = async (name) => {
    const db = getDb();
    if (!db) return false;

    const userId = getUserId();
    if (!userId) return false;

    try {
        const trimmed = name.trim();
        const tagsRef = collection(db, "users", userId, "tags");
        const snapshot = await getDocs(tagsRef);

        for (const docSnap of snapshot.docs) {
            if (docSnap.data().name === trimmed) {
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("[TagService] Error checking if tag exists", e);
        return false;
    }
};

/**
 * Resolve a tagId to its tag object.
 * @param {string} tagId - The tag ID to resolve
 * @param {Array} allTags - Array of all tags (cache)
 * @returns {Object|null} Tag object {tagId, name, color, ...} or null if not found
 */
export const resolveTagId = (tagId, allTags = []) => {
    if (!tagId) return null;
    const tag = allTags.find(t => t.tagId === tagId);
    return tag || null;
};

/**
 * Convert legacy string-based tags to tagIds.
 * This handles backward compatibility with existing progress documents
 * that may have string-based tags instead of tagId references.
 * 
 * @param {Array} stringTags - Array of tag names (strings)
 * @param {Array} allTags - Array of all available tags
 * @returns {Array} Array of tagIds
 */
export const convertStringTagsToIds = (stringTags = [], allTags = []) => {
    if (!Array.isArray(stringTags)) return [];

    return stringTags
        .filter(t => typeof t === 'string' && t.trim())
        .map(tagName => {
            const tag = allTags.find(t => t.name === tagName.trim());
            return tag ? tag.tagId : null;
        })
        .filter(id => id !== null);
};
