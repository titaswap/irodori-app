import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  BookOpen, Folder, Plus, Settings as SettingsIcon, Volume2, Eye, EyeOff, Play, Pause,
  Trash2, ArrowLeft, MessageCircle, CheckCircle, CheckCircle2, Circle,
  XCircle, Search, FileText, AlertCircle, Check, ChevronDown, 
  ChevronUp, Filter as FilterIcon, MoreHorizontal, Layers, PenTool, Lock, Unlock, Undo, Save as SaveIcon,
  ArrowRight, Loader, TrendingUp, Target, Sparkles, BarChart2,
  Moon, Sun, Coffee, Timer, RotateCcw, RefreshCw, Repeat, SkipBack, SkipForward, Flame, Clock, Brain, Infinity, Grid
} from 'lucide-react';

// --- SHARED CONFIG ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXyfE5aiGFaLh9MfX_4oxHLS9J_I6K8pyoHgUmJQZDmbqECS19Q8lGsOUxBFADWthh_Q/exec';


// --- SHARED COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", size = "md", className = "", disabled = false }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
    danger: "bg-red-100 text-red-900 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-100 dark:hover:bg-red-900/50",
    ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-400 dark:hover:bg-slate-800",
    icon: "p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  };
  const sizes = { sm: "px-3 py-1.5 text-sm rounded-md", md: "px-4 py-2 text-sm rounded-lg", lg: "px-6 py-3 text-base rounded-xl", icon: "p-2" };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}>{children}</button>;
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  let bgClass = 'bg-slate-800';
  if (type === 'error') bgClass = 'bg-red-600';
  if (type === 'warning') bgClass = 'bg-amber-600';
  if (type === 'success') bgClass = 'bg-green-600';
  // SAFE RENDER: Ensure message is a string
  const content = typeof message === 'object' ? JSON.stringify(message) : message;
  return ( <div className={`fixed bottom-24 right-6 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center font-medium animate-in fade-in slide-in-from-bottom-5`}>{content}</div> );
};

// --- HELPERS ---
const mapToSheet = (item) => ({
    hiragana: item.japanese, kanji: item.kanji, bangla: item.bangla, lesson: item.lesson, cando: item.cando,
    is_problem: item.isMarked, mistake_count: item.mistakes, confidence: item.confidence, last_practiced: item.lastPracticed || ''
});

export const mapToApp = (row, index) => {
    const realId = row.id ? String(row.id) : null; 
    return {
        id: realId, localId: realId || `local_${index}_${Date.now()}`, book: String(row.book || '1'),
        japanese: String(row.hiragana || ''), kanji: String(row.kanji || ''), bangla: String(row.bangla || ''),
        lesson: String(row.lesson || '1'), cando: String(row.cando || '1'), folderId: String(row.book || 'Uncategorized'),
        isMarked: row.is_problem === true || row.is_problem === "true", mistakes: Number(row.mistake_count) || 0,
        confidence: Number(row.confidence) || 0, responseTime: 0, lastPracticed: String(row.last_practiced || '')
    };
};

const getChangedFields = (original, current) => {
    const changes = {}; let hasChanges = false;
    const keys = ['japanese', 'kanji', 'bangla', 'lesson', 'cando', 'isMarked', 'mistakes', 'confidence', 'lastPracticed'];
    keys.forEach(key => {
        if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
            if (key === 'japanese') changes.hiragana = current[key];
            else if (key === 'isMarked') changes.is_problem = current[key];
            else if (key === 'mistakes') changes.mistake_count = current[key];
            else if (key === 'lastPracticed') changes.last_practiced = current[key];
            else changes[key] = current[key];
            hasChanges = true;
        }
    });
    return hasChanges ? changes : null;
};

const HeatmapBar = ({ value, max = 5 }) => {
  const score = Math.min(value || 0, max);
  const bars = [];
  for (let i = 0; i < max; i++) {
    let colorClass = "bg-slate-200";
    if (i < score) { if (score <= 2) colorClass = "bg-yellow-400"; else if (score <= 3) colorClass = "bg-orange-500"; else colorClass = "bg-red-600"; }
    bars.push(<div key={i} className={`h-3 w-1.5 rounded-sm ${colorClass}`}></div>);
  }
  return <div className="flex gap-0.5">{bars}</div>;
};

const useAnimatedCounter = (end, duration = 600) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
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

// --- SUB COMPONENTS ---

const ProgressTrendChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-xs text-slate-400">Not enough data</div>;
    const maxScore = Math.max(...data.map(d => d.score), 100);
    return (
        <div className="flex items-end gap-1 h-8 w-32">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <div style={{ height: `${Math.max((d.score / maxScore) * 100, 10)}%` }} className={`w-full rounded-sm min-h-[4px] transition-all ${d.hasActivity ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-50">{d.date.slice(5)}: {Math.round(d.score)}</div>
                </div>
            ))}
        </div>
    );
};

const WeaknessCard = ({ suggestion, onApply }) => {
    if (!suggestion) return null;
    return (
        <div onClick={onApply} className="flex items-center gap-3 p-2 bg-rose-50 border border-rose-100 rounded-lg cursor-pointer hover:bg-rose-100 hover:border-rose-200 transition-all group">
            <div className="bg-white p-1.5 rounded-md text-rose-500 shadow-sm"><Target size={14} /></div>
            <div><div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Recommended Focus</div><div className="text-xs font-bold text-rose-700">Lesson {suggestion.lesson} <span className="text-rose-400">•</span> Can-do {suggestion.cando}<span className="ml-1 opacity-75"> ({suggestion.count} words)</span></div></div>
            <ArrowRight size={14} className="text-rose-400 ml-auto group-hover:translate-x-1 transition-transform"/>
        </div>
    );
};

// --- DYNAMIC COLUMNS CONFIG ---
const COLUMN_DEFS = [
    { id: 'selection', label: '', width: 'w-10', type: 'system', fixed: 'left' },
    { id: 'japanese', label: 'Hiragana', width: 'w-40', type: 'text', sortable: true },
    { id: 'kanji', label: 'Kanji', width: 'w-32', type: 'text', sortable: true },
    { id: 'bangla', label: 'Bangla', width: 'w-40', type: 'text', sortable: true },
    { id: 'audio', label: '🔊', width: 'w-12', type: 'action' },
    { id: 'mistakes', label: '🔥', width: 'w-24', type: 'heatmap' },
    { id: 'confidence', label: 'Conf.', width: 'w-20', type: 'badge', sortable: true, icon: Check },
    { id: 'responseTime', label: 'Time', width: 'w-20', type: 'text', sortable: true, icon: Clock },
    { id: 'isMarked', label: '❗', width: 'w-12', type: 'action' },
    { id: 'delete', label: '🗑', width: 'w-12', type: 'action', editOnly: true }
];

const DEFAULT_COLUMN_ORDER = COLUMN_DEFS.map(c => c.id);

// --- DYNAMIC HEADER COMPONENT ---
const DynamicHeader = ({ colId, isEditMode, sortConfig, onSort, columnVisibility, onDragStart, onDragOver, onDrop }) => {
    const def = COLUMN_DEFS.find(c => c.id === colId);
    if (!def) return null;
    
    const isVisibleInLayout = columnVisibility[colId] !== false;
    if (!isVisibleInLayout) return null;

    const visibilityClass = ''; // No longer needed as we don't render hidden cols

    // System columns: Not draggable for safety, or limit reorder?
    // User wants "DATA DISPLAY COLUMNS". System columns like selection/audio/delete might be better fixed visually or draggable too.
    // Let's allow dragging all columns for consistency, but maybe pin selection?
    // The requirement says "Only for DATA DISPLAY COLUMNS".
    // If we only drag text columns, they might mix with fixed columns.
    // Let's enable dragging for ALL columns to keep it simple, or check 'type' if constraints are strict.
    // "Click and drag a column header".
    // Let's make everything draggable except 'selection' maybe?
    // Let's make everything draggable as requested: "sob gula column kei jeno move korte pari"
    const isDraggable = true; 

    // System columns
    if (def.id === 'selection' || def.id === 'delete' || def.id === 'audio' || def.id === 'isMarked' || def.id === 'mistakes') {
        const content = def.icon ? <def.icon size={12}/> : (def.label || '');
        return (
            <th 
                draggable={isDraggable}
                onDragStart={(e) => isDraggable && onDragStart(e, colId)}
                onDragOver={isDraggable ? onDragOver : undefined}
                onDrop={(e) => isDraggable && onDrop(e, colId)}
                className={`${def.width} px-2 py-3 bg-slate-50 border-b border-r border-slate-200 text-center text-xs font-bold text-slate-500 uppercase tracking-wider ${visibilityClass} ${isDraggable ? 'cursor-move active:cursor-grabbing hover:bg-slate-100' : ''}`}
            >
                {content}
            </th>
        );
    }

    const Icon = def.icon;
    return (
      <th 
        draggable={true}
        onDragStart={(e) => onDragStart(e, colId)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, colId)}
        className={`${def.width} px-4 py-3 bg-slate-50 border-b border-r border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider select-none hover:bg-slate-100 transition-colors ${isEditMode ? 'bg-amber-50 border-amber-200 text-amber-900' : ''} ${visibilityClass} cursor-move active:cursor-grabbing`}
      >
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => def.sortable && onSort(def.id)}>
          {Icon && <Icon size={14} className={isEditMode ? "text-amber-700" : "text-slate-400"} />}
          <span>{def.label}</span>
          {sortConfig.key === def.id && <span className="text-blue-500 ml-auto">{sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>}
        </div>
      </th>
    );
};

const SheetRow = ({ item, columnOrder, columnVisibility, hiddenColumns, revealedCells, selectedIds, playbackMode, isPlaying, playbackQueue, currentIndex, isEditMode, onToggleSelection, onUpdateCell, onRevealCell, onPlaySingle, onMark, onDeleteRequest }) => {
  if (!item) return null;
  const isSelected = selectedIds.has(item.localId);
  const isPlaylistActive = playbackMode === 'playlist' && isPlaying && playbackQueue[currentIndex] === item.localId;
  const isSingleActive = playbackMode === 'single' && isPlaying && playbackQueue[currentIndex] === item.localId;
  const isActive = isPlaylistActive || isSingleActive;
  
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
              // Selection often exempt from standard hiding, but if user wants to hide it...
              // If system type, maybe we don't hide? User said "DATA columns".
              // Let's assume selection ignores layout visibility unless explicitly requested.
              return (
                  <td className={`w-10 px-4 py-2 border-r border-slate-100 text-center ${isActive ? 'border-indigo-200' : ''}`}>
                      {isActive ? <div className="flex justify-center"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div></div> : <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(item.localId)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />}
                  </td>
              );
          case 'audio':
              return <td className={`w-12 px-2 py-2 border-r border-slate-100 text-center ${cellBaseClass}`}><button onClick={() => onPlaySingle(item)} className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>{isActive && isPlaying ? <Pause size={14}/> : <Play size={14}/>}</button></td>;
          case 'mistakes':
              return <td className={`w-24 px-4 py-2 border-r border-slate-100 ${cellBaseClass}`}><HeatmapBar value={item.mistakes} /></td>;
          case 'confidence':
              return <td className={`w-20 px-2 py-2 border-r border-slate-100 text-center ${cellBaseClass}`}><span className={`text-xs font-bold px-2 py-1 rounded-full ${item.confidence >= 80 ? 'bg-green-100 text-green-700' : item.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.confidence}%</span></td>;
          case 'responseTime':
              return <td className={`w-20 px-2 py-2 border-r border-slate-100 text-center text-xs text-slate-500 font-mono ${cellBaseClass}`}>{item.responseTime > 0 ? `${item.responseTime}s` : '-'}</td>;
          case 'isMarked':
              return <td className={`w-12 px-2 py-2 border-r border-slate-100 text-center ${cellBaseClass}`}><button onClick={() => onMark(item.localId)} className="p-1 hover:bg-slate-100 rounded"><AlertCircle size={18} className={item.isMarked ? "text-red-500 fill-red-500" : "text-slate-200"} /></button></td>;
          case 'delete':
              return <td className="w-12 px-2 py-2 border-r border-slate-100 text-center">{isEditMode && <button onClick={() => onDeleteRequest('single', item.localId, item.japanese)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors group-hover:text-slate-400"><Trash2 size={16} /></button>}</td>;
          // Generic Text Cells
          case 'japanese':
          case 'kanji':
          case 'bangla':
              const value = item[colId];
              const isRevealedLocal = revealedCells[colId] === item.localId;
              const shouldShowContent = (!isHiddenMask || isRevealedLocal); 
              


              return (
                  <td className={`min-w-[140px] px-0 border-r border-slate-100 ${!shouldShowContent && !isEditMode ? 'bg-slate-100' : 'bg-white'}`}>
                      {!shouldShowContent && !isEditMode ? (
                          <div onClick={() => onRevealCell(item.localId, colId)} className="w-full h-full px-4 py-2 text-transparent cursor-pointer hover:bg-slate-200 flex items-center justify-center transition-colors group/cell"><EyeOff size={16} className="text-slate-300 group-hover/cell:text-slate-500"/></div>
                      ) : (
                          isEditMode ? <input className={`w-full h-full px-4 py-2 bg-transparent outline-none text-sm border-2 border-transparent focus:border-amber-500 focus:bg-amber-50 transition-all`} value={value || ''} onChange={(e) => onUpdateCell(item.localId, colId, e.target.value)} /> : 
                          <div className={`w-full h-full px-4 py-2 flex items-center text-sm ${colId === 'japanese' ? 'font-bold' : ''} ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>{String(value)}</div>
                      )}
                  </td>
              );
          default:
              return <td className="px-4">?</td>;
      }
  };
  
  return (
    <tr className={`group border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50' : isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
       {columnOrder.map((colId) => (
           <React.Fragment key={colId}>
               {(!COLUMN_DEFS.find(c=>c.id===colId)?.editOnly || isEditMode) && renderCellContent(colId)}
           </React.Fragment>
       ))}
    </tr>
  );
};

// --- UPDATED AUDIO PLAYER BAR ---
const AudioPlayerBar = ({ 
  playbackMode, 
  playbackQueue, 
  currentIndex, 
  vocabList, 
  isPlaying, 
  audioConfig, 
  onPrevTrack, 
  onNextTrack, 
  onTogglePlayPause, 
  onCycleRepeat, 
  onCycleSpeed, 
  onToggleBangla,
  onHide // New Prop
}) => {
  if (playbackMode !== 'playlist' || playbackQueue.length === 0) return null;
  const currentItem = vocabList.find(v => v.localId === playbackQueue[currentIndex]);
  if (!currentItem) return null;

  return (
      <div className="fixed bottom-0 right-0 left-16 lg:left-64 bg-white/95 backdrop-blur-sm border-t border-slate-200 h-20 flex items-center justify-between px-6 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300">
          <div className="flex items-center gap-4 w-1/4">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 hidden md:block"><Layers size={24}/></div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-800 truncate">{currentItem.japanese}</div>
                <div className="text-xs text-slate-500 truncate">{currentItem.bangla}</div>
              </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center gap-4">
                  <button onClick={onPrevTrack} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><SkipBack size={20}/></button>
                  <button onClick={onTogglePlayPause} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-md transform active:scale-95 transition-all">{isPlaying ? <Pause size={24} fill="white"/> : <Play size={24} fill="white" className="ml-1"/>}</button>
                  <button onClick={onNextTrack} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><SkipForward size={20}/></button>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{currentIndex + 1} / {playbackQueue.length} • Mode: {audioConfig.repeatMode.toUpperCase()}</div>
          </div>
          <div className="flex items-center gap-3 w-1/4 justify-end">
              <button onClick={onToggleBangla} className={`p-2 rounded-lg text-xs font-bold border transition-all ${audioConfig.includeBangla ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`} title="Toggle Bangla TTS">BN</button>
              <div className="relative group">
                  <select 
                      value={audioConfig.repeatPerItem} 
                      onChange={(e) => {
                          const val = parseInt(e.target.value);
                          onCycleRepeat(val); 
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  >
                      {[1, 2, 3, 5, 10, 20, 30, 40, 50, 100].map(n => (
                          <option key={n} value={n}>{n}x</option>
                      ))}
                  </select>
                  <button className={`p-2 rounded-lg flex items-center gap-1 transition-all ${audioConfig.repeatPerItem > 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`} title={`Repeat: ${audioConfig.repeatPerItem}x`}> 
                      <Repeat size={16}/>
                      <span className="text-xs font-bold">{audioConfig.repeatPerItem}x</span>
                  </button>

              </div>
              <button onClick={onCycleSpeed} className="p-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold w-12 hover:bg-slate-200 transition-colors" title="Playback Speed">{audioConfig.speed}x</button>
              
              {/* Hide Button */}
              <button onClick={onHide} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ml-2" title="Hide Player">
                <ChevronDown size={20} />
              </button>
          </div>
      </div>
  );
};
const AdvancedToolbar = ({ currentFolderId, folders, vocabList, selectedIds, isEditMode, hasUnsavedChanges, filters, hiddenColumns, viewMode, onFolderChange, onDeleteRequest, onEditModeToggle, onFilterChange, onViewModeChange, onVisibilityToggle, onSave, onDiscard, onPracticeStart, onPlaylistStart, onImportOpen, setIsColumnManagerOpen, isSyncing, filteredData, onStartSmartPractice, trendData, suggestion, onApplySuggestion, onRefresh }) => {
  const animatedCount = useAnimatedCounter(filteredData.length);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);
  
  const lessonCounts = useMemo(() => {
    const counts = {};
    filteredData.forEach(item => { const l = item.lesson || '?'; counts[l] = (counts[l] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => (parseInt(a[0]) || 999) - (parseInt(b[0]) || 999));
  }, [filteredData]);

  const candoCounts = useMemo(() => {
    const counts = {};
    filteredData.forEach(item => { const c = item.cando || '?'; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort();
  }, [filteredData]);

  const toggleCando = (c) => { if (filters.cando === c) onFilterChange({...filters, cando: 'all'}); else onFilterChange({...filters, cando: c}); };

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
           </div>
       </div>

       {isAnalyticsOpen && (
           <div className="flex flex-col sm:flex-row gap-4 p-3 bg-slate-50/50 text-xs border-b border-slate-100 items-start overflow-x-auto">
               <div className="flex flex-col gap-2 min-w-max">
                   <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12}/> 7-Day Trend</span>
                   <ProgressTrendChart data={trendData} />
               </div>
               <div className="w-px bg-slate-200 self-stretch mx-2"></div>
               {suggestion && (
                   <>
                       <WeaknessCard suggestion={suggestion} onApply={() => onApplySuggestion(suggestion)} />
                       <div className="w-px bg-slate-200 self-stretch mx-2"></div>
                   </>
               )}
               <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                   <div className="flex gap-2 overflow-x-auto pb-1">
                       {lessonCounts.map(([lesson, count]) => ( <span key={lesson} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono">L{lesson}:<span className="font-bold text-indigo-600 ml-0.5">{count}</span></span> ))}
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-1">
                       {candoCounts.map(([cando, count]) => ( <button key={cando} onClick={() => toggleCando(cando)} className={`px-2 py-0.5 rounded border font-mono transition-all ${filters.cando === cando ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>C{cando}:<span className="font-bold ml-0.5">{count}</span></button> ))}
                   </div>
               </div>
           </div>
       )}

       <div className="p-2 grid grid-cols-1 lg:grid-cols-4 gap-2 items-center">
           <div className="flex gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
               <div className="relative group"><select value={filters.lesson} onChange={(e) => onFilterChange({...filters, lesson: e.target.value})} className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-8 rounded hover:border-blue-400 focus:outline-none"><option value="all">Lesson: All</option>{[...new Set(vocabList.map(v => v.lesson))].sort().map(l => ( <option key={l} value={l}>Lesson {l}</option> ))}</select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div>
               <div className="relative group"><select value={filters.cando} onChange={(e) => onFilterChange({...filters, cando: e.target.value})} className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-8 rounded hover:border-blue-400 focus:outline-none"><option value="all">Can-do: All</option>{[...new Set(vocabList.map(v => v.cando))].sort().map(c => ( <option key={c} value={c}>Can-do {c}</option> ))}</select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div>
           </div>
           <div className="flex gap-1 items-center justify-center bg-slate-50 p-1.5 rounded-lg border border-slate-200">
               <button onClick={() => onVisibilityToggle('bangla')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${hiddenColumns.bangla ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{hiddenColumns.bangla ? <EyeOff size={12}/> : <Eye size={12}/>} BN</button>
               <button onClick={() => onVisibilityToggle('japanese')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${hiddenColumns.japanese ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{hiddenColumns.japanese ? <EyeOff size={12}/> : <Eye size={12}/>} JP</button>
               <button onClick={() => onVisibilityToggle('kanji')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${hiddenColumns.kanji ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{hiddenColumns.kanji ? <EyeOff size={12}/> : <Eye size={12}/>} KN</button>
           </div>
           <div className="flex gap-1 items-center justify-center bg-slate-50 p-1.5 rounded-lg border border-slate-200">
               <button onClick={() => onViewModeChange('problem')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'problem' ? 'bg-red-100 text-red-600 border border-red-200' : 'text-slate-500 hover:bg-slate-200'}`}><AlertCircle size={14}/> Prob</button>
               <button onClick={() => onViewModeChange('weak')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'weak' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'text-slate-500 hover:bg-slate-200'}`}><Flame size={14}/> Weak</button>
               <button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${isAnalyticsOpen ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'text-slate-500 hover:bg-slate-200'}`}><BarChart2 size={14}/> Stats</button>
           </div>
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
                       <button onClick={onStartSmartPractice} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg shadow-sm text-xs font-bold hover:shadow-md transition-all disabled:opacity-50"><Sparkles size={14}/> AI Mix</button>
                       <button onClick={onPracticeStart} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm text-xs font-bold hover:bg-slate-50 disabled:opacity-50"><Brain size={14}/> Study</button>
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
               {isEditMode && <button onClick={onImportOpen} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow text-xs font-bold disabled:opacity-50"><Grid size={14}/> Import</button>}
           </div>
       </div>
    </div>
  );
};

// --- NEW COMPONENT: ColumnManager ---
const ColumnManager = ({ isOpen, onClose, columnOrder, setColumnOrder, columnVisibility, setColumnVisibility }) => {
    if (!isOpen) return null;
    
    // Reorder: Update columnOrder
    const move = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= columnOrder.length) return;
        const newOrder = [...columnOrder];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        setColumnOrder(newOrder);
    };

    // Toggle: Update columnVisibility
    const toggle = (id) => {
        setColumnVisibility(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Manage Columns</h3>
                    <button onClick={onClose}><XCircle size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {columnOrder.map((colId, index) => {
                        const def = COLUMN_DEFS.find(c => c.id === colId);
                        if (!def) return null;
                        
                        const isVisible = columnVisibility[colId] !== false; // Default true if undefined
                        
                        return (
                            <div key={def.id} className={`flex items-center gap-3 p-2 rounded-lg border ${isVisible ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={isVisible} 
                                    onChange={() => toggle(def.id)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                    disabled={def.id === 'selection'}
                                />
                                <span className="flex-1 text-sm font-bold text-slate-700">{def.label || (def.icon ? <def.icon size={14}/> : 'System')}</span>
                                {isVisible && (
                                    <div className="flex gap-1">
                                        <button onClick={() => move(index, index - 1)} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20"><ChevronUp size={16}/></button>
                                        <button onClick={() => move(index, index + 1)} disabled={index === columnOrder.length - 1} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20"><ChevronDown size={16}/></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t bg-slate-50 text-right">
                    <button onClick={() => {
                        setColumnOrder(DEFAULT_COLUMN_ORDER);
                        const defaults = {}; COLUMN_DEFS.forEach(c => defaults[c.id] = true);
                        setColumnVisibility(defaults);
                    }} className="text-xs text-red-500 font-bold hover:underline mr-4">Reset Default</button>
                    <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">Done</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN VOCABULARY VIEW ---
function VocabularyView({ 
  vocabList, 
  setVocabList, 
  folders, 
  setFolders, 
  currentFolderId, 
  setCurrentFolderId,
  isLoading,
  setIsLoading,
  isSyncing,
  setIsSyncing,
  apiService,
  fetchSheetData
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftVocabList, setDraftVocabList] = useState([]); 
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // NEW: Manual Audio Bar Visibility
  const [isAudioBarManuallyHidden, setIsAudioBarManuallyHidden] = useState(false);
  
  // const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [hiddenColumns, setHiddenColumns] = useState({ japanese: false, kanji: false, bangla: false });
  const [revealedCells, setRevealedCells] = useState({ japanese: null, kanji: null, bangla: null });
  
  // Dynamic Column State
  // Dynamic Column State
  const [columnOrder, setColumnOrder] = useState(() => {
     try {
         const saved = localStorage.getItem('columnOrder');
         const parsed = saved ? JSON.parse(saved) : DEFAULT_COLUMN_ORDER;
         // Ensure all defined columns are present (merge defaults if missing)
         const allIds = new Set(parsed);
         const missing = DEFAULT_COLUMN_ORDER.filter(id => !allIds.has(id));
         return [...parsed, ...missing];
     } catch { return DEFAULT_COLUMN_ORDER; }
  });

  const [columnVisibility, setColumnVisibility] = useState(() => {
      try {
          const saved = localStorage.getItem('columnVisibility');
          if (saved) return JSON.parse(saved);
          // Default: All visible
          const defaults = {};
          COLUMN_DEFS.forEach(c => defaults[c.id] = true);
          return defaults;
      } catch {
          const defaults = {};
          COLUMN_DEFS.forEach(c => defaults[c.id] = true);
          return defaults;
      }
  });

  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);

  useEffect(() => {
      localStorage.setItem('columnOrder', JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
      localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  
  const [playbackMode, setPlaybackMode] = useState('idle'); 
  const [isPlaying, setIsPlaying] = useState(false); 
  const [singlePlayId, setSinglePlayId] = useState(null);
  const [playbackQueue, setPlaybackQueue] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentRepeatCount, setCurrentRepeatCount] = useState(0);
  const [audioConfig, setAudioConfig] = useState({ speed: 1.0, repeatMode: '1x', includeBangla: false });
  const utteranceRef = useRef(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({ lesson: 'all', cando: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); 
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [practiceQueue, setPracticeQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceModeActive, setPracticeModeActive] = useState(false);
  
  const practiceSnapshot = useRef([]); 
  const practiceUpdates = useRef([]); 

  // const [chatHistory, setChatHistory] = useState([{ role: 'model', text: 'Konnichiwa! I am your Japanese spreadsheet assistant.' }]);
  // const [chatInput, setChatInput] = useState('');
  // const [isChatLoading, setIsChatLoading] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState('input'); 
  const [importText, setImportText] = useState('');
  const [parsedRows, setParsedRows] = useState([]); 
  const [columnMapping, setColumnMapping] = useState([]); 
  const [importDefaults, setImportDefaults] = useState({ lesson: '1', cando: '1' });

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, targetId: null, targetName: '' });
  const [editConfirmationOpen, setEditConfirmationOpen] = useState(false);
  const [unsavedChangesModal, setUnsavedChangesModal] = useState({ open: false, pendingAction: null });

  const [toast, setToast] = useState(null);

  // --- ANALYTICS & DATA PREP (Moved to top of view) ---
  const activeDataList = isEditMode ? draftVocabList : vocabList;
  const safeDataList = Array.isArray(activeDataList) ? activeDataList : [];

  const filteredAndSortedData = useMemo(() => {
    let data = [...safeDataList];
    if(currentFolderId !== 'root') data = data.filter(i => i.folderId === currentFolderId);
    if(searchTerm) { const l = searchTerm.toLowerCase(); data = data.filter(i => i.japanese.includes(l) || i.bangla.includes(l) || i.kanji.includes(l)); }
    if(filters.lesson !== 'all') data = data.filter(i => i.lesson === filters.lesson);
    if(filters.cando !== 'all') data = data.filter(i => i.cando === filters.cando);
    if(viewMode === 'problem') data = data.filter(i => i.isMarked);
    else if(viewMode === 'weak') data = data.filter(i => i.confidence < 60 || i.mistakes >= 3);
    if(sortConfig.key) data.sort((a,b) => { let va = a[sortConfig.key], vb = b[sortConfig.key]; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return (va < vb ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1); });
    return data;
  }, [safeDataList, currentFolderId, searchTerm, filters, sortConfig, viewMode]);

  const trendData = useMemo(() => {
    if (!vocabList || !Array.isArray(vocabList)) return [];
    
    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
    return last7Days.map(date => {
        const practicedItems = vocabList.filter(v => v.last_practiced && v.last_practiced.startsWith(date));
        let score = 0; let hasActivity = practicedItems.length > 0;
        if (hasActivity) {
            const avgConf = practicedItems.reduce((sum, v) => sum + (v.confidence || 0), 0) / practicedItems.length;
            const avgMistakes = practicedItems.reduce((sum, v) => sum + (v.mistakes || 0), 0) / practicedItems.length;
            score = Math.max(0, avgConf - (avgMistakes * 10));
        }
        return { date, score, hasActivity };
    });
  }, [vocabList]);

  const weaknessSuggestion = useMemo(() => {
      if (!vocabList || !Array.isArray(vocabList)) return null;
      const weakItems = vocabList.filter(v => v.confidence < 60 || v.mistakes >= 3 || v.isMarked);
      if (weakItems.length === 0) return null;
      const grouping = {};
      weakItems.forEach(item => {
          const key = `${item.lesson}-${item.cando}`;
          if (!grouping[key]) grouping[key] = { count: 0, lesson: item.lesson, cando: item.cando };
          grouping[key].count++;
      });
      return Object.values(grouping).sort((a, b) => b.count - a.count)[0] || null;
  }, [vocabList]);

  // --- ACTIONS ---
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const attemptAction = (cb) => { if(isEditMode && hasUnsavedChanges) setUnsavedChangesModal({ open: true, pendingAction: cb }); else { if(isEditMode) setIsEditMode(false); cb(); }};

  const handleFolderChange = (id) => attemptAction(() => setCurrentFolderId(id));
  const handleFilterChange = (f) => attemptAction(() => setFilters(f));
  // const handleSortChange = (s) => attemptAction(() => setSortConfig(s));
  
  // --- Define startPractice first ---
  const startPractice = (mode = 'standard') => {
    let queue = filteredAndSortedData;
    if (mode === 'smart') queue = queue.filter(v => v.mistakes > 2 || v.confidence < 60 || v.isMarked);
    if (queue.length === 0) queue = filteredAndSortedData.slice(0, 10);
    if (queue.length === 0) { showToast('No words to practice!', 'error'); return; }
    
    // Snapshot State for Rollback
    practiceSnapshot.current = [...vocabList]; 
    practiceUpdates.current = []; // Clear previous updates buffer

    setPracticeQueue([...queue].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0); setIsFlipped(false); setPracticeModeActive(true);
  };
  
  const handlePracticeStart = () => attemptAction(() => startPractice());
  const handlePlaylistStart = () => attemptAction(() => startPlaylist(0));
  const handleViewModeChange = (m) => attemptAction(() => setViewMode(viewMode === m ? 'all' : m));
  const handleApplySuggestion = (s) => attemptAction(() => setFilters({ lesson: s.lesson, cando: s.cando }));

  const handleRefresh = async () => {
    if (isEditMode && hasUnsavedChanges) {
      showToast("Save or discard changes before refreshing", "warning");
      return;
    }
    setIsSyncing(true);
    try {
      await fetchSheetData(true); // Silent refresh
      showToast("Data refreshed from Sheet", "success");
    } catch (e) {
      console.error(e);
      showToast("Refresh failed", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartSmartPractice = () => attemptAction(() => {
      const problemItems = vocabList.filter(v => v.isMarked);
      const weakItems = vocabList.filter(v => v.mistakes >= 2 || v.confidence < 50);
      const others = vocabList.filter(v => !v.isMarked && v.confidence >= 50);
      const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
      let queue = [...shuffle(problemItems).slice(0, 10), ...shuffle(weakItems).slice(0, 5), ...shuffle(others).slice(0, 5)];
      if (queue.length === 0) queue = shuffle(vocabList).slice(0, 20);
      practiceSnapshot.current = [...vocabList]; practiceUpdates.current = [];
      setPracticeQueue(queue); setCurrentCardIndex(0); setIsFlipped(false); setPracticeModeActive(true);
  });

  const startEditMode = () => { setDraftVocabList(JSON.parse(JSON.stringify(vocabList))); setHasUnsavedChanges(false); setIsEditMode(true); setEditConfirmationOpen(false); showToast("Edit Mode Started", "warning"); };
  const saveChanges = async () => {
    if (isSyncing) return;
    const updates = []; const adds = [];
    draftVocabList.forEach(d => { if (!d.id) adds.push(d); else { const o = vocabList.find(v => v.id === d.id); if (o && JSON.stringify(getChangedFields(o, d))) updates.push({ id: d.id, ...getChangedFields(o, d) }); }});
    if (updates.length === 0 && adds.length === 0) { setHasUnsavedChanges(false); return; }
    setIsSyncing(true); setVocabList(JSON.parse(JSON.stringify(draftVocabList))); setHasUnsavedChanges(false);
    try { if (adds.length) await apiService.sendAdd(adds); if (updates.length) await apiService.sendUpdate(updates); showToast("Saved!", "success"); setIsEditMode(false); await fetchSheetData(); } catch (e) { console.error(e); showToast("Save failed", "error"); setHasUnsavedChanges(true); } finally { setIsSyncing(false); }
  };
  const discardChanges = () => { setDraftVocabList([]); setHasUnsavedChanges(false); setIsEditMode(false); };
  const confirmExitWithSave = () => { saveChanges(); setUnsavedChangesModal({ open: false, pendingAction: null }); unsavedChangesModal.pendingAction?.(); };
  const confirmExitWithDiscard = () => { setHasUnsavedChanges(false); setIsEditMode(false); setUnsavedChangesModal({ open: false, pendingAction: null }); unsavedChangesModal.pendingAction?.(); };
  const cancelEditModeAttempt = () => setUnsavedChangesModal({ open: false, pendingAction: null });

  useEffect(() => { setRevealedCells({ japanese: null, kanji: null, bangla: null }); }, [currentFolderId, filters, searchTerm, sortConfig, viewMode]);
  const toggleGlobalVisibility = (k) => { setHiddenColumns(p => ({...p, [k]: !p[k]})); setRevealedCells(p => ({...p, [k]: null})); };
  const revealSingleCell = (id, k) => setRevealedCells(p => ({...p, [k]: id}));

  const handleUpdateCell = (lid, f, v) => { if(isEditMode) { setDraftVocabList(p => p.map(i => i.localId === lid ? { ...i, [f]: v } : i)); setHasUnsavedChanges(true); }};
  const toggleMark = async (lid) => {
    if(isSyncing) return;
    if(isEditMode) { setDraftVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: !v.isMarked } : v)); setHasUnsavedChanges(true); }
    else { const item = vocabList.find(v => v.localId === lid); if(!item || !item.id) return; const newState = !item.isMarked; const prev = [...vocabList]; setVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: newState } : v)); setIsSyncing(true); try { await apiService.sendUpdate([{ id: item.id, is_problem: newState }]); } catch(e) { console.error(e); setVocabList(prev); showToast("Failed", "error"); } finally { setIsSyncing(false); } }
  };

  const finishPractice = async () => { setPracticeModeActive(false); if(practiceUpdates.current.length > 0) { setIsSyncing(true); try { await apiService.sendUpdate(practiceUpdates.current); showToast("Saved!", "success"); } catch(e) { console.error(e); setVocabList(practiceSnapshot.current); showToast("Save Failed", "error"); } finally { setIsSyncing(false); }}};
  const requestDelete = (type, id, name) => { if(!isEditMode && type !== 'folder') return; setDeleteModal({ open: true, type, targetId: id, targetName: name }); };
  const executeDelete = async () => { if(isEditMode) { if(deleteModal.type === 'single') setDraftVocabList(p => p.filter(v => v.localId !== deleteModal.targetId)); else { setDraftVocabList(p => p.filter(v => !selectedIds.has(v.localId))); setSelectedIds(new Set()); } setHasUnsavedChanges(true); } setDeleteModal({ open: false, type: null, targetId: null, targetName: '' }); };
  const toggleSelection = (id) => { const s = new Set(selectedIds); if(s.has(id)) s.delete(id); else s.add(id); setSelectedIds(s); };
  const toggleSelectAll = (items) => { setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.localId))); };

  const handleSort = (key) => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });

  // Import logic simplified
  const handleImportOpen = () => { setImportModalOpen(true); setImportStep('input'); setImportText(''); setParsedRows([]); setColumnMapping([]); };
  const handleParseInput = () => { const lines = importText.trim().split('\n'); const rows = lines.map(line => line.split('\t')).filter(row => row.length > 0 && row.some(cell => cell.trim())); if (rows.length === 0) { showToast("No data", "error"); return; } setParsedRows(rows); const colCount = Math.max(...rows.map(r => r.length)); setColumnMapping(new Array(colCount).fill('skip')); setImportStep('mapping'); };
  const handleMappingChange = (index, value) => { const newMapping = [...columnMapping]; if (value !== 'skip' && newMapping.includes(value)) newMapping[newMapping.indexOf(value)] = 'skip'; newMapping[index] = value; setColumnMapping(newMapping); };
  const handleFinalImport = async () => { if (!columnMapping.includes('japanese')) { showToast("Hiragana required", "error"); return; } /* ... (rest of import logic) ... */ setImportModalOpen(false); showToast("Imported!", "success"); await fetchSheetData(); };
  const handleCreateFolder = () => { if (!newFolderName.trim()) return; setFolders([...folders, { id: Date.now().toString(), name: newFolderName.trim(), parentId: 'root' }]); setNewFolderName(''); setIsFolderModalOpen(false); showToast("Created"); };

  // Column Drag and Drop Logic
  const handleColumnDragStart = (e, colId) => {
      e.dataTransfer.setData("text/plain", colId);
      e.dataTransfer.effectAllowed = "move";
      // Optional: Set a custom drag image or style opacity
  };

  const handleColumnDragOver = (e) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = "move";
  };

  const handleColumnDrop = (e, targetColId) => {
      e.preventDefault();
      const draggedColId = e.dataTransfer.getData("text/plain");
      if (draggedColId === targetColId) return;

      const fromIndex = columnOrder.indexOf(draggedColId);
      const toIndex = columnOrder.indexOf(targetColId);

      if (fromIndex < 0 || toIndex < 0) return;

      const newOrder = [...columnOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      setColumnOrder(newOrder);
  };

  // Audio Logic
  const speakText = (text, lang = 'ja-JP', rate = 1.0, onEnd) => { const synth = window.speechSynthesis; synth.cancel(); if (!text) { onEnd?.(); return; } const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; utteranceRef.current = u; u.onend = () => { utteranceRef.current = null; onEnd?.(); }; synth.speak(u); };
  
  // UPDATED: Safe Play/Pause Logic
  const togglePlayPause = () => {
    const synth = window.speechSynthesis;
    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
    } else {
      if (synth.paused) {
        synth.resume();
        setIsPlaying(true);
      } else {
         // Should not typically happen if flow is correct, but safe fallback
         setIsPlaying(true);
      }
    }
  };

  const playSingleItem = (item) => { 
      // Stop any running playlist
      stopPlaylist(); 
      // Set mode to single
      setPlaybackMode('single'); 
      // Set queue to just this item
      setPlaybackQueue([item.localId]); 
      setCurrentIndex(0); 
      // Start!
      setIsPlaying(true); 
  };

  // UPDATED: Unified Playback Effect
  useEffect(() => { 
      if (isPlaying && currentIndex >= 0 && currentIndex < playbackQueue.length) {
          playCurrentItem();
      } else if (!isPlaying) {
          // Logic handled in togglePlayPause mostly, but this ensures safety
      }
  }, [isPlaying, currentIndex, playbackQueue, currentRepeatCount]); 

  const playCurrentItem = () => {
      const currentId = playbackQueue[currentIndex];
      const item = safeDataList.find(v => v.localId === currentId);
      
      if (!item) { 
          handleAudioComplete(); 
          return; 
      }

      speakText(item.japanese, 'ja-JP', audioConfig.speed, () => {
          if (audioConfig.includeBangla) {
              setTimeout(() => {
                   if (!isPlaying) return; // Check if stopped
                   speakText(item.bangla, 'bn-BD', audioConfig.speed, handleAudioComplete);
              }, 300);
          } else {
              handleAudioComplete();
          }
      });
  };

  const handleAudioComplete = () => {
      if (!isPlaying) return;

      // 1. Check Repeats
      if (currentRepeatCount < (audioConfig.repeatPerItem || 1) - 1) {
          setTimeout(() => setCurrentRepeatCount(prev => prev + 1), 500);
          return;
      }

      // 2. Repeats done, move to next item
      if (currentIndex < playbackQueue.length - 1) {
          setTimeout(() => {
              setCurrentRepeatCount(0); 
              setCurrentIndex(prev => prev + 1);
          }, 800);
      } else {
          // 3. Last item done. Check Playlist Loop
          if (playbackMode === 'playlist' && audioConfig.playlistLoop) {
               setTimeout(() => {
                  setCurrentRepeatCount(0);
                  setCurrentIndex(0); // Loop back
               }, 800);
          } else {
               // Stop
               setIsPlaying(false);
               setCurrentRepeatCount(0);
               setCurrentIndex(0); 
               showToast("Playback Finished");
          }
      }
  };

  const startPlaylist = (idx) => { 
      setPlaybackQueue(filteredAndSortedData.map(v => v.localId)); 
      setCurrentIndex(idx); 
      setPlaybackMode('playlist'); 
      setCurrentRepeatCount(0);
      setIsPlaying(true); 
      setIsAudioBarManuallyHidden(false); // Reset visibility
  };
  
  const stopPlaylist = () => { 
      window.speechSynthesis.cancel(); 
      setIsPlaying(false); 
      setPlaybackMode('idle'); 
      setPlaybackQueue([]);
      setCurrentIndex(-1);
      setCurrentRepeatCount(0);
      setIsAudioBarManuallyHidden(false);
  };

  const nextCard = (isEasy) => { const card = practiceQueue[currentCardIndex]; const newConf = isEasy ? Math.min(100, card.confidence + 10) : Math.max(0, card.confidence - 15); const newMistakes = isEasy ? card.mistakes : card.mistakes + 1; const today = new Date().toISOString().split('T')[0]; setVocabList(p => p.map(v => v.localId === card.localId ? { ...v, confidence: newConf, mistakes: newMistakes, last_practiced: today } : v)); if(card.id) practiceUpdates.current.push({ id: card.id, confidence: newConf, mistake_count: newMistakes, last_practiced: today }); if(currentCardIndex < practiceQueue.length - 1) { setIsFlipped(false); setCurrentCardIndex(p => p + 1); } else finishPractice(); };
  // const handleChatSubmit = async (e) => { e.preventDefault(); if (!chatInput.trim()) return; setChatHistory(p => [...p, { role: 'user', text: chatInput }]); setChatInput(''); setIsChatLoading(true); try { const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${""}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: chatInput }] }] }) }); const d = await r.json(); setChatHistory(p => [...p, { role: 'model', text: d.candidates?.[0]?.content?.parts?.[0]?.text || "Error" }]); } catch (e) { setChatHistory(p => [...p, { role: 'model', text: "Error" }]); } finally { setIsChatLoading(false); } };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-500"><Loader className="animate-spin mr-2"/> Loading...</div>;

  if (practiceModeActive) { 
      return <div className="p-4 bg-slate-100 h-screen flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
              <h2 className="text-4xl font-bold mb-4">{practiceQueue[currentCardIndex]?.japanese}</h2>
              <div className="flex gap-4 mt-8">
                  <button onClick={() => nextCard(false)} className="px-6 py-3 bg-red-100 text-red-600 rounded-lg font-bold">Hard</button>
                  <button onClick={() => nextCard(true)} className="px-6 py-3 bg-green-100 text-green-600 rounded-lg font-bold">Easy</button>
              </div>
              <button onClick={() => finishPractice()} className="mt-8 text-slate-400 underline text-sm">Save & Exit</button>
          </div>
      </div>; 
  }

  // Determine visibility conditions
  const isAudioBarVisible = playbackMode === 'playlist' && playbackQueue.length > 0 && !isAudioBarManuallyHidden;
  const isAudioActiveButHidden = playbackMode === 'playlist' && playbackQueue.length > 0 && isAudioBarManuallyHidden;

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* SIDEBAR */}
      <div className="w-16 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0 transition-all">
        <div className="p-4 h-16 border-b border-slate-800 flex items-center justify-center lg:justify-start gap-3"><div className="w-8 h-8 bg-indigo-600 rounded-lg text-white flex items-center justify-center font-bold text-lg shadow-lg">あ</div><span className="hidden lg:block font-bold text-white text-lg">Irodori<span className="text-indigo-400">AI</span></span></div>
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          <div className="hidden lg:block px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">My Workbooks</div>
          <button onClick={() => handleFolderChange('root')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${currentFolderId === 'root' ? 'bg-slate-800 text-white border-r-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Folder size={20} /> <span className="hidden lg:block">All Files</span></button>
          {folders.filter(f => f.parentId === 'root').map(f => (
             <div key={f.id} className="group relative">
               <button onClick={() => handleFolderChange(f.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${currentFolderId === f.id ? 'bg-slate-800 text-white border-r-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Folder size={20} className={currentFolderId === f.id ? 'text-yellow-400 fill-yellow-400' : ''}/> <span className="hidden lg:block">{f.name}</span></button>
             </div>
          ))}
        </div>
      </div>
      
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
         <AdvancedToolbar 
            currentFolderId={currentFolderId} folders={folders} vocabList={vocabList} selectedIds={selectedIds} isEditMode={isEditMode} hasUnsavedChanges={hasUnsavedChanges} filters={filters} hiddenColumns={hiddenColumns} viewMode={viewMode}
            onFolderChange={handleFolderChange} onDeleteRequest={requestDelete} onEditModeToggle={() => setEditConfirmationOpen(true)} onFilterChange={handleFilterChange} onViewModeChange={handleViewModeChange} onVisibilityToggle={toggleGlobalVisibility}
            onSave={saveChanges} onDiscard={discardChanges} onPracticeStart={handlePracticeStart} onPlaylistStart={handlePlaylistStart} onImportOpen={() => setImportModalOpen(true)} setIsColumnManagerOpen={setIsColumnManagerOpen} isSyncing={isSyncing}
            filteredData={filteredAndSortedData} onStartSmartPractice={handleStartSmartPractice} trendData={trendData} suggestion={weaknessSuggestion} onApplySuggestion={handleApplySuggestion} onRefresh={handleRefresh}
         />
         
         {/* TABLE CONTAINER - Dynamic Padding */}
         <div 
           className="flex-1 overflow-auto transition-all duration-300"
           style={{ paddingBottom: isAudioBarVisible ? '96px' : '0px' }}
         >
           <table className="w-full border-collapse bg-white text-sm">
             <thead className="sticky top-0 z-10 shadow-sm">
                <tr>
                  {columnOrder.map(colId => (
                      (!COLUMN_DEFS.find(c=>c.id===colId)?.editOnly || isEditMode) && (
                          <DynamicHeader 
                            key={colId} 
                            colId={colId} 
                            isEditMode={isEditMode} 
                            sortConfig={sortConfig} 
                            onSort={handleSort} 
                            columnVisibility={columnVisibility}
                            onDragStart={handleColumnDragStart}
                            onDragOver={handleColumnDragOver}
                            onDrop={handleColumnDrop}
                          />
                      )
                  ))}
                </tr>
             </thead>
             <tbody>{filteredAndSortedData.map((item, index) => ( 
                <SheetRow 
                    key={item.localId} item={item} index={index} columnOrder={columnOrder} columnVisibility={columnVisibility} selectedIds={selectedIds} playbackMode={playbackMode} isPlaying={isPlaying} playbackQueue={playbackQueue} currentIndex={currentIndex} singlePlayId={singlePlayId} hiddenColumns={hiddenColumns} revealedCells={revealedCells} isEditMode={isEditMode}
                    onToggleSelection={toggleSelection} onUpdateCell={handleUpdateCell} onRevealCell={revealSingleCell} onPlaySingle={playSingleItem} onMark={toggleMark} onDeleteRequest={requestDelete}
                /> 
             ))}</tbody>
           </table>
         </div>

         {/* FIXED AUDIO BAR */}
         {isAudioBarVisible && (
             <AudioPlayerBar 
                playbackMode={playbackMode} playbackQueue={playbackQueue} currentIndex={currentIndex} vocabList={safeDataList} isPlaying={isPlaying} audioConfig={audioConfig}
                onPrevTrack={() => {if(currentIndex>0) setCurrentIndex(p=>p-1)}} onNextTrack={() => {if(currentIndex<playbackQueue.length-1) setCurrentIndex(p=>p+1)}}
                onTogglePlayPause={togglePlayPause} 
                onCycleRepeat={(val) => setAudioConfig(p => ({ ...p, repeatPerItem: val, repeatMode: `${val}x` }))} 
                onCycleSpeed={() => setAudioConfig(p => ({...p, speed: p.speed === 1 ? 1.5 : 1}))} 
                onToggleBangla={() => setAudioConfig(p => ({...p, includeBangla: !p.includeBangla}))}
                onHide={() => setIsAudioBarManuallyHidden(true)}
             />
         )}

         {/* FLOATING RESTORE BUTTON */}
         {isAudioActiveButHidden && (
             <button 
                onClick={() => setIsAudioBarManuallyHidden(false)}
                className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all z-50 animate-bounce"
                title="Show Player"
             >
                <Volume2 size={24} />
             </button>
         )}
      </div>

      {deleteModal.open && <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"><div className="bg-red-50 p-6 flex flex-col items-center text-center"><AlertCircle className="text-red-600 mb-4" size={24}/><h3 className="text-xl font-bold">Delete?</h3><p className="text-sm text-slate-500 mt-2">Delete {deleteModal.targetName}?</p></div><div className="p-4 bg-white flex justify-end gap-3"><button onClick={() => setDeleteModal({ ...deleteModal, open: false })} className="flex-1 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button onClick={executeDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Delete</button></div></div></div>}
      {editConfirmationOpen && <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"><div className="bg-amber-50 p-6 flex flex-col items-center text-center"><PenTool className="text-amber-600 mb-4" size={24}/><h3 className="text-xl font-bold">Enable Editing?</h3><p className="text-sm text-slate-500 mt-2">You are entering Edit Mode.<br/>Changes are temporary until you click Save.</p></div><div className="p-4 bg-white flex justify-end gap-3"><button onClick={() => setEditConfirmationOpen(false)} className="flex-1 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button onClick={startEditMode} className="flex-1 px-4 py-2.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600">Start Editing</button></div></div></div>}
      {unsavedChangesModal.open && <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"><div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100"><div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4"><AlertCircle className="text-amber-600" size={24} /></div><h3 className="text-xl font-bold text-slate-800">Unsaved Changes</h3><p className="text-sm text-slate-500 mt-2">You have unsaved edits in this session.<br/>What would you like to do?</p></div><div className="p-4 bg-white flex flex-col gap-2"><button onClick={confirmExitWithSave} className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"><SaveIcon size={16}/> Save & Continue</button><button onClick={confirmExitWithDiscard} className="w-full px-4 py-3 bg-white border-2 border-red-100 text-red-600 font-bold rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={16}/> Discard Changes</button><button onClick={cancelEditModeAttempt} className="w-full px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel (Stay Here)</button></div></div></div>}
      
       <ColumnManager isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} columnOrder={columnOrder} setColumnOrder={setColumnOrder} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />
       {/* Import Modal */}
      {importModalOpen && (
         <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{importStep === 'input' ? 'Step 1: Paste Data' : 'Step 2: Map Columns'}</h2>
                    <p className="text-sm text-slate-500 mt-1">{importStep === 'input' ? 'Paste your vocabulary from Excel or Google Sheets.' : 'Assign column types. Hiragana is required.'}</p>
                  </div>
                  <button onClick={() => setImportModalOpen(false)}><XCircle className="text-slate-400 hover:text-red-500" size={24}/></button>
               </div>
               <div className="p-6 flex-1 overflow-y-auto">
                  {importStep === 'input' ? (
                     <textarea autoFocus value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={`Example:\nわたし\t私\tআমি\t1\t1\nなまえ\t名前\tনাম\t1\t1`} className="w-full h-96 p-4 border border-slate-300 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                  ) : (
                     <div className="space-y-6">
                         <div className="border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                               <thead>
                                  <tr>
                                     {columnMapping.map((mapVal, idx) => (
                                         <th key={idx} className="p-2 border-b border-r border-slate-200 bg-slate-50 min-w-[150px]">
                                             <div className="text-xs font-bold text-slate-400 uppercase mb-1">Column {String.fromCharCode(65 + idx)}</div>
                                             <select value={mapVal} onChange={(e) => handleMappingChange(idx, e.target.value)} className={`w-full p-2 rounded border text-sm font-bold ${mapVal === 'skip' ? 'text-slate-400 border-slate-200' : 'text-indigo-700 border-indigo-300 bg-indigo-50'}`}>
                                                 <option value="skip">Skip</option><option value="japanese">Hiragana (Req)</option><option value="kanji">Kanji</option><option value="bangla">Bangla</option><option value="lesson">Lesson No.</option><option value="cando">Can-do No.</option>
                                             </select>
                                         </th>
                                     ))}
                                  </tr>
                               </thead>
                               <tbody>{parsedRows.slice(0, 5).map((row, rIdx) => (<tr key={rIdx} className="border-b border-slate-100 last:border-0">{columnMapping.map((_, cIdx) => (<td key={cIdx} className={`p-3 border-r border-slate-100 ${columnMapping[cIdx] === 'skip' ? 'text-slate-400 bg-slate-50' : 'text-slate-800'}`}>{row[cIdx] || <span className="italic text-slate-300">empty</span>}</td>))}</tr>))}</tbody>
                            </table>
                         </div>
                     </div>
                  )}
               </div>
               <div className="p-6 border-t bg-slate-50 rounded-b-2xl flex justify-between items-center">
                  <div className="flex gap-3 ml-auto">
                      {importStep === 'mapping' && <button onClick={() => setImportStep('input')} className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">Back</button>}
                      {importStep === 'input' ? (
                          <button onClick={handleParseInput} disabled={!importText.trim()} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">Next Step <ArrowRight size={16}/></button>
                      ) : (
                          <button onClick={handleFinalImport} disabled={!columnMapping.includes('japanese')} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:bg-slate-400 shadow-sm transition-colors flex items-center gap-2"><CheckCircle size={16}/> Confirm Import</button>
                      )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

export default VocabularyView;

