/**
 * Edit Mode Hook
 * Manages edit mode state, save/discard flow, and unsaved changes handling
 */

import { getChangedFields } from '../../utils/vocabularyUtils';

export function useEditMode({
    isEditMode,
    setIsEditMode,
    draftVocabList,
    setDraftVocabList,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    editConfirmationOpen,
    setEditConfirmationOpen,
    unsavedChangesModal,
    setUnsavedChangesModal,
    vocabList,
    setVocabList,
    isSyncing,
    setIsSyncing,
    apiService,
    fetchSheetData,
    showToast
}) {
    // Attempt Action - checks for unsaved changes before executing
    const attemptAction = (cb) => {
        if (isEditMode && hasUnsavedChanges) {
            setUnsavedChangesModal({ open: true, pendingAction: cb });
        } else {
            if (isEditMode) setIsEditMode(false);
            cb();
        }
    };

    // Start Edit Mode
    const startEditMode = () => {
        setDraftVocabList(JSON.parse(JSON.stringify(vocabList)));
        setHasUnsavedChanges(false);
        setIsEditMode(true);
        setEditConfirmationOpen(false);
        showToast("Edit Mode Started", "warning");
    };

    // Save Changes
    const saveChanges = async () => {
        if (isSyncing) return;

        const updates = [];
        const adds = [];

        draftVocabList.forEach(d => {
            if (!d.id) {
                adds.push(d);
            } else {
                const o = vocabList.find(v => v.id === d.id);
                if (o && JSON.stringify(getChangedFields(o, d))) {
                    updates.push({ id: d.id, ...getChangedFields(o, d) });
                }
            }
        });

        if (updates.length === 0 && adds.length === 0) {
            setHasUnsavedChanges(false);
            return;
        }

        setIsSyncing(true);
        setVocabList(JSON.parse(JSON.stringify(draftVocabList)));
        setHasUnsavedChanges(false);

        try {
            if (adds.length) await apiService.sendAdd(adds);
            if (updates.length) await apiService.sendUpdate(updates);
            showToast("Saved!", "success");
            setIsEditMode(false);
            await fetchSheetData();
        } catch (e) {
            console.error(e);
            showToast("Save failed", "error");
            setHasUnsavedChanges(true);
        } finally {
            setIsSyncing(false);
        }
    };

    // Discard Changes
    const discardChanges = () => {
        setDraftVocabList([]);
        setHasUnsavedChanges(false);
        setIsEditMode(false);
    };

    // Confirm Exit with Save
    const confirmExitWithSave = () => {
        saveChanges();
        setUnsavedChangesModal({ open: false, pendingAction: null });
        unsavedChangesModal.pendingAction?.();
    };

    // Confirm Exit with Discard
    const confirmExitWithDiscard = () => {
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setUnsavedChangesModal({ open: false, pendingAction: null });
        unsavedChangesModal.pendingAction?.();
    };

    // Cancel Edit Mode Attempt
    const cancelEditModeAttempt = () => {
        setUnsavedChangesModal({ open: false, pendingAction: null });
    };

    // Update Draft Cell (only in edit mode)
    const updateDraftCell = (localId, field, value) => {
        if (isEditMode) {
            setDraftVocabList(p => p.map(i => i.localId === localId ? { ...i, [field]: value } : i));
            setHasUnsavedChanges(true);
        }
    };

    // Toggle Mark in Draft (only in edit mode)
    const toggleMarkInDraft = (localId) => {
        if (isEditMode) {
            setDraftVocabList(p => p.map(v => v.localId === localId ? { ...v, isMarked: !v.isMarked } : v));
            setHasUnsavedChanges(true);
        }
    };

    return {
        attemptAction,
        startEditMode,
        saveChanges,
        discardChanges,
        confirmExitWithSave,
        confirmExitWithDiscard,
        cancelEditModeAttempt,
        updateDraftCell,
        toggleMarkInDraft
    };
}
