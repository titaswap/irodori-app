/**
 * uiStateStorage.ts
 * Centralized localStorage management for UI state persistence
 */

import { UI_STATE_KEYS, UI_STATE_DEFAULTS } from './uiStateKeys';

export const uiStateStorage = {
    /**
     * Generic save to localStorage
     */
    save<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`Failed to save UI state ${key}:`, e);
        }
    },
    
    /**
     * Generic load from localStorage
     */
    load<T>(key: string, defaultValue: T): T {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            console.warn(`Failed to load UI state ${key}:`, e);
            return defaultValue;
        }
    },
    
    // --- Specific State Savers ---
    
    saveCurrentFolder: (folderId: string): void => {
        uiStateStorage.save(UI_STATE_KEYS.CURRENT_FOLDER, folderId);
    },
    
    saveLessonFilter: (lessons: string[]): void => {
        uiStateStorage.save(UI_STATE_KEYS.LESSON_FILTER, lessons);
    },
    
    saveCandoFilter: (candos: string[]): void => {
        uiStateStorage.save(UI_STATE_KEYS.CANDO_FILTER, candos);
    },
    
    saveViewMode: (mode: string): void => {
        uiStateStorage.save(UI_STATE_KEYS.VIEW_MODE, mode);
    },
    
    saveHiddenColumns: (columns: Record<string, boolean>): void => {
        uiStateStorage.save(UI_STATE_KEYS.HIDDEN_COLUMNS, columns);
    },
    
    // --- Specific State Loaders ---
    
    loadCurrentFolder: (): string => {
        return uiStateStorage.load(UI_STATE_KEYS.CURRENT_FOLDER, UI_STATE_DEFAULTS.CURRENT_FOLDER);
    },
    
    loadLessonFilter: (): string[] => {
        return uiStateStorage.load(UI_STATE_KEYS.LESSON_FILTER, UI_STATE_DEFAULTS.LESSON_FILTER);
    },
    
    loadCandoFilter: (): string[] => {
        return uiStateStorage.load(UI_STATE_KEYS.CANDO_FILTER, UI_STATE_DEFAULTS.CANDO_FILTER);
    },
    
    loadViewMode: (): string => {
        return uiStateStorage.load(UI_STATE_KEYS.VIEW_MODE, UI_STATE_DEFAULTS.VIEW_MODE);
    },
    
    loadHiddenColumns: (): Record<string, boolean> => {
        return uiStateStorage.load(UI_STATE_KEYS.HIDDEN_COLUMNS, UI_STATE_DEFAULTS.HIDDEN_COLUMNS);
    },
};
