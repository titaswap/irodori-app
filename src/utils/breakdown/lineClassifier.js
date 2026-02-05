/**
 * lineClassifier.js
 * 
 * Single-line semantic classifier.
 * Takes one line of text and applies rules from formatRules.js
 * Returns semantic type with metadata.
 */

import { RULE_PRIORITY, isLikelyCaption } from './formatRules.js';

/**
 * Classify a single line of text
 * 
 * @param {string} line - The line to classify
 * @param {string|null} previousLineType - Type of the previous line (for context)
 * @returns {Object} Classification result
 */
export function classifyLine(line, previousLineType = null) {
    // Handle empty lines
    if (!line || line.trim().length === 0) {
        return {
            type: 'empty',
            content: '',
            confidence: 1.0,
            metadata: {}
        };
    }

    // Special case: check if this is likely a caption
    if (previousLineType === 'image') {
        const captionResult = isLikelyCaption(line, previousLineType);
        if (captionResult && captionResult.confidence > 0.7) {
            return {
                type: captionResult.type,
                content: captionResult.content,
                confidence: captionResult.confidence,
                metadata: { relatedTo: 'image' }
            };
        }
    }

    // Apply rules in priority order
    let bestMatch = null;
    let highestConfidence = 0;

    for (const rule of RULE_PRIORITY) {
        const result = rule(line, previousLineType);

        if (result && result.confidence > highestConfidence) {
            bestMatch = result;
            highestConfidence = result.confidence;

            // If we have very high confidence, stop early
            if (highestConfidence >= 0.95) {
                break;
            }
        }
    }

    // Return best match or default
    if (bestMatch) {
        return {
            type: bestMatch.type,
            content: bestMatch.content,
            confidence: bestMatch.confidence,
            metadata: bestMatch.level ? { level: bestMatch.level } : {}
        };
    }

    // Fallback: treat as paragraph
    return {
        type: 'paragraph',
        content: line.trim(),
        confidence: 0.3,
        metadata: {}
    };
}

/**
 * Classify multiple lines of text
 * 
 * @param {string} text - Multi-line text to classify
 * @returns {Array} Array of classified lines
 */
export function classifyLines(text) {
    if (!text) return [];

    const lines = text.split('\n');
    const classified = [];

    for (let i = 0; i < lines.length; i++) {
        const previousType = i > 0 ? classified[i - 1].type : null;
        const classification = classifyLine(lines[i], previousType);

        classified.push({
            ...classification,
            originalLine: lines[i],
            lineNumber: i
        });
    }

    return classified;
}

/**
 * Get statistics about classified lines
 * 
 * @param {Array} classifiedLines - Array of classified lines
 * @returns {Object} Statistics
 */
export function getClassificationStats(classifiedLines) {
    const stats = {
        total: classifiedLines.length,
        types: {},
        averageConfidence: 0
    };

    let totalConfidence = 0;

    for (const line of classifiedLines) {
        // Count types
        stats.types[line.type] = (stats.types[line.type] || 0) + 1;

        // Sum confidence
        totalConfidence += line.confidence;
    }

    // Calculate average confidence
    stats.averageConfidence = classifiedLines.length > 0
        ? totalConfidence / classifiedLines.length
        : 0;

    return stats;
}
