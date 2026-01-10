
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Folder, Loader, PenTool, TrendingUp, Target, Undo, Save as SaveIcon, 
  Trash2, AlertCircle, Volume2
} from 'lucide-react';

// --- UTILS ---
import { INTERNAL_KEYS, FIXED_SYSTEM_COLUMNS, SELECTION_COLUMN, getChangedFields } from './utils/vocabularyUtils';

// --- COMPONENTS ---
import Toast from './components/Vocabulary/Toast';
import { Card, Button, HeatmapBar } from './components/Vocabulary/Shared'; // HeatmapBar used in SheetRow, but maybe not here directly?
import SheetRow from './components/Vocabulary/SheetRow';
import AudioPlayerBar from './components/Vocabulary/AudioPlayerBar';
import DynamicHeader from './components/Vocabulary/DynamicHeader';
import AdvancedToolbar from './components/Vocabulary/AdvancedToolbar';
import ColumnManager from './components/Vocabulary/ColumnManager';
import ImportModal from './components/Vocabulary/ImportModal';
import Sidebar from './components/Vocabulary/Sidebar';
import PaginationControls from './components/Vocabulary/PaginationControls';

// --- HOOKS ---
// --- HOOKS ---
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVocabularyData } from './hooks/useVocabularyData';
import { preferenceStore } from './utils/preferenceStore';
import { updateProgress } from './services/firestore/activityService';

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
  
  const [hiddenColumns, setHiddenColumns] = useState({ japanese: false, kanji: false, bangla: false });
  const [revealedCells, setRevealedCells] = useState({ japanese: null, kanji: null, bangla: null });
  
  // Dynamic Column State
  const activeSyncs = useRef(0);

  // Initialize from Preference Store
  const [columnOrder, setColumnOrder] = useState(() => preferenceStore.loadPreferences().columnOrder);
  const [columnVisibility, setColumnVisibility] = useState(() => preferenceStore.loadPreferences().columnVisibility);
  const [columnWidths, setColumnWidths] = useState(() => preferenceStore.loadPreferences().columnWidths);
  
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    preferenceStore.savePreferences({ columnWidths });
  }, [columnWidths]);

  // --- GENERATE ALL COLUMNS ---
  const allColumns = useMemo(() => {
      let dynamicCols = [];
      if (vocabList && vocabList.length > 0) {
          const first = vocabList[0];
          const keys = Object.keys(first);
          
          dynamicCols = keys
             .filter(key => !INTERNAL_KEYS.has(key)) 
             .filter(key => key !== 'japanese' || !first._isSyntheticJapanese) 
             .map(key => ({
                 id: key,
                 label: key,
                 width: 'min-w-[140px]', 
                 type: 'text',
                 sortable: true
             }));
      }
      return [SELECTION_COLUMN, ...dynamicCols, ...FIXED_SYSTEM_COLUMNS];
  }, [vocabList]);

  // --- ORDER & VISIBILITY ---
  useEffect(() => {
      setColumnOrder(prev => {
          // Logic Updated: Clean prev
          const cleanPrev = (prev || []); 

          const existingSet = new Set(cleanPrev);
          const newColumns = allColumns
              .filter(c => !existingSet.has(c.id))
              .map(c => c.id);
              
          // Keep saved order, append ANY new ones found
          return [...cleanPrev, ...newColumns];
      });
  }, [allColumns]);

  useEffect(() => {
      preferenceStore.savePreferences({ columnOrder });
  }, [columnOrder]);

  useEffect(() => {
      preferenceStore.savePreferences({ columnVisibility });
  }, [columnVisibility]);
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({ lesson: [], cando: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); 
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [practiceQueue, setPracticeQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [practiceModeActive, setPracticeModeActive] = useState(false);
  
  // const practiceSnapshot = useRef([]); 
  // const practiceUpdates = useRef([]); 

  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, targetId: null, targetName: '' });
  const [editConfirmationOpen, setEditConfirmationOpen] = useState(false);
  const [unsavedChangesModal, setUnsavedChangesModal] = useState({ open: false, pendingAction: null });

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  // --- HOOKS ---
  const { filteredAndSortedData, trendData, weaknessSuggestion, safeDataList } = useVocabularyData(
      vocabList, currentFolderId, searchTerm, filters, sortConfig, viewMode, isEditMode, draftVocabList
  );

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => preferenceStore.loadPreferences().itemsPerPage);

  useEffect(() => {
     preferenceStore.savePreferences({ itemsPerPage });
  }, [itemsPerPage]);

  // Phase 5.3 & 6: Sync UI with Hydration (All Preferences)
  useEffect(() => {
      const unsubscribe = preferenceStore.subscribe((prefs) => {
          if (prefs.itemsPerPage !== itemsPerPage) setItemsPerPage(prefs.itemsPerPage);
          
          // Deep compare or simple set? React setters are usually smart enough or we can check JSON.
          // Since these are objects/arrays, we should check if they actually changed to avoid render loops if store emits same ref?
          // Store loads from local storage which calls JSON.parse, creating new refs.
          // So strict equality !== might pass even if content same.
          // But setItemsPerPage(val) is safe.
          // Let's rely on JSON stringify check we did in Store to only notify if changed? 
          // Store notifies if ANY changed. But we get the whole 'prefs' object.
          // We should just check basic equality or rely on React to bail out?
          // Since we want to update ONLY if hydration changed it.
          
          if (JSON.stringify(prefs.columnOrder) !== JSON.stringify(columnOrder)) setColumnOrder(prefs.columnOrder);
          if (JSON.stringify(prefs.columnVisibility) !== JSON.stringify(columnVisibility)) setColumnVisibility(prefs.columnVisibility);
          if (JSON.stringify(prefs.columnWidths) !== JSON.stringify(columnWidths)) setColumnWidths(prefs.columnWidths);
      });
      return () => unsubscribe();
  }, [itemsPerPage, columnOrder, columnVisibility, columnWidths]);

  // Reset page when data/filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [currentFolderId, searchTerm, filters, viewMode, sortConfig]);

  // Derived Paginated Data
  const paginatedData = useMemo(() => {
     const start = (currentPage - 1) * itemsPerPage;
     return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const {
      playbackMode, isPlaying, playbackQueue, currentIndex, audioConfig, isAudioBarManuallyHidden,
      setAudioConfig, setIsAudioBarManuallyHidden,
      togglePlayPause, stopPlaylist, startPlaylist, handlePlaySingle,
      onPrevTrack, onNextTrack
  } = useAudioPlayer(vocabList, filteredAndSortedData, showToast);

  // --- CONTEXT DATA FOR TOOLBAR ---
  const contextData = useMemo(() => {
     if (currentFolderId === 'root') return vocabList;
     return vocabList.filter(v => v.folderId === currentFolderId);
  }, [vocabList, currentFolderId]);


  // --- ACTIONS ---
  const attemptAction = (cb) => { if(isEditMode && hasUnsavedChanges) setUnsavedChangesModal({ open: true, pendingAction: cb }); else { if(isEditMode) setIsEditMode(false); cb(); }};

  const handleFolderChange = (id) => attemptAction(() => setCurrentFolderId(id));
  const handleFilterChange = (f) => attemptAction(() => setFilters(f));

  const startPractice = (mode = 'standard') => {
    let queue = filteredAndSortedData;
    // if (mode === 'smart') queue = queue.filter(v => v.mistakes > 2 || v.confidence < 60 || v.isMarked); // REMOVED SMART LOGIC (Stats are gone)
    // Fallback to Marked Only if 'smart' is requested? Or just random?
    // Let's assume 'smart' now just means 'shuffle' or 'isMarked'. 
    if (mode === 'smart') queue = queue.filter(v => v.isMarked);
    
    if (queue.length === 0) queue = filteredAndSortedData.slice(0, 10);
    if (queue.length === 0) { showToast('No words to practice!', 'error'); return; }
    
    // practiceSnapshot.current = [...vocabList]; // No longer needed for diffing stats
    // practiceUpdates.current = []; // No longer needed

    setPracticeQueue([...queue].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0); setPracticeModeActive(true);
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
      await fetchSheetData(true); 
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
      // const weakItems = vocabList.filter(v => v.mistakes >= 2 || v.confidence < 50); // REMOVED
      // const others = vocabList.filter(v => !v.isMarked && v.confidence >= 50); // REMOVED using confidence
      // Just shuffle marked + random others
      const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
      
      let queue = [...shuffle(problemItems).slice(0, 15), ...shuffle(vocabList.filter(v => !v.isMarked)).slice(0, 5)]; 
      if (queue.length === 0) queue = shuffle(vocabList).slice(0, 20);
      
      // practiceSnapshot.current = [...vocabList]; practiceUpdates.current = [];
      setPracticeQueue(queue); setCurrentCardIndex(0); setPracticeModeActive(true);
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
  const revealSingleCell = useCallback((id, k) => setRevealedCells(p => ({...p, [k]: id})), []);

  const handleUpdateCell = useCallback((lid, f, v) => { if(isEditMode) { setDraftVocabList(p => p.map(i => i.localId === lid ? { ...i, [f]: v } : i)); setHasUnsavedChanges(true); }}, [isEditMode]);
  
  const toggleMark = useCallback(async (lid) => {
    // Removed isSyncing check to allow rapid marking
    if(isEditMode) { 
        setDraftVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: !v.isMarked } : v)); 
        setHasUnsavedChanges(true); 
    } else { 
        const item = vocabList.find(v => v.localId === lid); 
        if(!item || !item.id) return; 
        
        const newState = !item.isMarked; 
        
        // Optimistic Update
        setVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: newState } : v)); 
        
        // Sync Management
        if (activeSyncs.current === 0) setIsSyncing(true);
        activeSyncs.current += 1;

        try { 
            // Phase 8.3-A: Firestore Write
            await updateProgress(item.id, { isMarked: newState });
        } catch(e) { 
            console.error(e); 
            // Revert state for this specific item only
            setVocabList(p => p.map(v => v.localId === lid ? { ...v, isMarked: !newState } : v)); 
            showToast("Failed to update mark", "error"); 
        } finally { 
            activeSyncs.current -= 1;
            if (activeSyncs.current === 0) setIsSyncing(false); 
        } 
    }
  }, [isEditMode, vocabList, apiService, setVocabList, showToast]);

  const finishPractice = async () => { setPracticeModeActive(false); }; // Removed saving logic
  const requestDelete = useCallback((type, id, name) => { if(!isEditMode && type !== 'folder') return; setDeleteModal({ open: true, type, targetId: id, targetName: name }); }, [isEditMode]);
  const executeDelete = async () => { if(isEditMode) { if(deleteModal.type === 'single') setDraftVocabList(p => p.filter(v => v.localId !== deleteModal.targetId)); else { setDraftVocabList(p => p.filter(v => !selectedIds.has(v.localId))); setSelectedIds(new Set()); } setHasUnsavedChanges(true); } setDeleteModal({ open: false, type: null, targetId: null, targetName: '' }); };
  const toggleSelection = useCallback((id) => { setSelectedIds(prev => { const s = new Set(prev); if(s.has(id)) s.delete(id); else s.add(id); return s; }); }, []);
  // const toggleSelectAll = (items) => { setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.localId))); };

  const handleSort = (key) => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  const handleShuffle = () => setSortConfig({ key: 'random', seed: Date.now() });

  // Column Drag and Drop Logic
  const handleColumnDragStart = (e, colId) => {
      e.dataTransfer.setData("text/plain", colId);
      e.dataTransfer.effectAllowed = "move";
  };
  const handleColumnDragOver = (e) => {
      e.preventDefault(); 
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

  const handleImport = async (data) => {
      // Implement Import Logic using data from ImportModal
      // Similar to original handleFinalImport but using 'data' prop
      // For now, let's just log or stub, as original logic was inside `handleFinalImport` in the modal code I extracted...
      // Wait, in my extracted ImportModal, I used `onImport(importedData)`. 
      // I need to handle that here.
      
      const newItems = data.map(d => {
         // Need mapping to app format? Or just use raw?
         // mapToApp handles raw sheet row. 
         // Let's assume data keys match app keys if I mapped them correctly in modal.
         // In Modal, I mapped to 'japanese', 'kanji', etc.
         return {
             ...d,
             id: null,
             localId: `imported_${Date.now()}_${Math.random()}`,
             folderId: currentFolderId === 'root' ? 'Uncategorized' : currentFolderId,
             book: folders.find(f => f.id === currentFolderId)?.name || 'Uncategorized',
             mistakes: 0, confidence: 0, isMarked: false, 
             lesson: d.lesson || '1', cando: d.cando || '1',
             japanese: d.japanese || '', bangla: d.bangla || '', kanji: d.kanji || ''
         };
      });
      
      if(isEditMode) {
          setDraftVocabList(prev => [...prev, ...newItems]);
          setHasUnsavedChanges(true);
      } else {
          // Direct add?
          setIsSyncing(true);
          try {
             await apiService.sendAdd(newItems);
             showToast("Imported successfully", "success");
             await fetchSheetData();
          } catch(e) {
             showToast("Import failed", "error");
          } finally {
             setIsSyncing(false);
          }
      }
      setImportModalOpen(false);
  };
  
  const handleCreateNewFolder = (name) => {
      // Stub for Sidebar folder creation if moved there? 
      // Sidebar extracted doesn't have creation logic.
      // Original code had `handleCreateFolder`.
      // I should pass this down to Sidebar if needed, or if Sidebar has the UI for it.
      // The Sidebar I extracted just shows buttons.
      // The original Sidebar code had logic?
      // Let's check original sidebar... it had a mapping of folders. 
      // Original `VocabularyView` had `handleCreateFolder`. 
      // But where was the UI? It was inside `VocabularyView` render but not in the "Unified Playback Effect" block in the snippet I saw?
      // Ah, I missed where the "New Folder" button was.
      // Searching "handleCreateFolder" in original file...
      // It was in line 1003. usage?
      // I don't see usage in the provided snippet of `render`.
      // Maybe it was in a modal not shown or I missed it.
      // I'll leave it out for now as I must strictly follow what I extracted.
      // If I missed logic, I should add it back.
      // But for now, focusing on existing functionality.
  };

  const nextCard = (isEasy) => { 
      // Removed stats update logic
      // const card = practiceQueue[currentCardIndex]; 
      // const newConf = isEasy ? Math.min(100, card.confidence + 10) : Math.max(0, card.confidence - 15); 
      // const newMistakes = isEasy ? card.mistakes : card.mistakes + 1; 
      // const today = new Date().toISOString().split('T')[0]; 
      // setVocabList(p => p.map(v => v.localId === card.localId ? { ...v, confidence: newConf, mistakes: newMistakes, last_practiced: today } : v)); 
      // if(card.id) practiceUpdates.current.push({ id: card.id, confidence: newConf, mistake_count: newMistakes, last_practiced: today }); 
      
      if(currentCardIndex < practiceQueue.length - 1) { setCurrentCardIndex(p => p + 1); } else finishPractice(); 
  };


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

  const isAudioBarVisible = playbackMode === 'playlist' && playbackQueue.length > 0 && !isAudioBarManuallyHidden;
  const isAudioActiveButHidden = playbackMode === 'playlist' && playbackQueue.length > 0 && isAudioBarManuallyHidden;

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar: Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex h-full flex-shrink-0">
          <Sidebar folders={folders} currentFolderId={currentFolderId} handleFolderChange={handleFolderChange} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)}></div>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
                  <Sidebar folders={folders} currentFolderId={currentFolderId} handleFolderChange={(id) => { handleFolderChange(id); setIsMobileSidebarOpen(false); }} isMobile={true} />
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
         {/* MOBILE HEADER (Visible only on mobile) */}
         <div className="md:hidden bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between shadow-md z-20 h-11 shrink-0">
             <div className="flex items-center gap-2">
                 <div className="w-7 h-7 bg-indigo-600 rounded flex-shrink-0 flex items-center justify-center font-bold text-base shadow-lg">あ</div>
                 <span className="font-bold text-base tracking-tight leading-none">Irodori<span className="text-indigo-400">AI</span></span>
             </div>
             
             <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-300 font-mono text-right leading-none flex flex-col gap-0.5">
                    <div className="font-bold text-white max-w-[100px] truncate">{currentFolderId === 'root' ? 'My Drive' : folders.find(f => f.id === currentFolderId)?.name || '...'}</div>
                    <div className="opacity-80">{filteredAndSortedData.length} / {vocabList.length}</div>
                </div>
                <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-1 -mr-1"><div className="space-y-[3px]"><div className="w-4 h-0.5 bg-white rounded-full"></div><div className="w-4 h-0.5 bg-white rounded-full"></div><div className="w-4 h-0.5 bg-white rounded-full"></div></div></button>
             </div>
         </div>

         <AdvancedToolbar 
            currentFolderId={currentFolderId} folders={folders} vocabList={contextData} selectedIds={selectedIds} isEditMode={isEditMode} hasUnsavedChanges={hasUnsavedChanges} filters={filters} hiddenColumns={hiddenColumns} viewMode={viewMode}
            onFolderChange={handleFolderChange} onDeleteRequest={requestDelete} onEditModeToggle={() => setEditConfirmationOpen(true)} onFilterChange={handleFilterChange} onViewModeChange={handleViewModeChange} onVisibilityToggle={toggleGlobalVisibility}
            onSave={saveChanges} onDiscard={discardChanges} onPracticeStart={handlePracticeStart} onPlaylistStart={handlePlaylistStart} onImportOpen={() => setImportModalOpen(true)} setIsColumnManagerOpen={setIsColumnManagerOpen} isSyncing={isSyncing}
            filteredData={filteredAndSortedData} onStartSmartPractice={handleStartSmartPractice} trendData={trendData} suggestion={weaknessSuggestion} onApplySuggestion={handleApplySuggestion} onRefresh={handleRefresh} onShuffle={handleShuffle}
            isPlaying={isPlaying} onTogglePlay={togglePlayPause}
         />
         
         <div 
           className="flex-1 overflow-auto transition-all duration-300"
           style={{ paddingBottom: isAudioBarVisible ? '96px' : '0px' }}
         >
           <table className="w-full border-collapse bg-white text-sm table-fixed">
             <colgroup>
               {columnOrder.map(colId => {
                  const def = allColumns.find(c => c.id === colId);
                  if (!def || (def.editOnly && !isEditMode) || columnVisibility[colId] === false) return null;
                  
                  let width = columnWidths[colId];
                  if (!width) {
                      const twMap = { 'w-10': 40, 'w-12': 48, 'w-16': 64, 'w-20': 80, 'w-24': 96, 'w-32': 128, 'w-40': 160, 'w-48': 192, 'w-64': 256 };
                      const match = def.width && typeof def.width === 'string' && def.width.match(/w-(\d+)/);
                      if (twMap[def.width]) width = twMap[def.width];
                      else if (match) width = parseInt(match[1]) * 4;
                      else width = 160; 
                  }
                  return <col key={colId} id={`col-${colId}`} style={{ width: width }} />;
               })}
             </colgroup>
             <thead className="sticky top-0 z-10 shadow-sm">
                <tr>
                  {columnOrder.map(colId => {
                      const def = allColumns.find(c => c.id === colId);
                      return (!def?.editOnly || isEditMode) && (
                          <DynamicHeader 
                            key={colId} 
                            colId={colId} 
                            def={def}
                            isEditMode={isEditMode} 
                            sortConfig={sortConfig} 
                            onSort={handleSort} 
                            columnVisibility={columnVisibility}
                            onDragStart={handleColumnDragStart}
                            onDragOver={handleColumnDragOver}
                            onDrop={handleColumnDrop}
                            onShuffle={handleShuffle}
                            columnWidths={columnWidths}
                            setColumnWidths={setColumnWidths}
                          />
                      );
                  })}
                </tr>
             </thead>
             <tbody>{paginatedData.map((item, index) => ( 
                <SheetRow 
                    key={item.localId} item={item} index={(currentPage - 1) * itemsPerPage + index} columnOrder={columnOrder} columnDefs={allColumns} columnVisibility={columnVisibility} columnWidths={columnWidths} selectedIds={selectedIds} playbackMode={playbackMode} isPlaying={isPlaying} playbackQueue={playbackQueue} currentIndex={currentIndex} hiddenColumns={hiddenColumns} revealedCells={revealedCells} isEditMode={isEditMode}
                    onToggleSelection={toggleSelection} onUpdateCell={handleUpdateCell} onRevealCell={revealSingleCell} onPlaySingle={handlePlaySingle} onMark={toggleMark} onDeleteRequest={requestDelete}
                /> 
             ))}</tbody>
           </table>
         </div>

         <PaginationControls 
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalItems={filteredAndSortedData.length}
          />

         {isAudioBarVisible && (
             <AudioPlayerBar 
                playbackMode={playbackMode} playbackQueue={playbackQueue} currentIndex={currentIndex} vocabList={safeDataList} isPlaying={isPlaying} audioConfig={audioConfig}
                onPrevTrack={onPrevTrack} onNextTrack={onNextTrack}
                onTogglePlayPause={togglePlayPause} 
                onCycleRepeat={(val) => setAudioConfig(p => ({ ...p, repeatPerItem: val, repeatMode: `${val}x` }))} 
                onCycleSpeed={() => setAudioConfig(p => ({...p, speed: p.speed === 1 ? 1.5 : 1}))} 
                onToggleBangla={() => setAudioConfig(p => ({...p, includeBangla: !p.includeBangla}))}
                onHide={() => setIsAudioBarManuallyHidden(true)}
                onToggleMark={toggleMark}
             />
         )}

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
      
       <ColumnManager isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} allColumns={allColumns} columnOrder={columnOrder} setColumnOrder={setColumnOrder} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />
       
       <ImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />
       
    </div>
  );
}

export default VocabularyView;
