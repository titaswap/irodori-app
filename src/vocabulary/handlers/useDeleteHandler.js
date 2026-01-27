/**
 * Delete Handler Hook
 * Manages delete modal state and execution logic
 */

import { useState, useCallback } from 'react';

export function useDeleteHandler({
    isEditMode,
    draftVocabList,
    setDraftVocabList,
    setHasUnsavedChanges,
    selectedIds,
    setSelectedIds,
    showToast
}) {
    const [deleteModal, setDeleteModal] = useState({ open: false, type: null, targetId: null, targetName: '' });

    const openDeleteModal = (type, targetId = null, targetName = '') => {
        setDeleteModal({ open: true, type, targetId, targetName });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ open: false, type: null, targetId: null, targetName: '' });
    };

    const requestDelete = useCallback((type, id, name) => {
        if (!isEditMode && type !== 'folder') return;
        openDeleteModal(type, id, name);
    }, [isEditMode]);

    const executeDelete = async () => {
        if (isEditMode) {
            if (deleteModal.type === 'single') {
                setDraftVocabList(p => p.filter(v => v.localId !== deleteModal.targetId));
            } else {
                setDraftVocabList(p => p.filter(v => !selectedIds.has(v.localId)));
                setSelectedIds(new Set());
            }
            setHasUnsavedChanges(true);
        }
        // Folder deletion or non-edit mode delete logic would go here if implemented
        closeDeleteModal();
    };

    return {
        deleteModal,
        setDeleteModal,
        requestDelete,
        closeDeleteModal,
        executeDelete
    };
}
