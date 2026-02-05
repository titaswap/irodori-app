/**
 * SmartBreakdownFormatter.jsx
 * 
 * React component that automatically formats breakdown text.
 * Uses lineClassifier + blockBuilder to convert raw text into semantic JSX.
 * 
 * NO table logic, NO positioning logic - ONLY text formatting.
 */

import React, { useMemo } from 'react';
import { classifyLines } from '../../utils/breakdown/lineClassifier.js';
import { createSemanticBlocks } from '../../utils/breakdown/blockBuilder.js';
import { getStyles } from '../../utils/breakdown/breakdownStyles.js';
import SmartImage from './SmartImage.jsx';

/**
 * Render a single block based on its type
 */
function renderBlock(block, index, isDark) {
    const styles = getStyles(isDark);

    switch (block.type) {
        case 'heading':
            return renderHeading(block, index, styles);

        case 'subheading':
            return renderSubheading(block, index, styles);

        case 'paragraph':
            return renderParagraph(block, index, styles);

        case 'list':
            return renderList(block, index, styles);

        case 'image':
            return renderImage(block, index, styles);

        case 'imageWithCaption':
            return renderImageWithCaption(block, index, styles);

        case 'divider':
            return renderDivider(block, index, styles);

        default:
            return renderParagraph(block, index, styles);
    }
}

/**
 * Render heading block
 */
function renderHeading(block, index, styles) {
    const content = block.lines.map(l => l.content).join(' ');
    const level = block.metadata.level || 1;

    // Check if it's an emoji heading
    const isEmoji = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(content);

    if (isEmoji) {
        return (
            <div key={index} style={styles.emojiHeading}>
                {content}
            </div>
        );
    }

    // Adjust font size based on heading level
    const headingStyle = {
        ...styles.heading,
        fontSize: `${1.5 - (level * 0.1)}rem`
    };

    return (
        <div key={index} style={headingStyle}>
            {content}
        </div>
    );
}

/**
 * Render subheading block
 */
function renderSubheading(block, index, styles) {
    const content = block.lines.map(l => l.content).join(' ');

    return (
        <div key={index} style={styles.subheading}>
            {content}
        </div>
    );
}

/**
 * Render paragraph block
 */
function renderParagraph(block, index, styles) {
    const content = block.lines.map(l => l.content).join('\n');

    return (
        <div key={index} style={styles.paragraph}>
            {content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                    {line}
                    {i < content.split('\n').length - 1 && <br />}
                </React.Fragment>
            ))}
        </div>
    );
}

/**
 * Render list block
 */
function renderList(block, index, styles) {
    return (
        <ul key={index} style={styles.list}>
            {block.lines.map((line, i) => (
                <li key={i} style={styles.listItem}>
                    {line.content}
                </li>
            ))}
        </ul>
    );
}

/**
 * Render image block
 */
function renderImage(block, index, styles) {
    const content = block.lines[0].content;

    // Extract markdown image: ![alt](url)
    const markdownMatch = content.match(/!\[(.*?)\]\((.+?)\)/);
    if (markdownMatch) {
        const [, alt, src] = markdownMatch;
        return (
            <SmartImage
                key={index}
                src={src}
                alt={alt}
                style={styles.image}
            />
        );
    }

    // Fallback: render as text
    return (
        <div key={index} style={styles.paragraph}>
            {content}
        </div>
    );
}

/**
 * Render image with caption block
 */
function renderImageWithCaption(block, index, styles) {
    const imageLine = block.lines.find(l => l.type === 'image');
    const captionLines = block.lines.filter(l => l.type === 'caption');

    if (!imageLine) {
        return renderParagraph(block, index, styles);
    }

    const content = imageLine.content;
    const markdownMatch = content.match(/!\[(.*?)\]\((.+?)\)/);

    if (markdownMatch) {
        const [, alt, src] = markdownMatch;
        const caption = captionLines.map(l => l.content).join(' ');

        return (
            <div key={index} style={styles.imageWithCaption}>
                <SmartImage
                    src={src}
                    alt={alt}
                    style={styles.image}
                />
                {caption && (
                    <div style={styles.caption}>
                        {caption}
                    </div>
                )}
            </div>
        );
    }

    return renderParagraph(block, index, styles);
}

/**
 * Render divider block
 */
function renderDivider(block, index, styles) {
    return <hr key={index} style={styles.divider} />;
}

/**
 * Main SmartBreakdownFormatter component
 */
const SmartBreakdownFormatter = React.memo(({ text, isDark = false }) => {
    // Memoize the formatting process
    const formattedBlocks = useMemo(() => {
        if (!text || text.trim().length === 0) {
            return [];
        }

        // Step 1: Classify lines
        const classifiedLines = classifyLines(text);

        // Step 2: Build semantic blocks
        const blocks = createSemanticBlocks(classifiedLines);

        return blocks;
    }, [text]);

    const styles = getStyles(isDark);

    // If no blocks, show original text as fallback
    if (formattedBlocks.length === 0) {
        return (
            <div style={styles.container}>
                <div style={styles.paragraph}>
                    {text || 'No breakdown available.'}
                </div>
            </div>
        );
    }

    // Render all blocks
    return (
        <div style={styles.container}>
            {formattedBlocks.map((block, index) =>
                renderBlock(block, index, isDark)
            )}
        </div>
    );
});

SmartBreakdownFormatter.displayName = 'SmartBreakdownFormatter';

export default SmartBreakdownFormatter;
