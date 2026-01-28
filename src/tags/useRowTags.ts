import { useCallback } from 'react';
import { addTagIdToProgress, removeTagIdFromProgress, fetchItemProgress } from '../services/firestore/activityService';
import { hasTag, toggleTag } from './tagHelpers';

/**
 * Hook for managing tags on vocabulary items using tag snapshots
 * Handles add/remove/toggle with Firestore sync
 * 
 * IMPORTANT: Tags are now stored as snapshots {id, name} in progress documents
 * This ensures instant display and offline compatibility
 */
export const useRowTags = (vocabList: any[], setVocabList: any, showToast?: any) => {
    
    /**
     * Toggle a tag on a row - add if not exists, remove if exists
     * Syncs to Firestore using tag snapshots {id, name}
     * @param {string} localId - The local item ID
     * @param {string} tagId - The tag ID to toggle
     * @param {string} tagName - The tag name (required for snapshot storage)
     */
    const toggleRowTag = useCallback(async (localId: any, tagId: string, tagName: string) => {
        console.log(`[Tags] toggleRowTag called for localId: ${localId}, tagId: ${tagId}, tagName: ${tagName}`);
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

        if (!tagId || !tagName) {
            console.warn('[Tags] Invalid tagId or tagName provided to toggleRowTag');
            return;
        }

        // Work with tag snapshots {id, name}
        const currentTags = Array.isArray(item.tags) ? item.tags : [];
        const willAdd = !currentTags.some((tag: any) => {
            // Handle both old format (string) and new format (object)
            if (typeof tag === 'string') return tag === tagId;
            return tag.id === tagId;
        });

        console.log(`[Tags] ${willAdd ? 'Adding' : 'Removing'} tag snapshot`);

        // OFFLINE-FIRST: Optimistic Update
        const newTags = willAdd 
            ? [...currentTags, { id: tagId, name: tagName }]
            : currentTags.filter((tag: any) => {
                if (typeof tag === 'string') return tag !== tagId;
                return tag.id !== tagId;
            });

        // 1. Update local state IMMEDIATELY
        console.log(`[Tags] Optimistic Row Update: ${willAdd ? 'Adding' : 'Removing'} ${tagId}`);
        setVocabList((prev: any[]) => prev.map((i: any) => 
            i.localId === localId ? { ...i, tags: newTags } : i
        ));

        // 2. Fire Firestore write in background (Do NOT await)
        const updatePromise = willAdd 
            ? addTagIdToProgress(item.id, tagId, tagName)
            : removeTagIdFromProgress(item.id, tagId);

        updatePromise
            .then(() => console.log(`[Tags] Firestore Row Sync Success`))
            .catch(e => {
                console.error('[Tags] Firestore Row Sync Deferred (Offline/Error):', e);
                // Do NOT revert state - persist changes locally
            });
            
    }, [vocabList, setVocabList]);

    return {
        toggleRowTag
    };
};
