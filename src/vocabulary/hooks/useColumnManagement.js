/**
 * Column Management Hook
 * Manages column order synchronization and preference hydration
 */

import { useEffect, useRef, useState } from 'react';
import { loadFolderConfig, saveFolderConfig, migrateBookFolderConfig } from '../../services/firestore/preferenceService';
import { isBookFolder } from '../../utils/columnConfigMapper';

export function useColumnManagement({
    allColumns,
    columnOrder,
    setColumnOrder,
    columnVisibility,
    setColumnVisibility,
    columnWidths,
    setColumnWidths,
    itemsPerPage,
    setItemsPerPage,
    preferenceStore,
    currentFolderId // ✅ NEW: Dependency on folder ID
}) {
    const isHydrating = useRef(false);

    // 1. HARD RESET & LOAD on Folder Change
    useEffect(() => {
        if (!currentFolderId) return;

        let isMounted = true;
        isHydrating.current = true; // Block saves while loading

        const loadConfig = async () => {
            // A. Hard Reset State (prevent leakage)
            // We set a temporary "safe" state based on schema ONLY
            const defaultOrder = allColumns.map(c => c.id);
            setColumnOrder(defaultOrder);
            setColumnVisibility({});
            setColumnWidths({}); // Correctly reset widths to prevent leakage

            // B. Migrate Book folder configs if needed (backward compatibility)
            if (isBookFolder(currentFolderId)) {
                await migrateBookFolderConfig();
            }

            // C. Fetch Folder Config
            const savedConfig = await loadFolderConfig(currentFolderId);

            if (!isMounted) return;

            if (savedConfig) {
                // C. SCHEMA VALIDATION & AUTO-HEALING
                // 1. Validate Order
                const safeOrder = (savedConfig.columnOrder || [])
                    .filter(id => allColumns.some(c => c.id === id)); // Remove invalid

                // Add missing columns from schema
                const missingCols = allColumns
                    .filter(c => !safeOrder.includes(c.id))
                    .map(c => c.id);

                const finalOrder = [...safeOrder, ...missingCols];

                if (finalOrder.length > 0) setColumnOrder(finalOrder);

                // 2. Validate Visibility (Active Keys Only)
                if (savedConfig.columnVisibility) {
                    const safeVis = {};
                    Object.keys(savedConfig.columnVisibility).forEach(key => {
                        if (allColumns.some(c => c.id === key)) {
                            safeVis[key] = savedConfig.columnVisibility[key];
                        }
                    });
                    setColumnVisibility(safeVis);
                }

                // 3. Widths (Less critical, but good to load)
                if (savedConfig.columnWidths) {
                    setColumnWidths(savedConfig.columnWidths);
                }
            } else {
                // No config? Ensure default schema order is set (already done in reset, but confirm)
                setColumnOrder(defaultOrder);
            }

            isHydrating.current = false; // Enable saves
        };

        loadConfig();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId]);

    // 2. SAVE on Change (Debounced)
    useEffect(() => {
        if (isHydrating.current || !currentFolderId) return;

        const timer = setTimeout(() => {
            saveFolderConfig(currentFolderId, {
                columnOrder,
                columnVisibility,
                columnWidths
            });
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [columnOrder, columnVisibility, columnWidths, currentFolderId]);

    // 3. Global Preferences (Items Per Page only) - Keep existing logic for non-column prefs
    useEffect(() => {
        const unsubscribe = preferenceStore.subscribe((prefs) => {
            if (prefs.itemsPerPage !== itemsPerPage) setItemsPerPage(prefs.itemsPerPage);
            // Removed global column sync
        });
        return () => unsubscribe();
    }, [itemsPerPage, setItemsPerPage, preferenceStore]);
}
