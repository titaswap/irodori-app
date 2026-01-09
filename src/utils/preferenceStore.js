/**
 * preferenceStore.js
 * Centralized service for managing user preferences.
 * Currently uses localStorage, but designed to be migrated to a backend/Firestore.
 */

import { loadUserConfig, saveUserConfig } from '../services/firestore/preferenceService';

const STORAGE_KEYS = {
    itemsPerPage: 'itemsPerPage',
    columnOrder: 'columnOrder',
    columnVisibility: 'columnVisibility',
    columnWidths: 'columnWidths'
};

const DEFAULTS = {
    itemsPerPage: 500,
    columnOrder: [],
    columnVisibility: {},
    columnWidths: {}
};

class PreferenceStore {
    constructor() {
        this._isHydrated = false;
        this._listeners = new Set();
        this._backgroundSync();
    }

    /**
     * Loads all tracked preferences from storage.
     * Returns an object with keys: itemsPerPage, columnOrder, columnVisibility, columnWidths
     */
    loadPreferences() {
        return {
            itemsPerPage: this._get(STORAGE_KEYS.itemsPerPage, DEFAULTS.itemsPerPage),
            columnOrder: this._get(STORAGE_KEYS.columnOrder, DEFAULTS.columnOrder),
            columnVisibility: this._get(STORAGE_KEYS.columnVisibility, DEFAULTS.columnVisibility),
            columnWidths: this._get(STORAGE_KEYS.columnWidths, DEFAULTS.columnWidths),
        };
    }

    /**
     * Subscribe to store changes.
     * @param {Function} listener - Callback function receiving current preferences.
     * @returns {Function} Unsubscribe function.
     */
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    _notifyListeners() {
        const prefs = this.loadPreferences();
        this._listeners.forEach(listener => listener(prefs));
    }

    /**
     * Saves a partial update of preferences.
     * @param {Object} changes - Object containing preference keys to update (e.g., { itemsPerPage: 50 })
     */
    savePreferences(changes) {
        Object.keys(changes).forEach(key => {
            if (STORAGE_KEYS[key]) {
                this._set(STORAGE_KEYS[key], changes[key]);
            } else {
                console.warn(`PreferenceStore: Unknown preference key '${key}'`);
            }
        });

        // Phase 5/6: Firestore Sync (Fire and Forget)
        // Guard: Only write if hydration is complete
        if (this._isHydrated) {
            // Filter changes to include only valid persistence keys (exclude internals/audio if any)
            const persistableChanges = {};
            Object.keys(changes).forEach(key => {
                // We sync all STORAGE_KEYS defined above
                if (STORAGE_KEYS[key]) {
                    persistableChanges[key] = changes[key];
                }
            });

            if (Object.keys(persistableChanges).length > 0) {
                saveUserConfig(persistableChanges);
            }
        } else {
            console.log(`[PreferenceStore] Skipping Firestore save (not hydrated).`, changes);
        }
    }

    async _backgroundSync() {
        // Try to fetch latest from Firestore and update local storage if found
        const remoteConfig = await loadUserConfig();

        if (remoteConfig) {
            console.log(`[PreferenceStore] Synced config from Firestore`, remoteConfig);

            let hasUnexpectedChanges = false;

            Object.keys(STORAGE_KEYS).forEach(key => {
                if (remoteConfig[key] !== undefined) {
                    // Deep check might be better for objects, but for now simple check or stringify
                    // For primitives (itemsPerPage) direct compare is fine.
                    // For objects (columnVisibility), we should probably just overwrite or check JSON string.
                    const currentLocal = this._get(STORAGE_KEYS[key], DEFAULTS[key]);

                    // Simple "changed" check:
                    // If remote matches local, do nothing.
                    // If remote is different, overwrite local.
                    if (JSON.stringify(currentLocal) !== JSON.stringify(remoteConfig[key])) {
                        this._set(STORAGE_KEYS[key], remoteConfig[key]);
                        hasUnexpectedChanges = true;
                    }
                }
            });

            if (hasUnexpectedChanges) {
                this._notifyListeners();
            }
        }

        // Mark hydration as complete so future writes are allowed
        this._isHydrated = true;
        console.log(`[PreferenceStore] Hydration complete. Firestore writes enabled.`);
    }

    // --- Private Helpers ---

    _get(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            // Handle potential non-JSON simple values if any (though JSON.parse handles "500" fine)
            return JSON.parse(item);
        } catch (e) {
            console.warn(`PreferenceStore: Failed to load '${key}'`, e);
            return defaultValue;
        }
    }

    _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`PreferenceStore: Failed to save '${key}'`, e);
        }
    }
}

export const preferenceStore = new PreferenceStore();
