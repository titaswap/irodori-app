/**
 * Centralized Table Configuration
 * Controls column widths, constraints, and table behavior
 */

// ===================================
// PER-COLUMN CONFIGURATION
// ===================================

export const columnConfig = {
    // Content Columns (Language-based)


    japanese: {
        defaultWidth: 250,
        minWidth: 200,
        maxWidth: 400,
        wrap: true,
        autoWidth: false,
        priority: 'high'
    },


    // Metadata Columns (compact sizing for numeric values)
    lesson: {
        defaultWidth: 70,
        minWidth: 60,
        maxWidth: 80,
        wrap: false,
        autoWidth: false,
        priority: 'medium'
    },
    cando: {
        defaultWidth: 70,
        minWidth: 60,
        maxWidth: 80,
        wrap: false,
        autoWidth: false,
        priority: 'medium'
    },
    book: {
        defaultWidth: 100,
        minWidth: 70,
        maxWidth: 150,
        wrap: false,
        autoWidth: false,
        priority: 'low'
    },

    // System Columns
    tags: {
        defaultWidth: 180,
        minWidth: 120,
        maxWidth: 300,
        wrap: true,
        autoWidth: false,
        priority: 'medium'
    },
    selection: {
        defaultWidth: 48,
        minWidth: 40,
        maxWidth: 60,
        wrap: false,
        autoWidth: false,
        priority: 'high'
    },

    // Auto-width columns (content-based sizing)
    ismarked: {
        wrap: false,
        autoWidth: true,
        priority: 'high'
    },
    audio: {
        wrap: false,
        autoWidth: true,
        priority: 'high'
    },
    kanji: {
        // FORCE RECOMPILE: Auto-width enabled for content-based sizing
        minWidth: 80,
        maxWidth: 300,
        wrap: false,
        autoWidth: true,
        priority: 'high'
    },
    'kanji word': {
        minWidth: 100,
        maxWidth: 300,
        wrap: false,
        autoWidth: true,
        priority: 'high'
    },

    // Special Columns (Kanji folder)
    breakdown: {
        defaultWidth: 10,
        minWidth: 10,
        maxWidth: 15,
        wrap: true,
        autoWidth: false,
        priority: 'medium'
    }
};

// ===================================
// DYNAMIC FALLBACK CONFIG
// ===================================
// Used for new/unknown columns from Google Sheets
// Provides sensible defaults without requiring manual config updates

export const dynamicFallbackConfig = {
    minWidth: 200,
    maxWidth: 500,
    wrap: true,
    autoWidth: false,
    priority: 'high'
};

// ===================================
// GLOBAL TABLE SETTINGS
// ===================================

export const tableConfig = {
    // Layout
    layout: 'auto', // 'fixed' | 'auto'

    // Default Fallbacks
    defaultMinWidth: 100,
    defaultMaxWidth: 600,
    defaultWidth: 160,

    // Behavior
    allowResize: true,
    enableWrap: true,
    persistWidth: true, // Save manual resize to localStorage/Firestore

    // Performance
    virtualizeThreshold: 100, // Future: Virtualize if rows > threshold
    debounceResize: 150, // ms to debounce resize events

    // Responsive (Future)
    breakpoints: {
        mobile: 640,
        tablet: 1024,
        desktop: 1280
    }
};

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Get column configuration by column ID
 * @param {string} columnId - The column identifier
 * @returns {Object} Column config with defaults
 */
export function getColumnConfig(columnId) {
    const normalizedId = columnId.toLowerCase();
    const config = columnConfig[normalizedId];

    if (config) {
        if (normalizedId === 'japanese') /* console.log('getColumnConfig hit:', normalizedId, config); */
            return config;
    }
    if (normalizedId === 'japanese') /* console.log('getColumnConfig MISS:', normalizedId, 'falling back') */;

    // Fallback for unknown columns - use dynamic fallback config
    // This allows new Google Sheet columns to work automatically
    return {
        defaultWidth: dynamicFallbackConfig.defaultWidth,
        minWidth: dynamicFallbackConfig.minWidth,
        maxWidth: dynamicFallbackConfig.maxWidth,
        wrap: dynamicFallbackConfig.wrap,
        priority: dynamicFallbackConfig.priority
    };
}

/**
 * Get default width for a column
 * @param {string} columnId - The column identifier
 * @returns {number} Width in pixels
 */
export function getDefaultWidth(columnId) {
    return getColumnConfig(columnId).defaultWidth;
}

/**
 * Get minimum width for a column
 * @param {string} columnId - The column identifier
 * @returns {number} Minimum width in pixels
 */
export function getMinWidth(columnId) {
    return getColumnConfig(columnId).minWidth;
}

/**
 * Get maximum width for a column
 * @param {string} columnId - The column identifier
 * @returns {number} Maximum width in pixels
 */
export function getMaxWidth(columnId) {
    return getColumnConfig(columnId).maxWidth;
}

/**
 * Check if column should have text wrapping
 * @param {string} columnId - The column identifier
 * @returns {boolean} Whether text should wrap
 */
export function shouldWrap(columnId) {
    const config = getColumnConfig(columnId);
    return config?.wrap ?? false;
}

/**
 * Check if column should use auto-width (content-based sizing)
 * @param {string} columnId - Column identifier
 * @returns {boolean} true if column should use auto-width
 */
export function isAutoWidth(columnId) {
    // Safety guard: Book column is NEVER auto-width
    if (columnId.toLowerCase() === 'book') {
        return false;
    }
    // Safety guard: English column is NEVER auto-width
    if (columnId.toLowerCase() === 'english') {
        return false;
    }
    const config = getColumnConfig(columnId);
    return config?.autoWidth === true;
}

/**
 * Constrain width to min/max bounds
 * @param {string} columnId - The column identifier
 * @param {number} width - The desired width
 * @returns {number} Constrained width
 */
export function constrainWidth(columnId, width) {
    const config = getColumnConfig(columnId);
    return Math.max(config.minWidth, Math.min(config.maxWidth, width));
}

/**
 * Get effective width (manual override > default)
 * @param {string} columnId - The column identifier
 * @param {Object} columnWidths - Manual width overrides
 * @returns {number} Effective width in pixels
 */
export function getEffectiveWidth(columnId, columnWidths = {}) {
    // Safety guard: Book column always has effective width (default if not resized)
    if (columnId.toLowerCase() === 'book') {
        const manualWidth = columnWidths[columnId];
        if (manualWidth !== undefined && manualWidth !== null) {
            return constrainWidth(columnId, manualWidth);
        }
        return 100; // Force default width for Book
    }

    // STEP 1: Check if column uses auto-width (content-based)
    // AUTO-WIDTH TAKES PRIORITY over manual resizes
    if (isAutoWidth(columnId)) {
        return undefined; // Let browser determine width based on content
    }

    // STEP 2: Check manual resize (user dragged column)
    const manualWidth = columnWidths[columnId];
    if (manualWidth !== undefined && manualWidth !== null) {
        return constrainWidth(columnId, manualWidth);
    }

    // STEP 3: Use config default
    return getDefaultWidth(columnId);
}

export default {
    columnConfig,
    dynamicFallbackConfig,
    tableConfig,
    getColumnConfig,
    getDefaultWidth,
    getMinWidth,
    getMaxWidth,
    shouldWrap,
    isAutoWidth,
    constrainWidth,
    getEffectiveWidth
};
