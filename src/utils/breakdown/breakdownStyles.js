/**
 * breakdownStyles.js
 * 
 * Article-level typography and semantic styling.
 * Safe defaults for all formatting scenarios.
 */

export const styles = {
    // Container
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: '1.6',
        color: 'inherit'
    },

    // Headings
    heading: {
        fontSize: '1.25rem',
        fontWeight: '700',
        marginTop: '1.5rem',
        marginBottom: '0.75rem',
        lineHeight: '1.3',
        color: 'inherit'
    },

    subheading: {
        fontSize: '1.1rem',
        fontWeight: '600',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        lineHeight: '1.4',
        color: 'inherit'
    },

    // Paragraphs
    paragraph: {
        fontSize: '0.95rem',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        lineHeight: '1.7',
        color: 'inherit'
    },

    // Lists
    list: {
        marginTop: '0.75rem',
        marginBottom: '0.75rem',
        paddingLeft: '1.5rem'
    },

    listItem: {
        fontSize: '0.95rem',
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
        lineHeight: '1.6'
    },

    // Images
    image: {
        maxWidth: '100%',
        height: 'auto',
        marginTop: '1rem',
        marginBottom: '0.5rem',
        borderRadius: '4px'
    },

    imageWithCaption: {
        marginTop: '1rem',
        marginBottom: '1rem'
    },

    caption: {
        fontSize: '0.875rem',
        fontStyle: 'italic',
        color: 'rgba(0, 0, 0, 0.6)',
        marginTop: '0.25rem',
        textAlign: 'center'
    },

    captionDark: {
        color: 'rgba(255, 255, 255, 0.6)'
    },

    // Divider
    divider: {
        border: 'none',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        marginTop: '1.5rem',
        marginBottom: '1.5rem'
    },

    dividerDark: {
        borderTopColor: 'rgba(255, 255, 255, 0.1)'
    },

    // Emoji heading (special styling)
    emojiHeading: {
        fontSize: '1.15rem',
        fontWeight: '600',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },

    // Code blocks (if markdown contains them)
    codeBlock: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: '0.75rem',
        borderRadius: '4px',
        fontSize: '0.9rem',
        fontFamily: 'monospace',
        overflowX: 'auto',
        marginTop: '0.75rem',
        marginBottom: '0.75rem'
    },

    codeBlockDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    },

    // Inline code
    inlineCode: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: '0.125rem 0.25rem',
        borderRadius: '3px',
        fontSize: '0.9em',
        fontFamily: 'monospace'
    },

    inlineCodeDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
};

/**
 * Get styles with dark mode support
 */
export function getStyles(isDark = false) {
    if (!isDark) return styles;

    // Return dark mode variants
    return {
        ...styles,
        caption: { ...styles.caption, ...styles.captionDark },
        divider: { ...styles.divider, ...styles.dividerDark },
        codeBlock: { ...styles.codeBlock, ...styles.codeBlockDark },
        inlineCode: { ...styles.inlineCode, ...styles.inlineCodeDark }
    };
}
