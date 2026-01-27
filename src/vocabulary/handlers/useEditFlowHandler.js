/**
 * Edit Flow Handler Hook
 * Manages edit mode transitions, confirmation modals, and unsaved changes checks.
 */

import { useState } from 'react';

export function useEditFlowHandler({
    isEditMode,
    hasUnsavedChanges,
    setIsEditMode,
    setHasUnsavedChanges,
    saveChanges,
    showToast,
    // Additional props needed for logic parity
    vocabList,
    setDraftVocabList
}) {
    // Internal Modal State
    const [editConfirmationOpen, setEditConfirmationOpen] = useState(false);
    const [unsavedChangesModal, setUnsavedChangesModal] = useState({ open: false, pendingAction: null });

    // Request Action with Unsaved Check (formerly attemptAction)
    const requestActionWithUnsavedCheck = (cb) => {
        if (isEditMode && hasUnsavedChanges) {
            setUnsavedChangesModal({ open: true, pendingAction: cb });
        } else {
            // Logic change nuance: original attemptAction would unset edit mode if it proceeded?
            // "if (isEditMode) setIsEditMode(false);" was in useEditMode.js attemptAction.
            // But that seems wrong for general actions like "change filter"?
            // Wait, previous useEditMode.js logic:
            // "if (isEditMode) setIsEditMode(false); cb();"
            // This implies ANY action guarded by attemptAction would EXIT edit mode if successful.
            // Except "save"? No, save doesn't use attemptAction usually?
            // "handleFolderChange", "handleFilterChange" used attemptAction.
            // yes, changing folder/filter forces exit of edit mode.
            if (isEditMode) setIsEditMode(false);
            cb();
        }
    };

    // Start Edit Mode
    const startEditMode = () => {
        if (vocabList && setDraftVocabList) {
            setDraftVocabList(JSON.parse(JSON.stringify(vocabList)));
        }
        setHasUnsavedChanges(false);
        setIsEditMode(true);
        setEditConfirmationOpen(false);
        showToast("Edit Mode Started", "warning");
    };

    // Confirm Exit with Save
    const confirmExitWithSave = async () => {
        await saveChanges(); // Assumes saveChanges handles toast/network and returns promise
        setUnsavedChangesModal({ open: false, pendingAction: null });
        if (unsavedChangesModal.pendingAction) unsavedChangesModal.pendingAction();
    };

    // Confirm Exit with Discard
    const confirmExitWithDiscard = () => {
        if (setDraftVocabList) setDraftVocabList([]);
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setUnsavedChangesModal({ open: false, pendingAction: null });
        if (unsavedChangesModal.pendingAction) unsavedChangesModal.pendingAction();
    };

    // Cancel Edit Mode Attempt
    const cancelEditModeAttempt = () => {
        setUnsavedChangesModal({ open: false, pendingAction: null });
    };

    return {
        editConfirmationOpen,
        setEditConfirmationOpen, // Needed for UI toggle? User said "DO NOT touch JSX". AdvancedToolbar uses onEditModeToggle={() => setEditConfirmationOpen(true)}
        unsavedChangesModal,
        startEditMode,
        requestActionWithUnsavedCheck,
        confirmExitWithSave,
        confirmExitWithDiscard,
        cancelEditModeAttempt
    };
}
