import React from 'react';

/**
 * textHighlighter.js
 * 
 * Highlights search terms within a text string.
 * Case-insensitive.
 * 
 * @param {string} text - The text to display
 * @param {string} query - The search query
 * @returns {React.Node} Text with <mark> tags around matches
 */
export const textHighlighter = (text, query) => {
    if (!text) return null;
    const strText = String(text);
    if (!query || !query.trim()) return strText;

    // Escape regex special characters to prevent crashes (e.g., "C++", "(N1)")
    // Split into terms and only keep non-empty ones
    const terms = query.trim().split(/\s+/).filter(Boolean).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (terms.length === 0) return strText;

    // Create a regex to match any of the terms, case-insensitive, global
    try {
        const regex = new RegExp(`(${terms.join('|')})`, 'gi');

        // Optimization: Check if there's a match before splitting
        if (!regex.test(strText)) return strText;

        // Reset lastIndex because test() advances it with 'g' flag
        regex.lastIndex = 0;

        // Split text by matches
        const parts = strText.split(regex);

        return (
            <span>
                {parts.map((part, index) => {
                    // Check if this part matches any term (case-insensitive)
                    const isMatch = terms.some(term => part.toLowerCase() === term.toLowerCase());

                    if (isMatch) {
                        return (
                            <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 text-slate-900 dark:text-yellow-100 p-0 m-0 inline">
                                {part}
                            </mark>
                        );
                    }
                    return part;
                })}
            </span>
        );
    } catch (e) {
        console.error("Highlighter Regex Error:", e);
        return strText;
    }
};
