import { useState } from 'react';

export function useImportHandler({
    isEditMode,
    setDraftVocabList,
    setHasUnsavedChanges,
    setIsSyncing,
    apiService,
    fetchSheetData,
    showToast,
    currentFolderId,
    folders
}) {
    const [importModalOpen, setImportModalOpen] = useState(false);

    const openImport = () => setImportModalOpen(true);
    const closeImport = () => setImportModalOpen(false);

    const handleImport = async (data) => {
        const newItems = data.map(d => {
            return {
                ...d,
                id: null,
                localId: `imported_${Date.now()}_${Math.random()}`,
                folderId: currentFolderId === 'root' ? 'Uncategorized' : currentFolderId,
                book: folders.find(f => f.id === currentFolderId)?.name || 'Uncategorized',
                isMarked: false,
                lesson: d.lesson || '1', cando: d.cando || '1',
                japanese: d.japanese || '', bangla: d.bangla || ''
            };
        });

        if (isEditMode) {
            setDraftVocabList(prev => [...prev, ...newItems]);
            setHasUnsavedChanges(true);
        } else {
            setIsSyncing(true);
            try {
                await apiService.sendAdd(newItems);
                showToast("Imported successfully", "success");
                await fetchSheetData();
            } catch {
                showToast("Import failed", "error");
            } finally {
                setIsSyncing(false);
            }
        }
        setImportModalOpen(false);
    };

    return {
        importModalOpen,
        openImport,
        closeImport,
        handleImport
    };
}
