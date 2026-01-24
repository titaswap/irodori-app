
import React from 'react';
import {
    Play, Pause, AlertCircle, EyeOff
} from 'lucide-react';
import { HeatmapBar } from './Shared';

const SheetRow = React.memo(({ item, columnOrder, columnDefs, columnVisibility, hiddenColumns, revealedCells, selectedIds, isPlaying, index, isEditMode, onUpdateCell, onRevealCell, onPlaySingle, onMark, isActive }) => {
    if (!item) return null;
    const isSelected = selectedIds.has(item.localId);


    const renderCellContent = (colId) => {
        // Safety check
        if (!columnVisibility) return null;

        // Visibility Check: If toggled OFF in manager, remove entirely (return null)
        const isVisibleInLayout = columnVisibility[colId] !== false; // Default true
        if (!isVisibleInLayout) return null;

        const cellBaseClass = '';

        // Define isHiddenMask from hiddenColumns prop
        const isHiddenMask = hiddenColumns[colId];

        switch (colId) {
            case 'selection':
                return (
                    <td data-col-id={colId} className={`w-10 px-2 py-0.5 border-r border-slate-100 dark:border-slate-800 text-center font-medium text-slate-400 dark:text-slate-600 text-xs`}>
                        {index + 1}
                    </td>
                );
            case 'audio':
                return <td data-col-id={colId} className={`w-12 px-2 py-0.5 border-r border-slate-100 dark:border-slate-800 text-center ${cellBaseClass}`}><button onClick={() => onPlaySingle(item)} className={`p-1 rounded-full transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>{isActive && isPlaying ? <Pause size={14} /> : <Play size={14} />}</button></td>;
            case 'isMarked':
                return <td data-col-id={colId} className={`w-12 px-2 py-0.5 border-r border-slate-100 dark:border-slate-800 text-center ${cellBaseClass}`}><button onClick={() => onMark(item.localId)} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><AlertCircle size={16} className={item.isMarked ? "text-red-500 fill-red-500" : "text-slate-200 dark:text-slate-700"} /></button></td>;
            default:
                const value = item[colId];
                // Support array values if any (e.g. multi-select) - cast to string
                const displayValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value || '');

                const isRevealedLocal = revealedCells[colId] === item.localId;
                const shouldShowContent = (!isHiddenMask || isRevealedLocal);

                const isPrimary = colId === 'japanese' || colId === 'hiragana' || colId === 'Hiragana'; // Simple heuristic for bolding

                return (
                    <td data-col-id={colId} className={`px-0 border-r border-slate-100 dark:border-slate-800 ${!shouldShowContent && !isEditMode ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>
                        {!shouldShowContent && !isEditMode ? (
                            <div onClick={() => onRevealCell(item.localId, colId)} className="w-full h-full px-2 py-0.5 text-transparent cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors group/cell"><EyeOff size={16} className="text-slate-300 dark:text-slate-600 group-hover/cell:text-slate-500 dark:group-hover/cell:text-slate-400" /></div>
                        ) : (
                            isEditMode ? <input className={`w-full h-full px-2 py-0.5 bg-transparent outline-none text-sm border-2 border-transparent focus:border-amber-500 focus:bg-amber-50 transition-all dark:text-slate-200`} value={displayValue} onChange={(e) => onUpdateCell(item.localId, colId, e.target.value)} /> :
                                <div className={`w-full h-full px-2 py-0.5 flex items-center text-sm leading-tight ${isPrimary ? 'font-bold' : ''} ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{displayValue}</div>
                        )}
                    </td>
                );
        }
    };

    return (
        <tr className={`group border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900'}`}>
            {columnOrder.map((colId) => (
                <React.Fragment key={colId}>
                    {(!columnDefs.find(c => c.id === colId)?.editOnly || isEditMode) && renderCellContent(colId)}
                </React.Fragment>
            ))}
        </tr>
    );
});

export default SheetRow;
