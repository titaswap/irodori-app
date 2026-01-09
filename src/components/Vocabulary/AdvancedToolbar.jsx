
import React, { useState, useMemo } from 'react';
import { 
  Folder, Loader, PenTool, Target, ArrowRight, ChevronDown, 
  Eye, EyeOff, AlertCircle, BarChart2, Undo, Save as SaveIcon, 
  Lock, Sparkles, Brain, Play, RefreshCw, Settings as SettingsIcon, Grid
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
        if (isAll) {
           // If currently All, maybe select nothing? Or keeping it empty IS all. 
           // If user clicks "All" when it is All, nothing happens or verify logic?
           // If we want to "Deselect All" (which effectively is 0 items selected... wait, 0 items = All in our logic).
           // Let's say: If All is active, clicking specific option adds it?
           // Actually, "All" option should clear the array.
           onChange([]);
        } else {
           onChange([]);
        }
    };

    const summary = isAll ? "All" : safeSelected.length === 1 ? safeSelected[0] : `${safeSelected.length} selected`;

    return (
        <div className="relative group" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center justify-between gap-2 appearance-none bg-white border border-slate-300 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-3 rounded hover:border-blue-400 focus:outline-none min-w-[120px] ${isOpen ? 'ring-2 ring-blue-100 border-blue-400' : ''}`}
            >
                <span className="truncate max-w-[100px]">{label}: {summary}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto p-1">
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
  // const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true); // REMOVED
  
  const [showChipPanel, setShowChipPanel] = useState(true);

  const lessonCounts = useMemo(() => {
    const counts = {};
    // Use vocabList (context data) instead of filteredData to keep valid options visible even when filtered
    vocabList.forEach(item => { const l = item.lesson || '?'; counts[l] = (counts[l] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => (parseInt(a[0]) || 999) - (parseInt(b[0]) || 999));
  }, [vocabList]);

  const candoCounts = useMemo(() => {
    const counts = {};
    vocabList.forEach(item => { const c = item.cando || '?'; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort();
  }, [vocabList]);



  return (
    <div className="bg-white border-b border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-sm sticky top-0">
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
               <button 
                    onClick={() => setShowChipPanel(prev => !prev)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors focus:outline-none"
                    title={showChipPanel ? "Hide Filter Chips" : "Show Filter Chips"}
                >
                    {showChipPanel ? <ChevronDown size={12}/> : <ArrowRight size={12}/>} Chips
                </button>
           </div>
       </div>

       {/* CHIPS AREA - GLOBAL TOGGLE */}
       {showChipPanel && (
           <div className="flex flex-col gap-1 p-2 bg-slate-50/50 border-b border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-300">
               {/* Lesson Chips */}
               <FilterChipBar 
                   label="L" 
                   items={lessonCounts} 
                   activeValues={filters.lesson} 
                   onToggle={(val) => {
                       const curr = filters.lesson || [];
                       const isSelected = curr.includes(val);
                       let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val];
                       onFilterChange({...filters, lesson: newVals});
                   }}
                   color="blue"
               />
               {/* Cando Chips */}
               <FilterChipBar 
                   label="C" 
                   items={candoCounts} 
                   activeValues={filters.cando} 
                   onToggle={(val) => {
                       const curr = filters.cando || [];
                       const isSelected = curr.includes(val);
                       let newVals = isSelected ? curr.filter(v => v !== val) : [...curr, val];
                       onFilterChange({...filters, cando: newVals});
                   }}
                   color="indigo"
               />
           </div>
       )}



       {/* UNIFIED CONTROLS TOOLBAR */}
       <div className="p-2 flex flex-wrap items-center gap-2 bg-white sticky top-[48px] z-10">
            {/* Filter Group */}
             <div className="flex gap-2">
                 <MultiSelectDropdown 
                     label="Lesson" 
                     options={[...new Set(vocabList.map(v => String(v.lesson)))].sort((a,b)=>(parseInt(a)||0)-(parseInt(b)||0))} 
                     selectedValues={filters.lesson} 
                     onChange={(val) => onFilterChange({...filters, lesson: val})} 
                 />
                 <MultiSelectDropdown 
                     label="Can-do" 
                     options={[...new Set(vocabList.map(v => String(v.cando)))].sort((a,b)=>(parseInt(a)||0)-(parseInt(b)||0))} 
                     selectedValues={filters.cando} 
                     onChange={(val) => onFilterChange({...filters, cando: val})} 
                 />
            </div>

            <div className="w-px h-6 bg-slate-100 mx-1"></div>

            {/* Language Toggles */}
            <div className="flex gap-1 items-center">
                <button onClick={() => onVisibilityToggle('bangla')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${hiddenColumns.bangla ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{hiddenColumns.bangla ? <EyeOff size={12}/> : <Eye size={12}/>} BN</button>
                <button onClick={() => onVisibilityToggle('japanese')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${hiddenColumns.japanese ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{hiddenColumns.japanese ? <EyeOff size={12}/> : <Eye size={12}/>} JP</button>
                 <button onClick={() => onVisibilityToggle('kanji')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${hiddenColumns.kanji ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{hiddenColumns.kanji ? <EyeOff size={12}/> : <Eye size={12}/>} KN</button>
            </div>

            <div className="w-px h-6 bg-slate-100 mx-1"></div>

            {/* View Modes */}
            <div className="flex gap-1 items-center">
                <button onClick={() => onViewModeChange('problem')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'problem' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}><AlertCircle size={14}/> Marked</button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button 
                    onClick={() => setShowChipPanel(!showChipPanel)} 
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all border ${showChipPanel ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    title={showChipPanel ? "Hide Chips Panel" : "Show Chips Panel"}
                >
                    {showChipPanel ? <ChevronDown size={14}/> : <ArrowRight size={14}/>} Chips
                </button>
            </div>
            
            <div className="flex-grow"></div>

            {/* Actions Group */}
            <div className="flex gap-1 items-center justify-end">
                {isEditMode ? (
                    <>
                        <button onClick={onDiscard} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><Undo size={14}/> Discard</button>
                        <button onClick={onSave} disabled={!hasUnsavedChanges || isSyncing} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-all ${hasUnsavedChanges ? 'bg-green-600 text-white hover:bg-green-700 animate-pulse' : 'bg-slate-100 text-slate-400'} disabled:opacity-50`}><SaveIcon size={14}/> Save</button>
                    </>
                ) : (
                    <button onClick={onEditModeToggle} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-xs font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><Lock size={14}/> Locked</button>
                )}
                {!isEditMode && (
                    <>
                        <button onClick={onPlaylistStart} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-slate-800 text-white rounded-lg shadow text-xs font-bold hover:bg-slate-900 disabled:opacity-50"><Play size={14}/></button>
                    </>
                )}
                {/* New Refresh Button */}
                 <button onClick={onRefresh} disabled={isSyncing || isEditMode} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors" title="Refresh Data">
                     <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                 </button>
                 <button onClick={() => setIsColumnManagerOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors" title="Manage Columns">
                     <SettingsIcon size={14}/> Cols
                 </button>
                 <button onClick={onShuffle} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors" title="Randomize Order">
                     <Sparkles size={14} className="text-purple-500"/> Shuffle
                 </button>
                {isEditMode && <button onClick={onImportOpen} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow text-xs font-bold disabled:opacity-50"><Grid size={14}/> Import</button>}
            </div>
       </div>
    </div>
  );
};

export default AdvancedToolbar;
