/**
 * Utility to handle "Audio Problem" tagging from the Audio Player.
 * 
 * @param {Object} item - The vocabulary item to tag
 * @param {Array} allTags - List of all available tags
 * @param {Function} createTag - Function to create a new tag
 * @param {Function} toggleRowTag - Function to toggle a tag on an item
 */
export const handleAudioProblemTag = async (item, allTags, createTag, toggleRowTag) => {
    if (!item || !toggleRowTag) return;

    const TAG_NAME = "Audio";
    let tagId = null;

    // 1. Find existing tag
    const existingTag = allTags.find(t => t.name.toLowerCase() === TAG_NAME.toLowerCase());

    if (existingTag) {
        tagId = existingTag.tagId;
    } else {
        // 2. Create if missing
        console.log("[AudioTag] Tag 'Audio Problem' not found, creating...");
        if (createTag) {
            tagId = await createTag(TAG_NAME);
        }
    }

    // 3. Toggle tag on item
    if (tagId) {
        // toggleRowTag(localId, tagId, tagName)
        await toggleRowTag(item.localId, tagId, TAG_NAME);
    } else {
        console.error("[AudioTag] Failed to resolve 'Audio Problem' tag ID");
    }
};
