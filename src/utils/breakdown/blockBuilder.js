/**
 * blockBuilder.js
 * 
 * Groups consecutive lines into logical blocks.
 * Converts classified lines into semantic blocks for rendering.
 */

/**
 * Group consecutive lines of the same type into blocks
 * 
 * @param {Array} classifiedLines - Array of classified lines
 * @returns {Array} Array of blocks
 */
export function buildBlocks(classifiedLines) {
    if (!classifiedLines || classifiedLines.length === 0) {
        return [];
    }

    const blocks = [];
    let currentBlock = null;

    for (let i = 0; i < classifiedLines.length; i++) {
        const line = classifiedLines[i];

        // Skip empty lines (but track them for spacing)
        if (line.type === 'empty') {
            // If we have a current block, finalize it
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }

        // Special handling for different types
        if (shouldStartNewBlock(line, currentBlock)) {
            // Finalize previous block
            if (currentBlock) {
                blocks.push(currentBlock);
            }

            // Start new block
            currentBlock = createBlock(line);
        } else {
            // Add to current block
            addLineToBlock(currentBlock, line);
        }
    }

    // Finalize last block
    if (currentBlock) {
        blocks.push(currentBlock);
    }

    return blocks;
}

/**
 * Determine if a new block should be started
 */
function shouldStartNewBlock(line, currentBlock) {
    // Always start a new block if there's no current block
    if (!currentBlock) {
        return true;
    }

    // Headings always start new blocks
    if (line.type === 'heading' || line.type === 'subheading') {
        return true;
    }

    // Images always start new blocks
    if (line.type === 'image') {
        return true;
    }

    // Dividers always start new blocks
    if (line.type === 'divider') {
        return true;
    }

    // Captions should be added to image blocks
    if (line.type === 'caption' && currentBlock.type === 'image') {
        return false;
    }

    // List items can be grouped together
    if (line.type === 'listItem' && currentBlock.type === 'list') {
        return false;
    }

    // Paragraphs can be grouped together
    if (line.type === 'paragraph' && currentBlock.type === 'paragraph') {
        return false;
    }

    // Different types → new block
    return true;
}

/**
 * Create a new block from a line
 */
function createBlock(line) {
    const blockType = getBlockType(line.type);

    return {
        type: blockType,
        lines: [line],
        metadata: { ...line.metadata }
    };
}

/**
 * Add a line to an existing block
 */
function addLineToBlock(block, line) {
    if (!block) return;

    block.lines.push(line);

    // Update metadata if needed
    if (line.metadata) {
        block.metadata = {
            ...block.metadata,
            ...line.metadata
        };
    }
}

/**
 * Convert line type to block type
 */
function getBlockType(lineType) {
    switch (lineType) {
        case 'listItem':
            return 'list';
        case 'caption':
            return 'image'; // Captions belong to image blocks
        default:
            return lineType;
    }
}

/**
 * Post-process blocks to improve structure
 * 
 * @param {Array} blocks - Array of blocks
 * @returns {Array} Processed blocks
 */
export function postProcessBlocks(blocks) {
    const processed = [];

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const nextBlock = i < blocks.length - 1 ? blocks[i + 1] : null;

        // Merge image with following caption
        if (block.type === 'image' && nextBlock && nextBlock.type === 'caption') {
            processed.push({
                type: 'imageWithCaption',
                lines: [...block.lines, ...nextBlock.lines],
                metadata: {
                    ...block.metadata,
                    hasCaption: true
                }
            });
            i++; // Skip next block (caption)
            continue;
        }

        processed.push(block);
    }

    return processed;
}

/**
 * Main function: Build and process blocks from classified lines
 * 
 * @param {Array} classifiedLines - Array of classified lines
 * @returns {Array} Final blocks ready for rendering
 */
export function createSemanticBlocks(classifiedLines) {
    const blocks = buildBlocks(classifiedLines);
    return postProcessBlocks(blocks);
}
