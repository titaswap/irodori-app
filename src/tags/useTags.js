
/**
 * useTags.js
 * 
 * React hook for tag management using the new Firestore data model.
 * 
 * Tags are first-class entities in users/{uid}/tags collection.
 * Progress documents reference tags by tagId.
 * This hook handles loading, creating, renaming, and deleting tags.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    fetchAllTags,
    createTag as createTagFS,
    renameTag as renameTagFS,
    deleteTag as deleteTagFS,
    convertStringTagsToIds
} from '../services/firestore/tagService';

/**
 * Hook for managing tags
 * @param {Array} vocabList - Current vocabulary list
 * @param {Function} setVocabList - Update vocabulary list
 * @returns {Object} Tag management interface
 */
export const useTags = (vocabList, setVocabList, user) => {
    const [allTags, setAllTags] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize: Load all global tags from Firestore
    useEffect(() => {
        // Only fetch if we have a user
        if (!user) {
            setAllTags([]);
            setIsInitialized(true);
            return;
        }

        const initialize = async () => {
            try {
                console.log("[Tags] Initializing tags from Firestore for user:", user.uid);
                const tags = await fetchAllTags();
                setAllTags(tags);
                console.log("[Tags] Loaded", tags.length, "global tags");
                setIsInitialized(true);
            } catch (err) {
                console.error("[Tags] Failed to initialize tags", err);
                setIsInitialized(true);
            }
        };

        initialize();
    }, [user]); // Re-run when user changes

    // Convert legacy string tags to tagIds when vocabList loads
    // GRAVITY FIX: DISABLED TO PREVENT STATE OVERWRITE
    // Legacy conversion should be done elsewhere or ONCE during data loading.
    /*
    useEffect(() => {
        if (!vocabList || vocabList.length === 0 || !isInitialized) return;

        let needsUpdate = false;
        const updatedList = vocabList.map(item => {
            // Check if tags are strings (legacy) instead of tagIds
            if (Array.isArray(item.tags) && item.tags.some(t => typeof t === 'string')) {
                console.log(`[Tags] Converting legacy string tags for item ${item.id}`, item.tags);
                const converted = convertStringTagsToIds(item.tags, allTags);
                needsUpdate = true;
                return {
                    ...item,
                    tags: converted
                };
            }
            return item;
        });

        if (needsUpdate) {
            console.log("[Tags] Updated vocabList with converted tagIds");
            setVocabList(updatedList);
        }
    }, [vocabList, allTags, isInitialized, setVocabList]);
    */

    /**
     * Search tags by query string
     */
    const searchTags = useCallback((query) => {
        if (!query) return allTags;

        const lowerQuery = query.toLowerCase();
        return allTags.filter(tag =>
            tag.name.toLowerCase().includes(lowerQuery)
        );
    }, [allTags]);

    /**
     * Create a new global tag
     * @param {string} tagName - The tag name to create
     * @returns {Promise<string|null>} The created tagId or null if failed
     */
    const createTag = useCallback(async (tagName) => {
        if (!tagName || typeof tagName !== 'string') {
            console.warn("[Tags] Invalid tag name for creation");
            return null;
        }

        const trimmed = tagName.trim();
        if (!trimmed) {
            console.warn("[Tags] Empty tag name");
            return null;
        }

        // Check if tag already exists by name
        const exists = allTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            console.warn(`[Tags] Tag "${trimmed}" already exists`);
            return null;
        }

        try {
            console.log(`[Tags] Creating tag "${trimmed}"`);
            const newTagId = await createTagFS(trimmed);

            if (newTagId) {
                // Fetch updated tags list
                const updatedTags = await fetchAllTags();
                setAllTags(updatedTags);
                console.log(`[Tags] Tag "${trimmed}" created successfully with ID ${newTagId}`);
                return newTagId;
            } else {
                console.error("[Tags] Failed to create tag in Firestore");
                return null;
            }
        } catch (err) {
            console.error("[Tags] Error creating tag", err);
            return null;
        }
    }, [allTags]);

    /**
     * Rename a tag
     * Updates the tag in Firestore. All progress documents referencing this tagId
     * will automatically use the new tag name (no UI update needed for rows).
     * 
     * @param {string} oldTagId - The tagId to rename
     * @param {string} newTagName - The new tag name
     * @returns {Promise<boolean>} True if successful
     */
    const renameTag = useCallback(async (oldTagId, newTagName) => {
        if (!oldTagId || !newTagName || typeof newTagName !== 'string') {
            console.warn("[Tags] Invalid parameters for rename");
            return false;
        }

        const trimmed = newTagName.trim();
        if (!trimmed) {
            console.warn("[Tags] Empty tag name");
            return false;
        }

        // Check if new name already exists
        const existingTag = allTags.find(t =>
            t.tagId !== oldTagId && t.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existingTag) {
            console.warn(`[Tags] Tag "${trimmed}" already exists`);
            return false;
        }

        try {
            console.log(`[Tags] Renaming tag ${oldTagId} to "${trimmed}"`);
            const success = await renameTagFS(oldTagId, trimmed);

            if (success) {
                // Fetch updated tags list
                const updatedTags = await fetchAllTags();
                setAllTags(updatedTags);
                console.log(`[Tags] Tag ${oldTagId} renamed successfully`);
                return true;
            } else {
                console.error("[Tags] Failed to rename tag in Firestore");
                return false;
            }
        } catch (err) {
            console.error("[Tags] Error renaming tag", err);
            return false;
        }
    }, [allTags]);

    /**
     * Delete a tag
     * Removes the tag from Firestore and all progress documents that reference it.
     * Also updates local vocabList to remove the tag immediately.
     * 
     * @param {string} tagId - The tagId to delete
     * @returns {Promise<boolean>} True if successful
     */
    const deleteTag = useCallback(async (tagId) => {
        if (!tagId) {
            console.warn("[Tags] Invalid tag ID for deletion");
            return false;
        }

        try {
            console.log(`[Tags] Deleting tag ${tagId}`);
            const success = await deleteTagFS(tagId);

            if (success) {
                // 1. Update list of global tags
                const updatedTags = await fetchAllTags();
                setAllTags(updatedTags);

                // 2. Update local vocabList to remove this tag from all rows
                // This updates the UI immediately so we don't see "Unknown" tags
                if (setVocabList) {
                    setVocabList(prevList => prevList.map(item => {
                        if (Array.isArray(item.tags) && item.tags.includes(tagId)) {
                            return {
                                ...item,
                                tags: item.tags.filter(t => t !== tagId)
                            };
                        }
                        return item;
                    }));
                }

                console.log(`[Tags] Tag ${tagId} deleted successfully and removed from local view`);
                return true;
            } else {
                console.error("[Tags] Failed to delete tag in Firestore");
                return false;
            }
        } catch (err) {
            console.error("[Tags] Error deleting tag", err);
            return false;
        }
    }, [setVocabList]);

    /**
     * Get tag display name from tagId
     * @param {string} tagId - The tag ID to resolve
     * @returns {string} The tag name or 'Unknown' if not found
     */
    const getTagName = useCallback((tagId) => {
        const tag = allTags.find(t => t.tagId === tagId);
        return tag ? tag.name : 'Unknown';
    }, [allTags]);

    return {
        allTags,
        searchTags,
        createTag,
        renameTag,
        deleteTag,
        getTagName
    };
};
