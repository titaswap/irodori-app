/**
 * formatRules.js
 * 
 * Heuristic rules for text classification.
 * Contains ONLY deterministic binary logic - NO AI, NO APIs, NO randomness.
 * 
 * Each rule returns a confidence score (0-1) and a suggested type.
 */

/**
 * Check if line is a markdown heading
 */
export function isMarkdownHeading(line) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (match) {
        return {
            confidence: 1.0,
            type: 'heading',
            level: match[1].length,
            content: match[2]
        };
    }
    return null;
}

/**
 * Check if line starts with emoji (likely a heading)
 */
export function isEmojiHeading(line) {
    const trimmed = line.trim();
    // Common emoji patterns at start of line
    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    if (emojiPattern.test(trimmed) && trimmed.length < 50) {
        return {
            confidence: 0.9,
            type: 'heading',
            content: trimmed
        };
    }
    return null;
}

/**
 * Check if line is a section header (ends with colon)
 */
export function isSectionHeader(line) {
    const trimmed = line.trim();

    if (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.includes('\n')) {
        return {
            confidence: 0.85,
            type: 'subheading',
            content: trimmed
        };
    }
    return null;
}

/**
 * Check if line is a short title/subheading
 */
export function isShortTitle(line) {
    const trimmed = line.trim();

    // Short line without sentence-ending punctuation
    if (trimmed.length > 0 && trimmed.length < 40 &&
        !trimmed.endsWith('.') &&
        !trimmed.endsWith('!') &&
        !trimmed.endsWith('?') &&
        !trimmed.includes('\n')) {
        return {
            confidence: 0.6,
            type: 'subheading',
            content: trimmed
        };
    }
    return null;
}

/**
 * Check if line is a list item
 */
export function isListItem(line) {
    const trimmed = line.trim();

    // Markdown list patterns
    if (trimmed.match(/^[-*+]\s+.+/) || trimmed.match(/^\d+\.\s+.+/)) {
        return {
            confidence: 1.0,
            type: 'listItem',
            content: trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '')
        };
    }
    return null;
}

/**
 * Check if line contains an image reference
 */
export function isImageReference(line) {
    const trimmed = line.trim();

    // Markdown image pattern: ![alt](url)
    if (trimmed.match(/!\[.*?\]\(.+?\)/)) {
        return {
            confidence: 1.0,
            type: 'image',
            content: trimmed
        };
    }

    // HTML img tag
    if (trimmed.match(/<img\s+[^>]*src=["'][^"']+["'][^>]*>/i)) {
        return {
            confidence: 1.0,
            type: 'image',
            content: trimmed
        };
    }

    return null;
}

/**
 * Check if line is a horizontal divider
 */
export function isDivider(line) {
    const trimmed = line.trim();

    // Markdown divider patterns
    if (trimmed.match(/^[-*_]{3,}$/)) {
        return {
            confidence: 1.0,
            type: 'divider',
            content: trimmed
        };
    }
    return null;
}

/**
 * Check if line is a long paragraph
 */
export function isLongParagraph(line) {
    const trimmed = line.trim();

    if (trimmed.length > 100) {
        return {
            confidence: 0.8,
            type: 'paragraph',
            content: trimmed
        };
    }
    return null;
}

/**
 * Check if line is likely a caption (follows an image)
 */
export function isLikelyCaption(line, previousLineType) {
    const trimmed = line.trim();

    if (previousLineType === 'image' && trimmed.length > 0 && trimmed.length < 100) {
        return {
            confidence: 0.75,
            type: 'caption',
            content: trimmed
        };
    }
    return null;
}

/**
 * Default fallback - treat as paragraph
 */
export function defaultParagraph(line) {
    const trimmed = line.trim();

    if (trimmed.length > 0) {
        return {
            confidence: 0.5,
            type: 'paragraph',
            content: trimmed
        };
    }
    return null;
}

/**
 * Rule priority order (highest to lowest confidence)
 */
export const RULE_PRIORITY = [
    isMarkdownHeading,
    isImageReference,
    isDivider,
    isListItem,
    isEmojiHeading,
    isSectionHeader,
    isLongParagraph,
    isShortTitle,
    defaultParagraph
];
