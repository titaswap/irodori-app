/**
 * useGroupFilters.js
 * React hook to manage filter state per folder group
 * Automatically switches filter state when folder group changes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFolderGroupById, getDefaultFiltersForGroup, filterUnsupportedFilters } from '../utils/folderGroupUtils';
import { groupFilterStorage } from '../utils/groupFilterStorage';

/**
 * Hook to manage filters per folder group
 * @param {string} currentFolderId - Current active folder ID
 * @param {Array} folders - Array of folder objects
 * @returns {Object} Filter state and methods
 */
export function useGroupFilters(currentFolderId, folders) {
    // Track current group
    const [currentGroup, setCurrentGroup] = useState(() => {
        return getFolderGroupById(currentFolderId, folders);
    });

    // Track previous group for saving state on change
    const previousGroupRef = useRef(currentGroup);

    // Filter state - initialized with defaults for current group
    const [filters, setFiltersInternal] = useState(() => {
        const group = getFolderGroupById(currentFolderId, folders);
        const savedFilters = groupFilterStorage.loadGroupFilters(group);

        console.log(`[useGroupFilters INIT] group:`, group, `savedFilters:`, savedFilters, `hasKeys:`, savedFilters ? Object.keys(savedFilters).length : 0);

        if (savedFilters && Object.keys(savedFilters).length > 0) {
            // Validate and clean saved filters
            const cleaned = filterUnsupportedFilters(savedFilters, group);
            console.log(`[useGroupFilters INIT] Using saved filters (cleaned):`, cleaned);
            return cleaned;
        }

        // Return defaults if no saved filters or empty object
        const defaults = getDefaultFiltersForGroup(group);
        console.log(`[useGroupFilters INIT] Using default filters:`, defaults);
        return defaults;
    });

    // Store filters in ref for access during folder change
    const filtersRef = useRef(filters);
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    /**
     * Set filters with validation and persistence
     */
    const setFilters = useCallback((newFilters) => {
        setFiltersInternal(prevFilters => {
            // Allow function or object
            const resolvedFilters = typeof newFilters === 'function'
                ? newFilters(prevFilters)
                : newFilters;

            // Clean unsupported filters
            const cleanedFilters = filterUnsupportedFilters(resolvedFilters, currentGroup);

            // Persist to storage
            groupFilterStorage.saveGroupFilters(currentGroup, cleanedFilters);

            return cleanedFilters;
        });
    }, [currentGroup]);

    /**
     * Handle folder change - save current group's filters and load new group's filters
     */
    useEffect(() => {
        const newGroup = getFolderGroupById(currentFolderId, folders);

        // Only process if group actually changed
        if (newGroup === currentGroup) {
            return;
        }

        // Save current group's filters before switching
        const currentFilters = filtersRef.current;
        if (previousGroupRef.current) {
            groupFilterStorage.saveGroupFilters(previousGroupRef.current, currentFilters);
        }

        // Load new group's filters
        const savedFilters = groupFilterStorage.loadGroupFilters(newGroup);
        let newFilters;

        if (savedFilters && Object.keys(savedFilters).length > 0) {
            // Use saved filters, but validate them
            newFilters = filterUnsupportedFilters(savedFilters, newGroup);
        } else {
            // No saved filters or empty object, use defaults
            newFilters = getDefaultFiltersForGroup(newGroup);
        }

        // Update state
        setCurrentGroup(newGroup);
        setFiltersInternal(newFilters);
        previousGroupRef.current = newGroup;

    }, [currentFolderId, folders, currentGroup]);

    /**
     * Clear filters for current group
     */
    const clearFilters = useCallback(() => {
        const defaultFilters = getDefaultFiltersForGroup(currentGroup);
        setFilters(defaultFilters);
        groupFilterStorage.clearGroupFilters(currentGroup);
    }, [currentGroup, setFilters]);

    /**
     * Get filter value by key
     */
    const getFilter = useCallback((filterKey) => {
        return filters[filterKey];
    }, [filters]);

    /**
     * Update a single filter
     */
    const updateFilter = useCallback((filterKey, value) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    }, [setFilters]);

    return {
        filters,           // Current filter state for current group
        setFilters,        // Set all filters (with validation)
        updateFilter,      // Update single filter
        getFilter,         // Get single filter value
        clearFilters,      // Clear all filters for current group
        currentGroup       // Current folder group identifier
    };
}
