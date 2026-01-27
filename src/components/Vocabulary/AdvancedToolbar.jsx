import React, { useState, useMemo } from 'react';
import {
    Loader, ArrowRight, ChevronDown,
    Shuffle, Play, RefreshCw, Settings as SettingsIcon
} from 'lucide-react';
import { FilterChipBar } from './Toolbar/FilterChipBar';
import { MultiSelectDropdown } from './Toolbar/MultiSelectDropdown';

const AdvancedToolbar = ({ currentFolderId, folders, vocabList, isEditMode, hasUnsavedChanges, filters, hiddenColumns, viewMode, onFilterChange, onViewModeChange, onVisibilityToggle, onSave, onDiscard, onPlaylistStart, setIsColumnManagerOpen, isSyncing, filteredData, onRefresh, onShuffle, isPlaying, onTogglePlay, showingCount, totalCount, setIsMobileSidebarOpen, createTag, renameTag, deleteTag, allTags }) => {
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

    const showMarked = !isDesktop || available >= itemCost;
    if (isDesktop && showMarked) available -= itemCost;

    const showPlay = !isDesktop || (!isEditMode && available >= itemCost);
    if (isDesktop && showPlay && !isEditMode) available -= itemCost;

    const showShuffle = !isDesktop || (!isEditMode && available >= itemCost);
    if (isDesktop && showShuffle && !isEditMode) available -= itemCost;

    const showChips = !isDesktop || available >= itemCost;
    if (isDesktop && showChips) available -= itemCost;

    const showRefresh = !isDesktop || available >= itemCost;

    if (isDesktop && showRefresh) available -= itemCost;

    const showColumns = !isDesktop || available >= itemCost;
    if (isDesktop && showColumns) available -= itemCost;

    // Language Group Cost ~100px (3 buttons + label)
    // Always show languages as they are critical controls, relying on overflow-x-auto for mobile layout
    const showLanguages = true;




    const lessonCounts = useMemo(() => {
        const counts = {};
        filteredData.forEach(item => { const l = item.lesson || '?'; counts[l] = (counts[l] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => (parseInt(a[0]) || 999) - (parseInt(b[0]) || 999));
    }, [filteredData]);

    const candoCounts = useMemo(() => {
        const counts = {};
        filteredData.forEach(item => { const c = item.cando || '?'; counts[c] = (counts[c] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => {
            const numA = parseInt(a[0].replace(/\D/g, '')) || 0;
            const numB = parseInt(b[0].replace(/\D/g, '')) || 0;
            return numA - numB;
        });
    }, [filteredData]);

    return (
        <div className="bg-slate-50 dark:bg-[#030413] border-b border-slate-300 dark:border-white/5 flex flex-col flex-shrink-0 z-20 sticky top-0 max-w-[100vw] shadow-sm">

            {/* --- ROW 1: MOBILE ONLY (Logo & Menu) --- */}
            <div className="md:hidden flex items-center justify-between px-3 py-1 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-indigo-600 rounded flex-shrink-0 flex items-center justify-center font-bold text-base shadow-lg text-white">あ</div>
                    <span className="font-bold text-base tracking-tight leading-none">Irodori<span className="text-indigo-500">AI</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-slate-400 font-mono text-right leading-none flex flex-col gap-0.5">
                        <div className="font-bold text-slate-700 dark:text-white max-w-[100px] truncate">{currentFolderId === 'root' ? 'My Drive' : folders.find(f => f.id === currentFolderId)?.name || '...'}</div>
                        <div className="opacity-80">{showingCount} / {totalCount}</div>
                    </div>
                    {setIsMobileSidebarOpen && (
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-1 -mr-1 text-slate-600 dark:text-slate-300">
                            <div className="space-y-[3px]"><div className="w-5 h-0.5 bg-current rounded-full"></div><div className="w-5 h-0.5 bg-current rounded-full"></div><div className="w-5 h-0.5 bg-current rounded-full"></div></div>
                        </button>
                    )}
                </div>
            </div>

            {/* --- ROW 2: TOOLBAR (Scrollable) --- */}
            {showChipPanel && (
                <div className="flex flex-col gap-0.5 p-0.5 bg-slate-100 dark:bg-[#0a0c20]/50 border-b border-slate-300 dark:border-white/5 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <FilterChipBar label="L" items={lessonCounts} activeValues={filters.lesson} onToggle={(val) => { const curr = filters.lesson || []; const isSelected = curr.includes(val); let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val]; onFilterChange({ ...filters, lesson: newVals }); }} color="blue" />
                    <FilterChipBar label="C" items={candoCounts} activeValues={filters.cando} onToggle={(val) => { const curr = filters.cando || []; const isSelected = curr.includes(val); let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val]; onFilterChange({ ...filters, cando: newVals }); }} color="indigo" />
                </div>
            )}

            <div className="bg-transparent z-10 max-w-[100vw]">
                <div ref={containerRef} className="flex items-center gap-1.5 p-0.5 md:p-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {/* Status Indicators (Folder Nav removed) */}
                    {hasUnsavedChanges && !isSyncing && <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse flex-shrink-0" title="Unsaved Changes"></div>}

                    <div className="flex gap-1">
                        <MultiSelectDropdown label="Lesson" options={[...new Set(filteredData.map(v => String(v.lesson)))].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))} selectedValues={filters.lesson} onChange={(val) => onFilterChange({ ...filters, lesson: val })} />
                        <MultiSelectDropdown label="Can-do" options={[...new Set(filteredData.map(v => String(v.cando)))].sort((a, b) => {
                            const numA = parseInt(a.replace(/\D/g, '')) || 0;
                            const numB = parseInt(b.replace(/\D/g, '')) || 0;
                            return numA - numB;
                        })} selectedValues={filters.cando} onChange={(val) => onFilterChange({ ...filters, cando: val })} />
                        <MultiSelectDropdown
                            label="Tag"
                            options={allTags && allTags.length > 0 ? allTags : [...new Set(filteredData.flatMap(v => Array.isArray(v.tags) ? v.tags : []))].filter(Boolean).sort()}
                            selectedValues={filters.tags}
                            onChange={(val) => onFilterChange({ ...filters, tags: val })}
                            enableTagManagement={true}
                            onCreateTag={createTag}
                            onRenameTag={renameTag}
                            onDeleteTag={deleteTag}
                        />
                    </div>

                    {/* --- VIEW ACTIONS GROUP --- */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {showMarked && (
                            <button
                                onClick={() => onViewModeChange('problem')}
                                className={`flex items-center justify-center gap-1 h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none ${viewMode === 'problem' ? 'bg-primary text-white shadow-sm shadow-primary/20 border-transparent' : 'bg-slate-200 dark:bg-[#121432] border border-slate-400 dark:border-[#2d3269] text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-[#1a1d4a]'} active:scale-95`}
                                title="Toggle Marked View"
                            >
                                <span className="material-symbols-outlined text-sm text-primary-glow mr-0.5">info</span>
                                <span className={viewMode === 'problem' ? "inline" : "hidden md:inline"}>Marked</span>
                            </button>
                        )}
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-white/5 mx-1 flex-shrink-0"></div>

                    {/* --- PLAYBACK GROUP --- */}
                    {!isEditMode && (
                        <div className="flex items-center bg-slate-200/60 dark:bg-[#0a0c20]/50 rounded-2xl p-0.5 border border-slate-300 dark:border-white/5 gap-0.5 flex-shrink-0">
                            {showPlay && (
                                <button
                                    onClick={isPlaying ? onTogglePlay : onPlaylistStart}
                                    disabled={isSyncing}
                                    className="flex items-center justify-center h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none bg-transparent border border-slate-500 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-700 dark:hover:border-indigo-400/50"
                                    title={isPlaying ? "Pause" : "Start Playlist"}
                                >
                                    {isPlaying ? <div className="flex gap-0.5"><div className="w-0.5 h-2.5 bg-current rounded-full"></div><div className="w-0.5 h-2.5 bg-current rounded-full"></div></div> : <Play size={14} className="fill-current" />}
                                </button>
                            )}
                            {showShuffle && (
                                <button onClick={onShuffle} disabled={isSyncing} className="flex items-center justify-center h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5" title="Shuffle">
                                    <Shuffle size={14} />
                                </button>
                            )}
                            {showRefresh && (
                                <button onClick={onRefresh} disabled={isSyncing} className="flex items-center justify-center h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5" title="Refresh">
                                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* --- LANGUAGE TOGGLE (Segmented Control) --- */}
                    {showLanguages && (
                        <div className="flex gap-1 ml-1 flex-shrink-0">
                            <button
                                onClick={() => onVisibilityToggle('bangla')}
                                className={`flex items-center justify-center h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none ${hiddenColumns.bangla ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-slate-200 dark:bg-[#121432] border border-slate-400 dark:border-[#2d3269] text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-[#1a1d4a]'}`}
                                title={!hiddenColumns.bangla ? "Hide Bangla" : "Show Bangla"}
                            >
                                <span className="relative">BN</span>
                            </button>
                            <button
                                onClick={() => onVisibilityToggle('japanese')}
                                className={`flex items-center justify-center h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none ${hiddenColumns.japanese ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-slate-200 dark:bg-[#121432] border border-slate-400 dark:border-[#2d3269] text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-[#1a1d4a]'}`}
                                title={!hiddenColumns.japanese ? "Hide Japanese" : "Show Japanese"}
                            >
                                <span className="relative">JP</span>
                            </button>
                        </div>
                    )}

                    {/* Columns Button (Standalone) */}
                    {showChips && (
                        <button
                            onClick={() => setShowChipPanel(!showChipPanel)}
                            className="flex items-center justify-center gap-1 h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-2 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none bg-slate-200 dark:bg-[#121432] border border-slate-400 dark:border-[#2d3269] text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-[#1a1d4a] active:scale-95"
                            title={showChipPanel ? "Hide Chips" : "Show Chips"}
                        >
                            {showChipPanel ? <ChevronDown size={14} /> : <ArrowRight size={14} />}
                            <span className="hidden md:inline">Chips</span>
                        </button>
                    )}
                    {showColumns && (
                        <button onClick={() => setIsColumnManagerOpen(true)} className="flex items-center justify-center h-6 md:h-7 min-w-[24px] md:min-w-[28px] px-1 md:px-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none bg-slate-200 dark:bg-[#121432] border border-slate-400 dark:border-[#2d3269] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-[#1a1d4a]" title="Columns">
                            <SettingsIcon size={14} />
                        </button>
                    )}
                    {/* Desktop Folder Info (Right aligned) */}
                    <div className="hidden md:flex items-center gap-2 ml-auto mr-2 px-4 py-2 bg-slate-200/80 dark:bg-slate-900/60 border border-slate-400 dark:border-primary/40 rounded-full shadow-lg backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-primary-glow uppercase tracking-wider max-w-[200px] truncate">
                            {currentFolderId === 'root' ? 'My Drive' : folders.find(f => f.id === currentFolderId)?.name || '...'}
                        </span>
                        <div className="w-px h-3 bg-white/10"></div>
                        <span className="text-xs font-medium text-slate-400">
                            {showingCount !== undefined ? showingCount : filteredData.length} / {totalCount !== undefined ? totalCount : vocabList.length}
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdvancedToolbar;
