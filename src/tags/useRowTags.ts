import { useCallback } from 'react';
import { addTagIdToProgress, removeTagIdFromProgress, fetchItemProgress } from '../services/firestore/activityService';
import { hasTag, toggleTag } from './tagHelpers';

/**
 * Hook for managing tags on vocabulary items using tagIds
 * Handles add/remove/toggle with Firestore sync
 * 
 * IMPORTANT: Tags are now referenced by tagId, not by string name
 * Progress documents store tagIds in the tags array
 */
export const useRowTags = (vocabList: any[], setVocabList: any, showToast?: any) => {
    
    /**
     * Toggle a tag (by tagId) on a row - add if not exists, remove if exists
     * Syncs to Firestore using arrayUnion/arrayRemove with tagIds
     * @param {string} localId - The local item ID
     * @param {string} tagId - The tag ID to toggle (not tag name)
     */
    const toggleRowTag = useCallback(async (localId: any, tagId: string) => {
        console.log(`[Tags] toggleRowTag called for localId: ${localId}, tagId: ${tagId}`);
        const item = vocabList.find((i: any) => i.localId === localId);
        
        if (!item) {
            console.warn('[Tags] Cannot toggle tag: item not found for localId', localId);
            return;
        }
        if (!item.id) {
            console.warn('[Tags] Cannot toggle tag: item has no ID (Firestore ID)', item);
            return;
        }

        console.log(`[Tags] Found item for toggling: ${item.id}`, item.tags);

        if (!tagId) {
            console.warn('[Tags] Invalid tagId provided to toggleRowTag');
            return;
        }

        const currentTagIds = Array.isArray(item.tags) ? item.tags : [];
        const willAdd = !currentTagIds.includes(tagId);
        const newTagIds = willAdd 
            ? [...currentTagIds, tagId]
            : currentTagIds.filter((id: string) => id !== tagId);

        console.log(`[Tags] Optimistic update: ${willAdd ? 'Adding' : 'Removing'} tag. New tags:`, newTagIds);

        // NO OPTIMISTIC UPDATE - FORCE SOURCE OF TRUTH
        // setVocabList(...) <-- REMOVED

        // Sync to Firestore
        try {
            if (willAdd) {
                await addTagIdToProgress(item.id, tagId);
                console.log('[Tags] Firestore add success');
            } else {
                await removeTagIdFromProgress(item.id, tagId);
                console.log('[Tags] Firestore remove success');
            }

            // Confirmed Sync: Re-fetch latest state to ensure UI is perfectly synced
            // This is the ONLY place that should update the UI for row tags
            const freshProgress: any = await fetchItemProgress(item.id);
            
            // Check if freshProgress exists. If not (e.g. removed last tag), use empty array
            const newTags = (freshProgress && Array.isArray(freshProgress.tags)) ? freshProgress.tags : [];
            
            console.log('[Tags] Syncing fresh tags from Firestore:', newTags);
            
            setVocabList((prev: any[]) => prev.map((i: any) => 
                i.localId === localId ? { ...i, tags: newTags } : i
            ));
            
        } catch (e) {
            console.error('[Tags] Failed to toggle tag (caught in hook):', e);
            showToast?.("Failed to update tag", "error");
        }
    }, [vocabList, setVocabList, showToast]);

    return {
        toggleRowTag
    };
};
