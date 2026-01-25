
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
  return (
    <th
      draggable={!isFixed}
      onDragStart={(e) => !isFixed && onDragStart(e, colId)}
      onDragOver={!isFixed ? onDragOver : undefined}
      onDrop={(e) => !isFixed && onDrop(e, colId)}
      // style={{ width: columnWidths[colId] || 160 }} // Managed by colgroup now
      data-col-id={colId}
      className={`
          relative sticky top-0 z-30
          px-3 py-2
          bg-slate-50 dark:bg-[#030413]
          border-b border-r border-slate-200 dark:border-white/10
          shadow-sm
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
