
import React from 'react';
import { 
  Play, Pause, AlertCircle, Trash2, EyeOff
} from 'lucide-react';
import { HeatmapBar } from './Shared';

const SheetRow = React.memo(({ item, columnOrder, columnDefs, columnVisibility, columnWidths, hiddenColumns, revealedCells, selectedIds, playbackMode, isPlaying, playbackQueue, currentIndex, index, isEditMode, onToggleSelection, onUpdateCell, onRevealCell, onPlaySingle, onMark, onDeleteRequest }) => {
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
          case 'lastPracticed':
  return (
    <td data-col-id={colId} className="w-24 px-2 py-2 border-r border-slate-100 text-center text-xs text-slate-500">
      {item.lastPracticed || '-'}
    </td>
  );

          case 'selection':
              return (
                  <td data-col-id={colId} className={`w-10 px-2 py-2 border-r border-slate-100 text-center font-medium text-slate-400 text-xs`}>
                      {index + 1}
                  </td>
              );
          case 'audio':
              return <td data-col-id={colId} className={`w-12 px-2 py-2 border-r border-slate-100 text-center ${cellBaseClass}`}><button onClick={() => onPlaySingle(item)} className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>{isActive && isPlaying ? <Pause size={14}/> : <Play size={14}/>}</button></td>;
          case 'mistakes':
              return <td data-col-id={colId} className={`w-24 px-4 py-2 border-r border-slate-100 ${cellBaseClass}`}><HeatmapBar value={item.mistakes} /></td>;
          case 'confidence':
              return <td data-col-id={colId} className={`w-20 px-2 py-2 border-r border-slate-100 text-center ${cellBaseClass}`}><span className={`text-xs font-bold px-2 py-1 rounded-full ${item.confidence >= 80 ? 'bg-green-100 text-green-700' : item.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.confidence}%</span></td>;
          case 'responseTime':
              return <td data-col-id={colId} className={`w-20 px-2 py-2 border-r border-slate-100 text-center text-xs text-slate-500 font-mono ${cellBaseClass}`}>{item.responseTime > 0 ? `${item.responseTime}s` : '-'}</td>;
          case 'isMarked':
              return <td data-col-id={colId} className={`w-12 px-2 py-2 border-r border-slate-100 text-center ${cellBaseClass}`}><button onClick={() => onMark(item.localId)} className="p-1 hover:bg-slate-100 rounded"><AlertCircle size={18} className={item.isMarked ? "text-red-500 fill-red-500" : "text-slate-200"} /></button></td>;
          case 'delete':
              return <td data-col-id={colId} className="w-12 px-2 py-2 border-r border-slate-100 text-center">{isEditMode && <button onClick={() => onDeleteRequest('single', item.localId, item.japanese)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors group-hover:text-slate-400"><Trash2 size={16} /></button>}</td>;
          // Generic Text Cells (Dynamic)
          default:
              const value = item[colId];
              // Support array values if any (e.g. multi-select) - cast to string
              const displayValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value || '');
              
              const isRevealedLocal = revealedCells[colId] === item.localId;
              const shouldShowContent = (!isHiddenMask || isRevealedLocal);
              
              const isPrimary = colId === 'japanese' || colId === 'hiragana' || colId === 'Hiragana'; // Simple heuristic for bolding

              return (
                  <td data-col-id={colId} className={`px-0 border-r border-slate-100 ${!shouldShowContent && !isEditMode ? 'bg-slate-100' : 'bg-white'}`}>
                      {!shouldShowContent && !isEditMode ? (
                          <div onClick={() => onRevealCell(item.localId, colId)} className="w-full h-full px-4 py-2 text-transparent cursor-pointer hover:bg-slate-200 flex items-center justify-center transition-colors group/cell"><EyeOff size={16} className="text-slate-300 group-hover/cell:text-slate-500"/></div>
                      ) : (
                          isEditMode ? <input className={`w-full h-full px-4 py-2 bg-transparent outline-none text-sm border-2 border-transparent focus:border-amber-500 focus:bg-amber-50 transition-all`} value={displayValue} onChange={(e) => onUpdateCell(item.localId, colId, e.target.value)} /> : 
                          <div className={`w-full h-full px-4 py-2 flex items-center text-sm ${isPrimary ? 'font-bold' : ''} ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>{displayValue}</div>
                      )}
                  </td>
              );
      }
  };
  
  return (
    <tr className={`group border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50' : isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
        {columnOrder.map((colId) => (
            <React.Fragment key={colId}>
                {(!columnDefs.find(c=>c.id===colId)?.editOnly || isEditMode) && renderCellContent(colId)}
            </React.Fragment>
        ))}
    </tr>
  );
});

export default SheetRow;
