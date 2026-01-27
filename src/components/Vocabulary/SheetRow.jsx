
import React from 'react';
import {
    Play, Pause, AlertCircle, EyeOff
} from 'lucide-react';
import { HeatmapBar } from './Shared';
import TagCell from '../../tags/TagCell';

const SheetRow = React.memo(({ item, columnOrder, columnDefs, columnVisibility, hiddenColumns, revealedCells, selectedIds, isPlaying, index, isEditMode, onUpdateCell, onRevealCell, onPlaySingle, onMark, isActive, allTags, searchTags, createTag, getTagName, toggleRowTag, isAuthenticated }) => {
    if (!item) return null;
    const isSelected = selectedIds.has(item.localId);


    const renderCellContent = (colId) => {
        // Safety checks
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
                    <td data-col-id={colId} className={`w-10 px-2 py-0.5 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1] text-slate-900' : 'bg-white/50 dark:bg-white/[0.02]'} text-center font-medium text-slate-500 text-xs`}>
                        {index + 1}
                    </td>
                );
            case 'audio':
                return <td data-col-id={colId} className={`w-12 px-2 py-0.5 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1]' : 'bg-white/50 dark:bg-white/[0.02]'} text-center ${cellBaseClass}`}><button onClick={() => onPlaySingle(item)} className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#4F46E5] text-white shadow-md scale-110' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 dark:bg-white/5 dark:hover:bg-primary/20 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/5'}`}>{isActive && isPlaying ? <Pause size={14} /> : <Play size={14} />}</button></td>;
            case 'isMarked':
                return <td data-col-id={colId} className={`w-12 px-2 py-0.5 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1]' : 'bg-white/50 dark:bg-white/[0.02]'} text-center ${cellBaseClass}`}><button onClick={() => onMark(item.localId)} className="p-0.5 hover:scale-110 transition-transform"><AlertCircle size={16} className={item.isMarked ? "text-red-500 fill-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-slate-400 dark:text-slate-600"} /></button></td>;
            case 'tags':
                return <TagCell item={item} toggleRowTag={toggleRowTag} allTags={allTags} searchTags={searchTags} createTag={createTag} getTagName={getTagName} isAuthenticated={isAuthenticated} />;
            default:
                const value = item[colId];
                // Support array values if any (e.g. multi-select) - cast to string
                const displayValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value || '');

                const isRevealedLocal = revealedCells[colId] === item.localId;
                const shouldShowContent = (!isHiddenMask || isRevealedLocal);

                const isPrimary = colId === 'japanese' || colId === 'hiragana' || colId === 'Hiragana'; // Simple heuristic for bolding

                return (
                    <td data-col-id={colId} className={`px-0 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1]' : 'bg-white/40 dark:bg-white/[0.02]'} ${!shouldShowContent && !isEditMode && !isActive ? 'bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm' : ''}`}>
                        {!shouldShowContent && !isEditMode ? (
                            <div onClick={() => onRevealCell(item.localId, colId)} className={`w-full h-full px-2 py-0.5 text-transparent cursor-pointer ${isActive ? '' : 'hover:bg-indigo-50 dark:hover:bg-slate-700'} flex items-center justify-center transition-colors group/cell`}><EyeOff size={16} className="text-slate-300 dark:text-slate-600 group-hover/cell:text-slate-500 dark:group-hover/cell:text-slate-400" /></div>
                        ) : (
                            isEditMode ? <input className={`w-full h-full px-2 py-0.5 bg-transparent outline-none text-sm border-2 border-transparent focus:border-primary focus:bg-primary/10 transition-all text-slate-900 dark:text-text-main`} value={displayValue} onChange={(e) => onUpdateCell(item.localId, colId, e.target.value)} /> :
                                <div className={`w-full h-full px-2 py-0.5 flex items-center text-sm leading-tight ${isPrimary ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'} ${isActive ? 'text-slate-900 font-bold' : ''}`}>{displayValue}</div>
                        )}
                    </td>
                );
        }
    };

    return (
        <tr className={`glossy-row group border-b border-slate-200 dark:border-white/10 transition-all duration-200 
            ${isSelected
                ? 'bg-primary/10 dark:bg-primary/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]'
                : isActive
                    ? '!bg-[#e5f5f1] dark:!bg-[#e5f5f1]/10 border-l-[6px] border-l-green-300 dark:border-l-[#e5f5f1] shadow-xl scale-[1.003] z-10 relative ring-2 ring-[#e5f5f1]/10 dark:ring-[#e5f5f1]/1'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-[1.001] hover:shadow-sm'
            }`}>
            {columnOrder.map((colId) => (
                <React.Fragment key={colId}>
                    {(!columnDefs.find(c => c.id === colId)?.editOnly || isEditMode) && renderCellContent(colId)}
                </React.Fragment>
            ))}
        </tr>
    );
}, (prevProps, nextProps) => {
    // Custom comparator: Force re-render if isActive or isPlaying changes
    if (prevProps.isActive !== nextProps.isActive) return false;
    if (prevProps.isPlaying !== nextProps.isPlaying) return false;

    // Otherwise, use shallow comparison for performance
    return (
        prevProps.item === nextProps.item &&
        prevProps.isEditMode === nextProps.isEditMode &&
        prevProps.selectedIds === nextProps.selectedIds &&
        prevProps.columnOrder === nextProps.columnOrder &&
        prevProps.columnVisibility === nextProps.columnVisibility &&
        prevProps.revealedCells === nextProps.revealedCells &&
        prevProps.hiddenColumns === nextProps.hiddenColumns
    );
});

export default SheetRow;
