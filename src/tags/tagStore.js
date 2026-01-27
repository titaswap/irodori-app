
// Tag Store - Centralized tag data management

class TagStore {
    constructor() {
        this.tags = new Set();
    }

    /**
     * Load tags from vocabulary list
     * Extracts all unique tags from the tag field
     */
    loadFromVocab(vocabList) {
        this.tags.clear();

        if (!Array.isArray(vocabList)) return;

        vocabList.forEach(item => {
            // Support both old 'tags' array and new 'tag' string
            if (item.tag && typeof item.tag === 'string') {
                this.tags.add(item.tag.trim());
            } else if (Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    if (tag && typeof tag === 'string') {
                        this.tags.add(tag.trim());
                    }
                });
            }
        });
    }

    /**
     * Get all tags as sorted array
     */
    getAllTags() {
        return Array.from(this.tags).sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
        );
    }

    /**
     * Search tags by query (case-insensitive)
     */
    searchTags(query) {
        if (!query || typeof query !== 'string') return [];

        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return [];

        return this.getAllTags().filter(tag =>
            tag.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Add a new tag to the store
     */
    addTag(tag) {
        if (!tag || typeof tag !== 'string') return;

        const trimmed = tag.trim();
        if (trimmed) {
            this.tags.add(trimmed);
        }
    }

    /**
     * Check if a tag exists (case-insensitive)
     */
    hasTag(tag) {
        if (!tag || typeof tag !== 'string') return false;

        const lowerTag = tag.toLowerCase().trim();
        return this.getAllTags().some(t => t.toLowerCase() === lowerTag);
    }

    /**
     * Remove a tag from the store
     */
    removeTag(tag) {
        if (!tag || typeof tag !== 'string') return;

        const trimmed = tag.trim();
        if (trimmed) {
            this.tags.delete(trimmed);
        }
    }
}

// Export singleton instance
export const tagStore = new TagStore();
