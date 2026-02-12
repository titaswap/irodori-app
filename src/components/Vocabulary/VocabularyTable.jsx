import React from 'react';
import SheetRow from './SheetRow';
import DynamicHeader from './DynamicHeader';

function VocabularyTable({
    columnOrder,
    allColumns,
    columnVisibility,
    columnWidths,
    setColumnWidths,
    isEditMode,
    sortConfig,
    handleSort,
    handleShuffle,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    paginatedData,
    currentPage,
    itemsPerPage,
    selectedIds,
    isPlaying,
    hiddenColumns,
    revealedCells,
    handleUpdateCell,
    revealSingleCell,
    handlePlaySingle,
    toggleMark,
    requestDelete,
    allTags,
    searchTags,
    createTag,
    getTagName,
    toggleRowTag,
    currentAudioRowId,
    lastPlayedRowId,
    toggleSelection,
    isTableHoverLocked,
    isAuthenticated,
    searchTerm // NEW
}) {
    return (
        <div className={`mx-2 md:mx-6 mb-6 ${isTableHoverLocked ? 'table-hover-locked' : ''}`}>
            <table className="w-full border-collapse bg-transparent text-sm table-auto bg-white dark:bg-[#080a1c]/60 border border-slate-300 dark:border-white/5 rounded-[1.5rem] shadow-sm">
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
                <thead className="z-10 shadow-sm">
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
                <tbody>
                    {paginatedData.map((item, index) => {
                        // Active if currently playing OR it's the current selected single/playlist item
                        const isActive = item.localId === currentAudioRowId;

                        return (
                            <SheetRow
                                key={item.localId} item={item} index={(currentPage - 1) * itemsPerPage + index} columnOrder={columnOrder} columnDefs={allColumns} columnVisibility={columnVisibility} columnWidths={columnWidths} selectedIds={selectedIds} isPlaying={isPlaying} hiddenColumns={hiddenColumns} revealedCells={revealedCells} isEditMode={isEditMode}
                                onToggleSelection={toggleSelection} onUpdateCell={handleUpdateCell} onRevealCell={revealSingleCell} onPlaySingle={handlePlaySingle} onMark={toggleMark} onDeleteRequest={requestDelete}
                                isActive={isActive}
                                allTags={allTags}
                                searchTags={searchTags}
                                createTag={createTag}
                                getTagName={getTagName}
                                toggleRowTag={toggleRowTag}
                                isAuthenticated={isAuthenticated}
                                searchTerm={searchTerm}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default React.memo(VocabularyTable);
