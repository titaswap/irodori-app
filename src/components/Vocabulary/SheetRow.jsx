
import React from 'react';
import {
    Play, Pause, AlertCircle, EyeOff
} from 'lucide-react';
import { HeatmapBar } from './Shared';
import TagCell from '../../tags/TagCell';
import KanjiBreakdownCell from './KanjiBreakdownCell';
import { getMinWidth, getMaxWidth, isAutoWidth, shouldWrap, getEffectiveWidth } from '../../config/tableConfig';

import '../../styles/kanji-typography.css';
import { textHighlighter } from '../../utils/searchHighlighter.jsx';

const SheetRow = React.memo(({ item, columnOrder, columnDefs, columnVisibility, hiddenColumns, revealedCells, selectedIds, isPlaying, index, isEditMode, onUpdateCell, onRevealCell, onPlaySingle, onMark, isActive, allTags, searchTags, createTag, getTagName, toggleRowTag, isAuthenticated, searchTerm, columnWidths }) => {
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
                    <td
                        data-col-id={colId}
                        style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}
                        className={`selection-column px-2 py-0.5 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1] text-slate-900 dark:!bg-transparent dark:text-indigo-200' : 'bg-white/50 dark:bg-white/[0.02]'} text-center font-medium text-slate-500 text-xs`}
                    >
                        {index + 1}
                    </td>
                );
            case 'audio':
                return (
                    <td
                        data-col-id={colId}
                        style={{ width: '44px', minWidth: '44px', maxWidth: '44px' }}
                        className={`px-0 py-0.5 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1] dark:!bg-transparent' : 'bg-white/50 dark:bg-white/[0.02]'} text-center ${cellBaseClass}`}
                    >
                        <button
                            onClick={() => onPlaySingle(item)}
                            className={`p-1 rounded-full transition-all duration-300 ${isActive ? 'bg-[#4F46E5] text-white shadow-md scale-105' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 dark:bg-white/5 dark:hover:bg-primary/20 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/5'}`}
                        >
                            {isActive && isPlaying ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                    </td>
                );
            case 'isMarked':
            case 'ismarked':
                return (
                    <td
                        data-col-id="isMarked"
                        style={{
                            width: '40px',
                            minWidth: '40px',
                            maxWidth: '40px',
                            padding: '0'
                        }}
                        className="text-center"
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%'
                        }}>
                            <button
                                onClick={() => onMark(item.localId)}
                                style={{
                                    padding: 0,
                                    margin: 0
                                }}
                                className="hover:scale-105 transition-transform"
                            >
                                <AlertCircle
                                    size={16}
                                    className={item.isMarked ? "text-red-500 fill-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-slate-400 dark:text-slate-600"}
                                />
                            </button>
                        </div>
                    </td>
                );
            case 'tags':
                return <TagCell item={item} toggleRowTag={toggleRowTag} allTags={allTags} searchTags={searchTags} createTag={createTag} getTagName={getTagName} isAuthenticated={isAuthenticated} isActive={isActive} />;
            default:
                // Fixed width calculation - MOVED UP for shared use in default case
                const effectiveWidth = getEffectiveWidth(colId, columnWidths);
                const isAuto = isAutoWidth(colId);

                // DIRECT FIX: Force auto-width for Kanji columns (bypassing config caching issues)
                const KANJI_COLUMNS_LIST = ['Kanji', 'Kanji Word'];
                // DIRECT FIX: Force auto-width for icon columns (audio, isMarked)
                const ICON_COLUMNS_LIST = ['audio', 'isMarked', 'ismarked'];
                const forceAutoWidth = KANJI_COLUMNS_LIST.includes(colId) || ICON_COLUMNS_LIST.includes(colId);

                let widthStyle = {};

                if (forceAutoWidth) {
                    // Force auto-width for Kanji and icon columns
                    widthStyle = {
                        width: 'auto',
                        minWidth: 'fit-content'
                    };
                } else if (effectiveWidth !== undefined) {
                    // Strict manual/fixed width
                    widthStyle = {
                        minWidth: `${effectiveWidth}px`,
                        maxWidth: `${effectiveWidth}px`,
                        width: `${effectiveWidth}px`
                    };
                } else if (isAuto) {
                    // Auto-width: Content drives width, enforce fit-content
                    widthStyle = {
                        minWidth: 'fit-content',
                        width: 'auto'
                    };
                } else {
                    // Default constrained width (min/max range)
                    widthStyle = {
                        minWidth: `${getMinWidth(colId)}px`,
                        maxWidth: `${getMaxWidth(colId)}px`
                    };
                }

                // DIRECT FIX: Force small width for breakdown column (bypassing config caching)
                if (colId === 'breakdown') {
                    widthStyle = {
                        width: '100px',
                        minWidth: '100px',
                        maxWidth: '150px'
                    };
                }

                // DIRECT FIX: Force small width for Bangla column (bypassing config caching)
                // To change Bangla width, edit these values directly:
                if (colId === 'bangla' || colId === 'Bangla') {
                    widthStyle = {
                        width: '200px',
                        minWidth: '200px',
                        maxWidth: '200px'
                    };
                }

                // DIRECT FIX: Compact width for metadata columns
                if (['lesson', 'cando'].includes(colId)) {
                    widthStyle = {
                        width: '70px',
                        minWidth: '70px',
                        maxWidth: '70px'
                    };
                }

                // DIRECT FIX: Robust Book column logic (bypass config cache + allow resize)
                if (colId === 'book' || colId === 'Book') {
                    const manual = columnWidths[colId];
                    // Kanji folder constraint: strictly cap at 100px to prevent layout expansion
                    const isKanjiFolder = item.folderId === 'Kanji';
                    const defaultWidth = isKanjiFolder ? 100 : 100;
                    const maxWidth = isKanjiFolder ? 100 : 150; // Cap at 100px in Kanji folder

                    const width = manual ? Math.min(maxWidth, Math.max(70, manual)) : defaultWidth;

                    widthStyle = {
                        width: `${width}px`,
                        minWidth: '70px',
                        maxWidth: `${maxWidth}px`
                    };
                }

                // DIRECT FIX: Hard-lock English column to 240px
                if (colId === 'english' || colId === 'English') {
                    widthStyle = {
                        width: '240px',
                        minWidth: '240px',
                        maxWidth: '240px'
                    };
                }

                // NEW: Kanji folder + breakdown column special handling
                if (item.folderId === 'Kanji' && colId === 'breakdown') {
                    return (
                        <td data-col-id={colId}
                            style={widthStyle}
                            className={`px-0 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1] dark:!bg-transparent' : 'bg-white/40 dark:bg-white/[0.02]'}`}>
                            <KanjiBreakdownCell
                                value={item[colId]}
                                isActive={isActive}
                            />
                        </td>
                    );
                }

                // EXISTING: Default cell rendering (unchanged)
                const value = item[colId];
                // Support array values if any (e.g. multi-select) - cast to string
                const displayValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value || '');

                const isRevealedLocal = revealedCells[colId] === item.localId;
                const shouldShowContent = (!isHiddenMask || isRevealedLocal);

                const isPrimary = colId === 'japanese' || colId === 'hiragana' || colId === 'Hiragana'; // Simple heuristic for bolding

                // Special styling for kanji column in Kanji folder
                const KANJI_FOLDERS = ['Kanji', 'Kanji 660'];
                const KANJI_COLUMNS = ['Kanji', 'Kanji Word']; // পরে চাইলে আরো add করবে

                const isKanjiColumn =
                    KANJI_FOLDERS.includes(item.folderId) &&
                    KANJI_COLUMNS.includes(colId);



                return (
                    <td data-col-id={colId}
                        style={{
                            ...widthStyle,
                            whiteSpace: isKanjiColumn ? 'nowrap' : (shouldWrap(colId) ? 'normal' : 'nowrap'),
                            ...(isKanjiColumn ? {} : {
                                wordWrap: 'break-word',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                            })
                        }}
                        className={`px-0 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1] dark:!bg-transparent' : 'bg-white/40 dark:bg-white/[0.02]'} ${!shouldShowContent && !isEditMode && !isActive ? 'bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm' : ''} ${isKanjiColumn ? 'kanji-cell-container' : ''}`}>
                        {!shouldShowContent && !isEditMode ? (
                            <div onClick={() => onRevealCell(item.localId, colId)} className={`w-full h-full px-2 py-0.5 text-transparent cursor-pointer ${isActive ? '' : 'hover:bg-indigo-50 dark:hover:bg-slate-700'} flex items-center justify-center transition-colors group/cell`}><EyeOff size={16} className="text-slate-300 dark:text-slate-600 group-hover/cell:text-slate-500 dark:group-hover/cell:text-slate-400" /></div>
                        ) : (
                            isEditMode ? <input className={`w-full h-full px-2 py-0.5 bg-transparent outline-none text-sm border-2 border-transparent focus:border-primary focus:bg-primary/10 transition-all text-slate-900 dark:text-text-main`} value={displayValue} onChange={(e) => onUpdateCell(item.localId, colId, e.target.value)} /> :
                                <div
                                    className={`w-full h-full flex items-center leading-tight ${isKanjiColumn ? 'kanji-cell kanji-nowrap' : isPrimary ? 'px-2 py-0.5 text-sm font-bold text-slate-800 dark:text-[#e5e7eb]' : 'px-2 py-0.5 text-sm text-slate-600 dark:text-[#cbd5e1]'} ${isActive && !isKanjiColumn ? 'text-slate-900 font-bold dark:text-indigo-100' : ''}`}
                                    style={{
                                        whiteSpace: isKanjiColumn ? 'nowrap' : (shouldWrap(colId) ? 'normal' : 'nowrap'),
                                        ...(isKanjiColumn ? {} : {
                                            wordWrap: 'break-word',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word'
                                        })
                                    }}
                                >
                                    {textHighlighter(displayValue, searchTerm)}
                                </div>
                        )}
                    </td>
                );
        }
    };

    return (
        <tr className={`glossy-row group border-b border-slate-200 dark:border-white/10 transition-all duration-150 
            ${isSelected
                ? 'bg-primary/10 dark:bg-primary/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]'
                : isActive
                    ? '!bg-[#e5f5f1] dark:!bg-[rgba(99,102,241,0.18)] dark:hover:!bg-[rgba(99,102,241,0.26)] border-l-[6px] border-l-green-300 dark:border-l-[#6366f1] shadow-xl scale-[1.003] z-10 relative ring-2 ring-[#e5f5f1]/10 dark:ring-transparent'
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

    // Check columnWidths change
    if (prevProps.columnWidths !== nextProps.columnWidths) return false;

    // Otherwise, use shallow comparison for performance
    return (
        prevProps.item === nextProps.item &&
        prevProps.isEditMode === nextProps.isEditMode &&
        prevProps.selectedIds === nextProps.selectedIds &&
        prevProps.columnOrder === nextProps.columnOrder &&
        prevProps.columnVisibility === nextProps.columnVisibility &&
        prevProps.revealedCells === nextProps.revealedCells &&
        prevProps.hiddenColumns === nextProps.hiddenColumns &&
        prevProps.allTags === nextProps.allTags &&
        prevProps.searchTerm === nextProps.searchTerm
    );
});

export default SheetRow;
