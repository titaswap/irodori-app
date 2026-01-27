import React from 'react';
import { AlertCircle, PenTool, Save as SaveIcon, Trash2 } from 'lucide-react';

function VocabularyModals({
    deleteModal,
    executeDelete,
    setDeleteModal,
    editConfirmationOpen,
    setEditConfirmationOpen,
    startEditMode,
    unsavedChangesModal,
    confirmExitWithSave,
    confirmExitWithDiscard,
    cancelEditModeAttempt
}) {
    return (
        <>
            {deleteModal.open && <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"><div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center text-center"><AlertCircle className="text-red-600 mb-4" size={24} /><h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Delete {deleteModal.targetName}?</p></div><div className="p-4 bg-white dark:bg-slate-800 flex justify-end gap-3"><button onClick={() => setDeleteModal({ ...deleteModal, open: false })} className="flex-1 px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button><button onClick={executeDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Delete</button></div></div></div>}
            {editConfirmationOpen && <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"><div className="bg-amber-50 dark:bg-amber-900/20 p-6 flex flex-col items-center text-center"><PenTool className="text-amber-600 mb-4" size={24} /><h3 className="text-xl font-bold text-slate-900 dark:text-white">Enable Editing?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">You are entering Edit Mode.<br />Changes are temporary until you click Save.</p></div><div className="p-4 bg-white dark:bg-slate-800 flex justify-end gap-3"><button onClick={() => setEditConfirmationOpen(false)} className="flex-1 px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button><button onClick={startEditMode} className="flex-1 px-4 py-2.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600">Start Editing</button></div></div></div>}
            {unsavedChangesModal.open && <div className="fixed inset-0 z-[110] bg-slate-900/70 dark:bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"><div className="bg-amber-50 dark:bg-amber-900/20 p-6 flex flex-col items-center text-center border-b border-amber-100 dark:border-amber-900/30"><div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4"><AlertCircle className="text-amber-600" size={24} /></div><h3 className="text-xl font-bold text-slate-800 dark:text-white">Unsaved Changes</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">You have unsaved edits in this session.<br />What would you like to do?</p></div><div className="p-4 bg-white dark:bg-slate-800 flex flex-col gap-2"><button onClick={confirmExitWithSave} className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"><SaveIcon size={16} /> Save & Continue</button><button onClick={confirmExitWithDiscard} className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"><Trash2 size={16} /> Discard Changes</button><button onClick={cancelEditModeAttempt} className="w-full px-4 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Cancel (Stay Here)</button></div></div></div>}
        </>
    );
}

export default VocabularyModals;
