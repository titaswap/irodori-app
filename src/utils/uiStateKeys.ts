/**
 * uiStateKeys.ts
 * Constants for UI state localStorage keys and default values
 */

export const UI_STATE_KEYS = {
    CURRENT_FOLDER: 'irodori:ui:currentFolder',
    LESSON_FILTER: 'irodori:ui:lessonFilter',
    CANDO_FILTER: 'irodori:ui:candoFilter',
    BOOK_FILTER: 'irodori:ui:bookFilter',
    TAG_FILTER: 'irodori:selectedTagFilters', // Keep existing key for backward compatibility
    VIEW_MODE: 'irodori:ui:viewMode',
    HIDDEN_COLUMNS: 'irodori:ui:hiddenColumns',
} as const;

export const UI_STATE_DEFAULTS = {
    CURRENT_FOLDER: 'root',
    LESSON_FILTER: [] as string[],
    CANDO_FILTER: [] as string[],
    BOOK_FILTER: 'all' as string | string[],
    TAG_FILTER: [] as string[],
    VIEW_MODE: 'all',
    HIDDEN_COLUMNS: {} as Record<string, boolean>,
} as const;
