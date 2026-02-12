/**
 * globalSearch.js
 * 
 * Implements universal search logic for the vocabulary table.
 * 
 * Features:
 * - Multi-language support (Kanji, Hiragana, Bangla, English)
 * - Multi-word search (AND logic: all terms must match)
 * - Tag matching (by name)
 * - Field-specific checks (lesson, cando, book)
 * - Case-insensitive
 * - Robust error handling for missing fields
 * 
 * @param {Array} data - The vocabulary list to filter
 * @param {string} query - The search query
 * @param {Array} allTags - List of all available tags (for tag name resolution)
 * @returns {Array} Filtered data
 */
export const globalSearch = (data, query, allTags = []) => {
    if (!query || typeof query !== 'string') {
        return data;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return data;

    const lowerQuery = trimmedQuery.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return data;

    // Pre-compute unique tag map for O(1) lookup
    // Map<tagId, tagName>
    const tagMap = new Map();
    if (Array.isArray(allTags) && allTags.length > 0) {
        allTags.forEach(tag => {
            if (tag && tag.tagId && tag.name) {
                tagMap.set(tag.tagId, tag.name.toLowerCase());
            }
        });
    }

    const scoredResults = [];

    for (const item of data) {
        // 1. Core Fields with case-insensitive and variant fallbacks
        const ja = item.japanese || item.Japanese || '';
        const kj = item.kanji || item.Kanji || ''; // Added Kanji field
        const hi = item.hiragana || item.Hiragana || item['Ma\'am hiragana'] || item.maamHiragana || '';
        const ba = item.bangla || item.Bangla || item['Ma\'am Bangla'] || '';
        const en = item.english || item.English || '';

        const coreText = [ja, kj, hi, ba, en].filter(Boolean).join(' ').toLowerCase();

        // 2. Metadata Fields with Fallbacks
        const metaText = [
            String(item.lesson || item.Lesson || ''),
            String(item.cando || item.Cando || ''),
            String(item.Book || item.book || '')
        ].join(' ').toLowerCase();

        // 3. Tags (Optimized Lookup)
        let tagText = '';
        if (Array.isArray(item.tags) && item.tags.length > 0) {
            const tagNames = [];
            for (let i = 0; i < item.tags.length; i++) {
                const tag = item.tags[i];
                const tagId = typeof tag === 'object' ? (tag.tagId || tag.id) : tag;
                const tagName = tagMap.get(tagId);
                if (tagName) tagNames.push(tagName);
            }
            if (tagNames.length > 0) {
                tagText = tagNames.join(' ');
            }
        }

        // Combine all searchable text
        const fullSearchableText = `${coreText} ${metaText} ${tagText}`;

        // AND Logic: ALL terms must be present
        const matches = terms.every(term => fullSearchableText.includes(term));
        if (!matches) continue;

        // SCORING LOGIC
        let score = 0;

        // Priority 1: Exact Match (Highest)
        // Check key fields for exact match with the full query
        if (
            ja.toLowerCase() === lowerQuery ||
            en.toLowerCase() === lowerQuery ||
            hi.toLowerCase() === lowerQuery ||
            kj.toLowerCase() === lowerQuery // Added Kanji check
        ) {
            score = 100;
        }
        // Priority 2: Starts With (Medium)
        else if (
            ja.toLowerCase().startsWith(lowerQuery) ||
            en.toLowerCase().startsWith(lowerQuery) ||
            hi.toLowerCase().startsWith(lowerQuery) ||
            kj.toLowerCase().startsWith(lowerQuery) // Added Kanji check
        ) {
            score = 50;
        }
        // Priority 3: Partial Match (Lowest)
        else {
            score = 10;
        }

        scoredResults.push({ item, score });
    }

    // Sort: Higher score first
    scoredResults.sort((a, b) => b.score - a.score);

    // Return original items
    return scoredResults.map(wrapper => wrapper.item);
};
