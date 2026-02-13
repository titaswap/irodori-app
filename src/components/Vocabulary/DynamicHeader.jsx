
import React from 'react';
import { getMinWidth, getMaxWidth, isAutoWidth } from '../../config/tableConfig';

const DynamicHeader = ({
  colId,
  def,
  isEditMode,
  sortConfig,
  onSort,
  columnVisibility,
  onDragStart,
  onDragOver,
  onDrop,
  columnWidths,
  setColumnWidths
}) => {
  if (!def) return null;

  // hidden check
  if (columnVisibility[colId] === false) return null;

  const isFixed =
    def.fixed ||
    def.id === 'selection' ||
    def.id === 'delete';

  /* =========================
     RESIZE LOGIC (OPTIMIZED)
  ========================= */
  const handleMouseDown = (e) => {
    // DIRECT FIX: Always allow resize for Bangla and English columns
    const ALWAYS_RESIZABLE = ['bangla', 'english', 'Bangla', 'English'];
    const isAlwaysResizable = ALWAYS_RESIZABLE.includes(colId);

    // STEP 3: Disable resize for autoWidth columns (except always resizable ones)
    if (!isAlwaysResizable && isAutoWidth(colId)) {
      return; // No resizing for content-based columns
    }
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = columnWidths[colId] || 160;

    // Cache Elements
    const colElement = document.getElementById(`col-${colId}`);

    let animationFrameId;

    const onMouseMove = (moveEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(80, startWidth + delta);

        // Update ColGroup Element directly - extremely fast table reflow
        if (colElement) colElement.style.width = `${newWidth}px`;
      });
    };

    const onMouseUp = (upEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Commit final width to React State once
      const delta = upEvent.clientX - startX;
      const finalWidth = Math.max(80, startWidth + delta);

      setColumnWidths(prev => ({
        ...prev,
        [colId]: finalWidth
      }));
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  /* =========================
     HEADER RENDER
  ========================= */
  // Determine if this column uses auto-width
  const useAutoWidth = isAutoWidth(colId);

  // DIRECT FIX: Force specific widths for icon columns (audio, isMarked)
  const getHeaderStyle = () => {
    if (colId === 'audio') {
      return { width: '44px', minWidth: '44px', maxWidth: '44px' };
    }
    if (colId === 'isMarked' || colId === 'ismarked') {
      return { width: '40px', minWidth: '40px', maxWidth: '40px' };
    }
    // DIRECT FIX: Force specific width for Bangla column (bypassing config caching)
    // To change Bangla width, edit these values directly:
    if (colId === 'bangla' || colId === 'Bangla') {
      return { width: '200px', minWidth: '200px', maxWidth: '200px' };
    }
    // DIRECT FIX: Compact width for selection column
    if (colId === 'selection') {
      return { width: '48px', minWidth: '48px', maxWidth: '48px' };
    }

    // DIRECT FIX: Robust Book column logic (bypass config cache + allow resize)
    if (colId === 'book' || colId === 'Book') {
      const manual = columnWidths[colId];
      const width = manual ? Math.max(70, Math.min(150, manual)) : 100;
      return {
        width: `${width}px`,
        minWidth: '70px',
        maxWidth: '150px'
      };
    }

    // DIRECT FIX: Hard-lock English column to 240px
    if (colId === 'english' || colId === 'English') {
      return {
        width: '240px',
        minWidth: '240px',
        maxWidth: '240px'
      };
    }

    // DIRECT FIX: Compact width for metadata columns
    if (['lesson', 'cando'].includes(colId)) {
      return { width: '70px', minWidth: '70px', maxWidth: '70px' };
    }
    if (useAutoWidth) {
      return {};
    }
    return {
      minWidth: `${getMinWidth(colId)}px`,
      maxWidth: `${getMaxWidth(colId)}px`
    };
  };

  return (
    <th
      draggable={!isFixed}
      onDragStart={(e) => !isFixed && onDragStart(e, colId)}
      onDragOver={!isFixed ? onDragOver : undefined}
      onDrop={(e) => !isFixed && onDrop(e, colId)}
      style={getHeaderStyle()}
      data-col-id={colId}
      className={`
          relative sticky top-0 z-30
          px-3 py-2
          bg-slate-50 dark:bg-[#030413]
          border-b border-r border-slate-200 dark:border-white/10
          shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
          text-[11px] font-bold uppercase tracking-[0.15em]
          select-none
          text-slate-600 dark:text-slate-400
          ${!isFixed ? 'cursor-move hover:bg-indigo-50/50 dark:hover:bg-white/10 transition-colors' : 'text-center'}
          ${isEditMode ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500' : ''}
        `}
    >
      <div
        className="flex items-center gap-1"
        onClick={() => def.sortable && onSort(def.id)}
      >
        {def.icon && <def.icon size={14} />}
        <span>{def.label}</span>

        {sortConfig.key === def.id && (
          <span className="ml-auto">
            {sortConfig.direction === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* =========================
          RESIZE HANDLE
         ========================= */}
      {!isFixed && !isAutoWidth(colId) && (
        <div
          onMouseDown={handleMouseDown}
          className="
            absolute top-0 right-0
            h-full w-1
            cursor-col-resize
            hover:bg-indigo-400
          "
        />
      )}
    </th>
  );
};

export default DynamicHeader;
