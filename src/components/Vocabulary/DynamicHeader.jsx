
import React from 'react';

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
          if(colElement) colElement.style.width = `${newWidth}px`;
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
  return (
    <th
      draggable={!isFixed}
      onDragStart={(e) => !isFixed && onDragStart(e, colId)}
      onDragOver={!isFixed ? onDragOver : undefined}
      onDrop={(e) => !isFixed && onDrop(e, colId)}
      // style={{ width: columnWidths[colId] || 160 }} // Managed by colgroup now
      data-col-id={colId}
      className={`
        relative
        px-3 py-3
        bg-slate-50
        border-b border-r border-slate-200
        text-xs font-bold uppercase tracking-wider
        select-none
        ${!isFixed ? 'cursor-move hover:bg-slate-100' : 'text-center'}
        ${isEditMode ? 'bg-amber-50 border-amber-200' : ''}
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
      {!isFixed && (
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
