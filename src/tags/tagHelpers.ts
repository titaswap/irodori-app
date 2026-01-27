/**
 * Pure helper functions for tag operations
 * No side effects, no state, just pure logic
 */

/**
 * Check if a tag exists in the tags array
 */
export function hasTag(tags: string[] | undefined | null, tag: string): boolean {
    if (!tags || !Array.isArray(tags)) return false;
    return tags.includes(tag);
}

/**
 * Toggle a tag - add if not exists, remove if exists
 */
export function toggleTag(tags: string[] | undefined | null, tag: string): string[] {
    const currentTags = Array.isArray(tags) ? tags : [];
    
    if (hasTag(currentTags, tag)) {
        return removeTag(currentTags, tag);
    } else {
        return addTag(currentTags, tag);
    }
}

/**
 * Add a tag if it doesn't already exist
 */
export function addTag(tags: string[] | undefined | null, tag: string): string[] {
    const currentTags = Array.isArray(tags) ? tags : [];
    
    if (hasTag(currentTags, tag)) {
        return currentTags;
    }
    
    return [...currentTags, tag];
}

/**
 * Remove a tag if it exists
 */
export function removeTag(tags: string[] | undefined | null, tag: string): string[] {
    const currentTags = Array.isArray(tags) ? tags : [];
    return currentTags.filter(t => t !== tag);
}
