/**
 * Column Management Hook
 * Manages column order synchronization and preference hydration
 */

import { useEffect } from 'react';

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
    preferenceStore
}) {
    // Column Order Sync - append new columns to existing order
    useEffect(() => {
        setColumnOrder(prev => {
            const cleanPrev = (prev || []);
            const existingSet = new Set(cleanPrev);
            const newColumns = allColumns
                .filter(c => !existingSet.has(c.id))
                .map(c => c.id);
            return [...cleanPrev, ...newColumns];
        });
    }, [allColumns, setColumnOrder]);

    // Preference Hydration - sync with preferenceStore changes
    useEffect(() => {
        const unsubscribe = preferenceStore.subscribe((prefs) => {
            if (prefs.itemsPerPage !== itemsPerPage) setItemsPerPage(prefs.itemsPerPage);
            if (JSON.stringify(prefs.columnOrder) !== JSON.stringify(columnOrder)) setColumnOrder(prefs.columnOrder);
            if (JSON.stringify(prefs.columnVisibility) !== JSON.stringify(columnVisibility)) setColumnVisibility(prefs.columnVisibility);
            if (JSON.stringify(prefs.columnWidths) !== JSON.stringify(columnWidths)) setColumnWidths(prefs.columnWidths);
        });
        return () => unsubscribe();
    }, [itemsPerPage, columnOrder, columnVisibility, columnWidths, setItemsPerPage, setColumnOrder, setColumnVisibility, setColumnWidths, preferenceStore]);
}
