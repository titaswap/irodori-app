
import React, { useState, useMemo } from 'react';
import {
    Folder, Loader, PenTool, Target, ArrowRight, ChevronDown,
    Eye, EyeOff, AlertCircle, BarChart2, Undo, Save as SaveIcon,
    Lock, Shuffle, Brain, Play, RefreshCw, Settings as SettingsIcon, Grid, MoreVertical
} from 'lucide-react';
// import { ProgressTrendChart, WeaknessCard } from './StatsWidgets'; // REMOVED
import { X } from 'lucide-react';

const FilterChipBar = ({ label, items, activeValues, onToggle, color = 'blue' }) => {
    // items: [[value, count], ...]
    if (!items || items.length === 0) return null;
    const safeActive = Array.isArray(activeValues) ? activeValues : [];

    const colorClasses = {
        blue: { active: 'bg-blue-600 text-white shadow-md shadow-blue-200', inactive: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-blue-300' },
        indigo: { active: 'bg-indigo-600 text-white shadow-md shadow-indigo-200', inactive: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300' }
    };
    const styles = colorClasses[color] || colorClasses.blue;

    return (
        <div className="flex items-center gap-2 overflow-hidden px-1 select-none transition-all duration-300 h-7 border-b border-transparent">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-0.5 w-[50px] shrink-0 text-right">
                {label === 'L' ? 'Lesson' : 'Can-do'}
            </div>

            <div className="flex gap-1 overflow-x-auto items-center h-full no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>
                {items.map(([val, count]) => {
                    const isActive = safeActive.includes(val);
                    return (
                        <button
                            key={val}
                            onClick={() => onToggle(val)}
                            title={`${label === 'L' ? 'Lesson' : 'Can-do'} ${val} – ${count} words`}
                            className={`
                                    flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shrink-0
                                    ${isActive ? styles.active : styles.inactive}
                                `}
                        >
                            <span>{label}{val}</span>
                            <span className={`text-[9px] opacity-70 ${isActive ? 'bg-white/20 px-1 rounded-[2px]' : 'text-slate-400 bg-slate-100 px-1 rounded-[2px]'}`}>{count}</span>
                            {isActive && <X size={10} className="ml-0.5 opacity-80 hover:opacity-100" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- MULTI-SELECT DROPDOWN COMPONENT ---
const MultiSelectDropdown = ({ label, options, selectedValues, onChange }) => {
    // selectedValues is now expected to be an array.
    // If it's 'all' (legacy) or empty array, it means All.
    const safeSelected = Array.isArray(selectedValues) ? selectedValues : [];
    const isAll = safeSelected.length === 0;

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target) && (!dropdownRef.current || !dropdownRef.current.contains(event.target))) {
                setIsOpen(false);
            }
        };
        const handleScroll = (e) => {
            // If dragging scrollbar or scrolling inside dropdown, ignore
            if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // Capture scroll to close
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const toggleOption = (val) => {
        let newSelected;
        if (safeSelected.includes(val)) {
            newSelected = safeSelected.filter(v => v !== val);
        } else {
            newSelected = [...safeSelected, val];
        }
        onChange(newSelected);
    };

    const toggleAll = () => {
        onChange([]);
    };

    const summary = isAll ? "All" : safeSelected.length === 1 ? safeSelected[0] : `${safeSelected.length} selected`;

    return (
        <div className="relative group flex-shrink-0" ref={containerRef}>
            <button
                onClick={(e) => {
                    if (!isOpen) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                    }
                    setIsOpen(!isOpen);
                }}
                title={`${label} Filter`}
                className={`
                    flex items-center justify-center gap-2 appearance-none 
                    transition-all duration-200
                    text-xs font-bold 
                    rounded-lg shadow-sm
                    focus:outline-none 
                    ${isOpen ? 'ring-2 ring-indigo-200' : ''}
                    h-9 min-w-[36px] md:min-w-[100px] md:px-2 md:justify-between px-0
                    ${!isAll
                        ? 'bg-indigo-600 text-white border border-indigo-600 shadow-indigo-200 dark:shadow-none'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400'
                    }
                `}
            >
                <div className="md:hidden flex items-center justify-center gap-0.5">
                    <span className="text-[11px] uppercase">{label.charAt(0)}</span>
                    <ChevronDown size={10} strokeWidth={3} className={`transition-transform ${isOpen ? 'rotate-180' : ''} opacity-80`} />
                </div>
                <span className="hidden md:block truncate max-w-[100px]">{label}: {summary}</span>
                <ChevronDown size={12} className={`hidden md:block transition-transform ${isOpen ? 'rotate-180' : ''} ${!isAll ? 'text-indigo-200' : 'text-slate-400'}`} />
            </button>
            {isOpen && (
                <div
                    ref={dropdownRef}
                    style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
                    className="w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-[9999] max-h-64 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
                >
                    <div
                        onClick={() => { toggleAll(); setIsOpen(false); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-bold ${isAll ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAll ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                            {isAll && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                        </div>
                        All
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    {options.map(opt => {
                        const isSelected = safeSelected.includes(opt);
                        return (
                            <div
                                key={opt}
                                onClick={() => toggleOption(opt)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-medium ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                                    {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                {label} {opt}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AdvancedToolbar = ({ currentFolderId, folders, vocabList, isEditMode, hasUnsavedChanges, filters, hiddenColumns, viewMode, onFilterChange, onViewModeChange, onVisibilityToggle, onSave, onDiscard, onPlaylistStart, setIsColumnManagerOpen, isSyncing, filteredData, onRefresh, onShuffle, isPlaying, onTogglePlay, showingCount, totalCount }) => {
    const [showChipPanel, setShowChipPanel] = useState(false);

    const containerRef = React.useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

    React.useLayoutEffect(() => {
        const handleWindowResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleWindowResize);

        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0) {
                    setContainerWidth(Math.floor(entry.contentRect.width));
                }
            }
        });
        if (containerRef.current) observer.observe(containerRef.current);

        if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            observer.disconnect();
        };
    }, []);

    const baseReservedWidth = 90;
    const itemCost = 36;

    let available = containerWidth - baseReservedWidth;

    const showMarked = isDesktop || available >= itemCost;
    if (!isDesktop && showMarked) available -= itemCost;

    const showPlay = isDesktop || (!isEditMode && available >= itemCost);
    if (!isDesktop && showPlay && !isEditMode) available -= itemCost;

    const showShuffle = isDesktop || (!isEditMode && available >= itemCost);
    if (!isDesktop && showShuffle && !isEditMode) available -= itemCost;

    const showChips = isDesktop || available >= itemCost;
    if (!isDesktop && showChips) available -= itemCost;

    const showRefresh = isDesktop || available >= itemCost;

    if (!isDesktop && showRefresh) available -= itemCost;

    const showColumns = isDesktop || available >= itemCost;
    if (!isDesktop && showColumns) available -= itemCost;

    // Language Group Cost ~100px (3 buttons + label)
    // Always show languages as they are critical controls, relying on overflow-x-auto for mobile layout
    const showLanguages = true;




    const lessonCounts = useMemo(() => {
        const counts = {};
        vocabList.forEach(item => { const l = item.lesson || '?'; counts[l] = (counts[l] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => (parseInt(a[0]) || 999) - (parseInt(b[0]) || 999));
    }, [vocabList]);

    const candoCounts = useMemo(() => {
        const counts = {};
        vocabList.forEach(item => { const c = item.cando || '?'; counts[c] = (counts[c] || 0) + 1; });
        return Object.entries(counts).sort();
    }, [vocabList]);

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 z-20 shadow-sm sticky top-0 max-w-[100vw]">
            {showChipPanel && (
                <div className="flex flex-col gap-0.5 p-0.5 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <FilterChipBar label="L" items={lessonCounts} activeValues={filters.lesson} onToggle={(val) => { const curr = filters.lesson || []; const isSelected = curr.includes(val); let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val]; onFilterChange({ ...filters, lesson: newVals }); }} color="blue" />
                    <FilterChipBar label="C" items={candoCounts} activeValues={filters.cando} onToggle={(val) => { const curr = filters.cando || []; const isSelected = curr.includes(val); let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val]; onFilterChange({ ...filters, cando: newVals }); }} color="indigo" />
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-[100vw]">
                <div ref={containerRef} className="flex items-center gap-1 p-1 overflow-x-auto no-scrollbar pr-4">
                    {/* Status Indicators (Folder Nav removed) */}
                    {isSyncing && <Loader size={12} className="text-blue-600 animate-spin mr-2 flex-shrink-0" />}
                    {hasUnsavedChanges && !isSyncing && <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse flex-shrink-0" title="Unsaved Changes"></div>}

                    <div className="flex gap-1">
                        <MultiSelectDropdown label="Lesson" options={[...new Set(vocabList.map(v => String(v.lesson)))].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))} selectedValues={filters.lesson} onChange={(val) => onFilterChange({ ...filters, lesson: val })} />
                        <MultiSelectDropdown label="Can-do" options={[...new Set(vocabList.map(v => String(v.cando)))].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))} selectedValues={filters.cando} onChange={(val) => onFilterChange({ ...filters, cando: val })} />
                    </div>

                    {/* --- VIEW ACTIONS GROUP --- */}
                    <div className="flex items-center bg-slate-100/60 dark:bg-slate-800/60 p-0.5 rounded-lg gap-0.5 flex-shrink-0">
                        {showMarked && (
                            <button
                                onClick={() => onViewModeChange('problem')}
                                className={`flex items-center justify-center gap-1 h-8 px-2.5 rounded-md text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${viewMode === 'problem' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                title="Toggle Marked View"
                            >
                                <AlertCircle size={14} className={viewMode === 'problem' ? "fill-red-100" : ""} />
                                <span className={viewMode === 'problem' ? "inline" : "hidden md:inline"}>Marked</span>
                            </button>
                        )}
                    </div>

                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0"></div>

                    {/* --- PLAYBACK GROUP --- */}
                    {!isEditMode && (
                        <div className="flex items-center bg-slate-100/60 dark:bg-slate-800/60 p-0.5 rounded-lg gap-0.5 flex-shrink-0">
                            {showPlay && (
                                <button
                                    onClick={isPlaying ? onTogglePlay : onPlaylistStart}
                                    disabled={isSyncing}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95 disabled:opacity-50 ${isPlaying ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm dark:hover:text-slate-200'}`}
                                    title={isPlaying ? "Pause" : "Start Playlist"}
                                >
                                    {isPlaying ? <div className="flex gap-0.5"><div className="w-1 h-3 bg-current rounded-full"></div><div className="w-1 h-3 bg-current rounded-full"></div></div> : <Play size={14} className="ml-0.5 fill-current" />}
                                </button>
                            )}
                            {showShuffle && (
                                <button onClick={onShuffle} disabled={isSyncing} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-sm transition-all active:scale-95 disabled:opacity-50" title="Shuffle">
                                    <Shuffle size={14} />
                                </button>
                            )}
                            {showRefresh && (
                                <button onClick={onRefresh} disabled={isSyncing} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all active:scale-95 disabled:opacity-50" title="Refresh">
                                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* --- LANGUAGE TOGGLE (Segmented Control) --- */}
                    {showLanguages && (
                        <div className="flex items-center ml-1 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0">
                            <button
                                onClick={() => onVisibilityToggle('bangla')}
                                className={`h-8 w-8 md:w-auto md:px-3 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all duration-200 ${hiddenColumns.bangla ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md hover:shadow-lg active:shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent border-none'}`}
                                title={!hiddenColumns.bangla ? "Hide Bangla" : "Show Bangla"}
                            >
                                BN
                            </button>
                            <button
                                onClick={() => onVisibilityToggle('japanese')}
                                className={`h-8 w-8 md:w-auto md:px-3 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all duration-200 ${hiddenColumns.japanese ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md hover:shadow-lg active:shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent border-none'}`}
                                title={!hiddenColumns.japanese ? "Hide Japanese" : "Show Japanese"}
                            >
                                JP
                            </button>
                        </div>
                    )}

                    {/* Columns Button (Standalone) */}
                    {showChips && (
                        <button
                            onClick={() => setShowChipPanel(!showChipPanel)}
                            className={`flex-shrink-0 flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ml-1 ${showChipPanel ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title={showChipPanel ? "Hide Chips" : "Show Chips"}
                        >
                            {showChipPanel ? <ChevronDown size={14} /> : <ArrowRight size={14} />}
                            <span className="hidden md:inline">Chips</span>
                        </button>
                    )}
                    {showColumns && (
                        <button onClick={() => setIsColumnManagerOpen(true)} className="ml-0.5 w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Columns">
                            <SettingsIcon size={16} />
                        </button>
                    )}
                    {/* Desktop Folder Info (Right aligned) */}
                    <div className="hidden md:flex items-center gap-2 ml-auto mr-2 text-[11px] bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <div className="font-bold text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                            {currentFolderId === 'root' ? 'My Drive' : folders.find(f => f.id === currentFolderId)?.name || '...'}
                        </div>
                        <div className="text-slate-300 dark:text-slate-600">|</div>
                        <div className="text-slate-600 dark:text-slate-400 font-medium">
                            Showing <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">{showingCount !== undefined ? showingCount : filteredData.length}</span> / <span className="font-mono">{totalCount !== undefined ? totalCount : vocabList.length}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdvancedToolbar;
