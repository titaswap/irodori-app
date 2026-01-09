
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
        <div className="flex items-center gap-2 overflow-hidden py-1 px-1 select-none transition-all duration-300">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                {label === 'L' ? 'Lesson' : 'Can-do'}
             </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                {items.map(([val, count]) => {
                        const isActive = safeActive.includes(val);
                        return (
                            <button
                                key={val}
                                onClick={() => onToggle(val)}
                                title={`${label === 'L' ? 'Lesson' : 'Can-do'} ${val} – ${count} words`}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap
                                    ${isActive ? styles.active : styles.inactive}
                                `}
                            >
                                <span>{label}{val}</span>
                                <span className={`text-[10px] opacity-80 ${isActive ? 'bg-white/20 px-1 rounded' : 'text-slate-400 bg-slate-100 px-1 rounded'}`}>{count}</span>
                                {isActive && <X size={10} className="ml-0.5 opacity-80 hover:opacity-100" />}
                            </button>
                        );
                    })}
            </div>
        </div>
    );
};


const useAnimatedCounter = (end, duration = 600) => {
  const [count, setCount] = useState(0);
  React.useEffect(() => {
    let start = count; const startTime = performance.now(); let frameId;
    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime; const progress = Math.min(elapsedTime / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(start + (end - start) * ease));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    if (start !== end) frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end]);
  return count;
};

// --- MULTI-SELECT DROPDOWN COMPONENT ---
const MultiSelectDropdown = ({ label, options, selectedValues, onChange }) => {
    // selectedValues is now expected to be an array.
    // If it's 'all' (legacy) or empty array, it means All.
    const safeSelected = Array.isArray(selectedValues) ? selectedValues : [];
    const isAll = safeSelected.length === 0;

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                onClick={() => setIsOpen(!isOpen)} 
                title={`${label} Filter`}
                className={`
                    flex items-center justify-center gap-2 appearance-none 
                    transition-all duration-200
                    text-xs font-bold 
                    rounded shadow-sm
                    focus:outline-none 
                    ${isOpen ? 'ring-2 ring-indigo-200' : ''}
                    h-8 min-w-[36px] md:min-w-[120px] md:px-3 md:justify-between px-0
                    ${!isAll 
                        ? 'bg-indigo-600 text-white border border-indigo-600 shadow-indigo-200' 
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-400'
                    }
                `}
            >
                <div className="md:hidden flex items-center justify-center gap-0.5">
                    <span className="text-[11px] uppercase">{label.charAt(0)}</span>
                    <ChevronDown size={10} strokeWidth={3} className={`transition-transform ${isOpen ? 'rotate-180' : ''} opacity-80`} />
                </div>
                <span className="hidden md:block truncate max-w-[100px]">{label}: {summary}</span>
                <ChevronDown size={12} className={`hidden md:block transition-transform ${isOpen ? 'rotate-180' : ''} ${!isAll ? 'text-indigo-200' : 'text-slate-400'}`}/>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div 
                        onClick={() => { toggleAll(); setIsOpen(false); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-bold ${isAll ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAll ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                            {isAll && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                        </div>
                        All
                    </div>
                    <div className="h-px bg-slate-100 my-1"></div>
                    {options.map(opt => {
                        const isSelected = safeSelected.includes(opt);
                        return (
                            <div 
                                key={opt} 
                                onClick={() => toggleOption(opt)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-medium ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                    {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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

const AdvancedToolbar = ({ currentFolderId, folders, vocabList, selectedIds, isEditMode, hasUnsavedChanges, filters, hiddenColumns, viewMode, onFolderChange, onDeleteRequest, onEditModeToggle, onFilterChange, onViewModeChange, onVisibilityToggle, onSave, onDiscard, onPracticeStart, onPlaylistStart, onImportOpen, setIsColumnManagerOpen, isSyncing, filteredData, onStartSmartPractice, trendData, suggestion, onApplySuggestion, onRefresh, onShuffle }) => {
  const animatedCount = useAnimatedCounter(filteredData.length);
  
  const [showChipPanel, setShowChipPanel] = useState(true);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  
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
  const showLanguages = isDesktop || available >= 100;




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
    <div className="bg-white border-b border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-sm sticky top-0 max-w-[100vw]">
       <div className="h-12 border-b border-slate-100 flex items-center px-4 justify-between bg-slate-50/50">
           <div className="flex items-center text-sm font-medium text-slate-500">
               <button onClick={() => onFolderChange('root')} className="hover:text-blue-600 flex items-center gap-1"><Folder size={14} className="fill-slate-400 text-slate-400"/> My Drive</button>
               {currentFolderId !== 'root' && folders.find(f => f.id === currentFolderId) && <><span className="mx-2 text-slate-300">/</span><span className="text-slate-800 font-bold flex items-center gap-1"><Folder size={14} className="fill-yellow-400 text-yellow-500"/>{folders.find(f => f.id === currentFolderId).name}</span></>}
           </div>
           <div className="flex items-center gap-4">
               {isSyncing && <span className="flex items-center gap-1 text-xs font-bold text-blue-600 animate-pulse"><Loader size={12} className="animate-spin"/> Syncing...</span>}
               {hasUnsavedChanges && !isSyncing && <span className="flex items-center gap-1 text-xs font-bold text-red-600 animate-pulse"><div className="w-2 h-2 bg-red-600 rounded-full"></div> Unsaved Changes</span>}
               {isEditMode && <span className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><PenTool size={12}/> EDIT MODE</span>}
               <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">Showing <span className="font-bold text-indigo-600">{animatedCount}</span> of {vocabList.length}</div>
           </div>
       </div>

       {showChipPanel && (
           <div className="flex flex-col gap-1 p-2 bg-slate-50/50 border-b border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-300">
               <FilterChipBar label="L" items={lessonCounts} activeValues={filters.lesson} onToggle={(val) => { const curr = filters.lesson || []; const isSelected = curr.includes(val); let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val]; onFilterChange({...filters, lesson: newVals}); }} color="blue" />
               <FilterChipBar label="C" items={candoCounts} activeValues={filters.cando} onToggle={(val) => { const curr = filters.cando || []; const isSelected = curr.includes(val); let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val]; onFilterChange({...filters, cando: newVals}); }} color="indigo" />
           </div>
       )}

       <div className="bg-white sticky top-[48px] z-10 border-b border-slate-200 shadow-sm max-w-[100vw]">
            <div ref={containerRef} className="flex items-center gap-1 md:gap-2 p-2 overflow-x-auto no-scrollbar">
                 <div className="flex gap-1 md:gap-2">
                     <MultiSelectDropdown label="Lesson" options={[...new Set(vocabList.map(v => String(v.lesson)))].sort((a,b)=>(parseInt(a)||0)-(parseInt(b)||0))} selectedValues={filters.lesson} onChange={(val) => onFilterChange({...filters, lesson: val})} />
                     <MultiSelectDropdown label="Can-do" options={[...new Set(vocabList.map(v => String(v.cando)))].sort((a,b)=>(parseInt(a)||0)-(parseInt(b)||0))} selectedValues={filters.cando} onChange={(val) => onFilterChange({...filters, cando: val})} />
                 </div>
                 <div className="w-px h-6 bg-slate-100 mx-1 flex-shrink-0"></div>
                 {showMarked && (
                    <button onClick={() => onViewModeChange('problem')} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'problem' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} title="Toggle Marked View">
                        <AlertCircle size={14}/> 
                        <span className="hidden md:inline">Marked</span>
                    </button>
                 )}
                 
                 {!isEditMode && (
                    <>
                        {showPlay && <button onClick={onPlaylistStart} disabled={isSyncing} className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded-lg shadow hover:bg-slate-900 disabled:opacity-50" title="Start Playlist"><Play size={14}/></button>}
                        {showShuffle && <button onClick={onShuffle} disabled={isSyncing} className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-purple-600 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50" title="Shuffle"><Shuffle size={14}/></button>}
                    </>
                 )}
                 
                 {showRefresh && (
                     <button onClick={onRefresh} disabled={isSyncing} className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50" title="Refresh">
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                     </button>
                 )}


                 
                 {showLanguages && (
                    <div className="hidden md:flex items-center gap-1 scale-90 origin-left">
                        <button onClick={() => onVisibilityToggle('bangla')} className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${hiddenColumns.bangla ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>BN</button>
                        <button onClick={() => onVisibilityToggle('japanese')} className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${hiddenColumns.japanese ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>JP</button>
                        <button onClick={() => onVisibilityToggle('kanji')} className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${hiddenColumns.kanji ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>KN</button>
                    </div>
                 )}
                 {/* Mobile version of languages in main bar if enabled */}
                  {showLanguages && (
                    <div className="md:hidden flex items-center gap-1">
                        <button onClick={() => onVisibilityToggle('bangla')} className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] font-bold transition-colors ${hiddenColumns.bangla ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>BN</button>
                        <button onClick={() => onVisibilityToggle('japanese')} className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] font-bold transition-colors ${hiddenColumns.japanese ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>JP</button>
                        <button onClick={() => onVisibilityToggle('kanji')} className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] font-bold transition-colors ${hiddenColumns.kanji ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>KN</button>
                    </div>
                 )}


                 {isEditMode && (
                     <>
                        <button onClick={onDiscard} className="bg-white border px-2 py-1 rounded text-xs whitespace-nowrap"><Undo size={14}/></button>
                        <button onClick={onSave} className="bg-green-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap"><SaveIcon size={14}/></button>
                     </>
                 )}
                 {showChips && (
                    <button onClick={() => setShowChipPanel(!showChipPanel)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${showChipPanel ? 'bg-indigo-600 text-white border border-indigo-600 shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200'}`} title={showChipPanel ? "Hide Chips" : "Show Chips"}>
                        {showChipPanel ? <ChevronDown size={14}/> : <ArrowRight size={14}/>} 
                        <span className="hidden md:inline">Chips</span>
                    </button>
                 )}
                 {showColumns && (
                    <button onClick={() => setIsColumnManagerOpen(true)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50" title="Columns">
                        <SettingsIcon size={14}/>
                    </button>
                 )}
                 <div className="w-px h-6 bg-slate-100 mx-1 flex-shrink-0"></div>
                 <button onClick={() => setIsOverflowOpen(!isOverflowOpen)} className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isOverflowOpen ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {isOverflowOpen ? <X size={16}/> : <MoreVertical size={16}/>}
                 </button>
            </div>

            {isOverflowOpen && (
                <div className="border-t border-slate-100 bg-slate-50 p-3 animate-in slide-in-from-top-2 shadow-inner">
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-3 pb-3 border-b border-slate-200">
                        {!showChips && (
                             <button onClick={() => { setShowChipPanel(!showChipPanel); setIsOverflowOpen(false); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-xs font-bold justify-center min-w-[40px] ${showChipPanel ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200'}`}>
                                <ArrowRight size={16} className={showChipPanel ? "rotate-90" : ""} /> Chips
                             </button>
                        )}
                        {!showShuffle && !isEditMode && <button onClick={onShuffle} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-purple-600 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 justify-center min-w-[40px]"><Shuffle size={16}/> Shuffle</button>}
                        {!showPlay && !isEditMode && <button onClick={onPlaylistStart} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg shadow text-xs font-bold hover:bg-slate-900 justify-center min-w-[40px]"><Play size={16}/> Play</button>}
                        {!showMarked && <button onClick={() => onViewModeChange('problem')} className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-xs font-bold justify-center min-w-[40px] ${viewMode === 'problem' ? 'bg-red-100 text-red-600' : 'bg-white border border-slate-200'}`}><AlertCircle size={16}/> Marked</button>}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {!showRefresh && (
                            <button onClick={onRefresh} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 justify-center min-w-[40px]" title="Refresh Data">
                                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> <span className="hidden md:inline">Refresh</span>
                            </button>
                        )}
                        {!showColumns && (
                            <button onClick={() => setIsColumnManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 justify-center min-w-[40px]" title="Manage Columns">
                                <SettingsIcon size={16}/> <span className="hidden md:inline">Columns</span>
                            </button>
                        )}
                        {isEditMode && <button onClick={onImportOpen} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow text-xs font-bold justify-center min-w-[40px]" title="Import Data"><Grid size={16}/> <span className="hidden md:inline">Import</span></button>}
                    </div>
                    
                    {!showLanguages && (
                        <div className="flex justify-center gap-2 mt-3 border-t border-slate-200 pt-3">
                            <span className="text-[10px] font-bold text-slate-400 self-center mr-1 hidden md:inline">SHOW:</span>
                            <button onClick={() => onVisibilityToggle('bangla')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${hiddenColumns.bangla ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>BN</button>
                            <button onClick={() => onVisibilityToggle('japanese')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${hiddenColumns.japanese ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>JP</button>
                            <button onClick={() => onVisibilityToggle('kanji')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${hiddenColumns.kanji ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>KN</button>
                        </div>
                    )}
                </div>
            )}
       </div>
    </div>
  );
};

export default AdvancedToolbar;
