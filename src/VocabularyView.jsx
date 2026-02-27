
import { Loader, Volume2 } from 'lucide-react';

// --- UTILS ---
import { uiConfig } from './config/uiConfig';

// --- COMPONENTS ---
import Toast from './components/Vocabulary/Toast';
import { Card, Button, HeatmapBar } from './components/Vocabulary/Shared';
import AudioPlayerBar from './components/Vocabulary/AudioPlayerBar';
import AdvancedToolbar from './components/Vocabulary/AdvancedToolbar';
import ColumnManager from './components/Vocabulary/ColumnManager';
import ImportModal from './components/Vocabulary/ImportModal';
import Sidebar from './components/Vocabulary/Sidebar';
import SearchBar from './components/Vocabulary/SearchBar';
import PaginationControls from './components/Vocabulary/PaginationControls';
import PracticeModeView from './components/Vocabulary/PracticeModeView';
import VocabularyTable from './components/Vocabulary/VocabularyTable';
import VocabularyModals from './components/Vocabulary/VocabularyModals';

// --- CONTROLLER ---
import { useVocabularyController } from './vocabulary/controllers/useVocabularyController';
import { useKanjiColumnVisibility } from './hooks/useKanjiColumnVisibility';
import { handleAudioProblemTag } from './utils/audioProblemTagHandler';

// --- MAIN VOCABULARY VIEW ---
function VocabularyView({
    vocabList,
    setVocabList,
    folders,
    headersBySheet,
    currentFolderId,
    setCurrentFolderId,
    isLoading,
    isSyncing,
    setIsSyncing,
    apiService,
    fetchSheetData,
    user
}) {
    // --- ORCHESTRATION ---
    const ctrl = useVocabularyController({
        vocabList,
        setVocabList,
        folders,
        headersBySheet,
        currentFolderId,
        setCurrentFolderId,
        isLoading,
        isSyncing,
        setIsSyncing,
        apiService,
        fetchSheetData,
        user
    });

    // --- KANJI VISIBILITY ---
    const { isKanjiVisible: kanjiVisible, toggleKanji } = useKanjiColumnVisibility();

    // --- RENDER ---
    if (ctrl.isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-500"><Loader className="animate-spin mr-2" /> Loading...</div>;

    if (ctrl.practiceModeActive) {
        return <PracticeModeView
            practiceQueue={ctrl.practiceQueue}
            currentCardIndex={ctrl.currentCardIndex}
            nextCard={ctrl.nextCard}
            finishPractice={ctrl.finishPractice}
        />;
    }

    return (
        <div className={`h-screen flex overflow-hidden ${ctrl.theme === 'dark' ? 'dark' : ''}`}>
            {ctrl.toast && <Toast message={ctrl.toast.message} type={ctrl.toast.type} onClose={() => ctrl.setToast(null)} />}

            <Sidebar
                folders={ctrl.folders}
                currentFolderId={ctrl.currentFolderId}
                handleFolderChange={ctrl.handleFolderChange}
                isMobile={ctrl.isMobileSidebarOpen}
                user={user}
                onClose={() => ctrl.setIsMobileSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0a0d1f]">


                <AdvancedToolbar
                    currentFolderId={ctrl.currentFolderId}
                    folders={ctrl.folders}
                    vocabList={ctrl.vocabList}
                    headersBySheet={headersBySheet}
                    isEditMode={ctrl.isEditMode}
                    hasUnsavedChanges={ctrl.hasUnsavedChanges}
                    filters={ctrl.filters}
                    hiddenColumns={ctrl.hiddenColumns}
                    viewMode={ctrl.viewMode}
                    onFilterChange={ctrl.handleFilterChange}
                    onViewModeChange={ctrl.handleViewModeChange}
                    onVisibilityToggle={ctrl.toggleGlobalVisibility}
                    onSave={ctrl.saveChanges}
                    onDiscard={ctrl.discardChanges}
                    onPlaylistStart={ctrl.handlePlaylistStart}
                    setIsColumnManagerOpen={ctrl.setIsColumnManagerOpen}
                    isSyncing={ctrl.isSyncing}
                    filteredData={ctrl.displayData}
                    onRefresh={ctrl.handleRefresh}
                    onShuffle={ctrl.handleShuffle}
                    isPlaying={ctrl.isPlaying}
                    onTogglePlay={ctrl.togglePlayPause}
                    showingCount={ctrl.showingCount}
                    totalCount={ctrl.totalCount}
                    setIsMobileSidebarOpen={ctrl.setIsMobileSidebarOpen}
                    createTag={ctrl.createTag}
                    renameTag={ctrl.renameTag}
                    deleteTag={ctrl.deleteTag}
                    allTags={ctrl.allTags}
                    onEdit={() => ctrl.attemptAction(() => { })}
                    onImport={ctrl.openImport}
                    onToggleSidebar={() => ctrl.setIsMobileSidebarOpen(true)}
                    onToggleSettings={() => ctrl.setIsColumnManagerOpen(true)}
                    // NEW: Kanji Visibility Props
                    kanjiVisible={kanjiVisible}
                    onToggleKanji={toggleKanji}
                    searchTerm={ctrl.searchTerm}
                    onSearch={ctrl.setSearchTerm}
                    sortMode={ctrl.sortMode}
                />

                <div
                    className={`flex-1 overflow-auto transition-opacity duration-200 ease-in-out w-full h-full mobile-zoom-table ${ctrl.isTransitioning ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
                    style={{
                        paddingBottom: ctrl.isAudioBarVisible ? '96px' : '0px',
                        '--mobile-zoom': uiConfig.mobileTableZoom,
                        '--desktop-zoom': uiConfig.desktopTableZoom
                    }}
                >
                    <VocabularyTable
                        columnOrder={ctrl.columnOrder}
                        allColumns={ctrl.allColumns}
                        columnVisibility={ctrl.columnVisibility}
                        columnWidths={ctrl.columnWidths}
                        setColumnWidths={ctrl.setColumnWidths}
                        isEditMode={ctrl.isEditMode}
                        sortConfig={ctrl.sortConfig}
                        handleSort={ctrl.handleSort}
                        handleShuffle={ctrl.handleShuffle}
                        handleColumnDragStart={ctrl.handleColumnDragStart}
                        handleColumnDragOver={ctrl.handleColumnDragOver}
                        handleColumnDrop={ctrl.handleColumnDrop}
                        paginatedData={ctrl.paginatedData}
                        currentPage={ctrl.currentPage}
                        itemsPerPage={ctrl.itemsPerPage}
                        selectedIds={ctrl.selectedIds}
                        isPlaying={ctrl.isPlaying}
                        hiddenColumns={{ ...ctrl.hiddenColumns, Kanji: !kanjiVisible }} // MERGE: Kanji visibility
                        revealedCells={ctrl.revealedCells}
                        handleUpdateCell={ctrl.handleUpdateCell}
                        revealSingleCell={ctrl.revealSingleCell}
                        handlePlaySingle={ctrl.handlePlaySingle}
                        toggleMark={ctrl.toggleMark}
                        requestDelete={ctrl.requestDelete}
                        allTags={ctrl.allTags}
                        searchTags={ctrl.searchTags}
                        createTag={ctrl.createTag}
                        getTagName={ctrl.getTagName}
                        toggleRowTag={ctrl.toggleRowTag}
                        currentAudioRowId={ctrl.currentAudioRowId}
                        lastPlayedRowId={ctrl.lastPlayedRowId}
                        toggleSelection={ctrl.toggleSelection}
                        isTableHoverLocked={ctrl.isTableHoverLocked}
                        isAuthenticated={ctrl.isAuthenticated}
                        searchTerm={ctrl.searchTerm}
                    />
                </div>

                <PaginationControls
                    currentPage={ctrl.currentPage}
                    totalPages={ctrl.totalPages}
                    itemsPerPage={ctrl.itemsPerPage}
                    onPageChange={ctrl.setCurrentPage}
                    onItemsPerPageChange={ctrl.setItemsPerPage}
                    displayData={ctrl.displayData}
                />

                {ctrl.isAudioBarVisible && (
                    <AudioPlayerBar
                        playbackMode={ctrl.playbackMode}
                        playbackQueue={ctrl.playbackQueue}
                        currentIndex={ctrl.currentIndex}
                        currentSingleId={ctrl.currentSingleId}
                        vocabList={ctrl.vocabList}
                        isPlaying={ctrl.isPlaying}
                        audioConfig={ctrl.audioConfig}
                        onConfigChange={ctrl.setAudioConfig}
                        onTogglePlayPause={ctrl.togglePlayPause}
                        onPrevTrack={ctrl.onPrevTrack}
                        onNextTrack={ctrl.onNextTrack}
                        // MOVED: Replaced onToggleMark with new tag handler
                        onToggleMark={(item) => handleAudioProblemTag(item, ctrl.allTags, ctrl.createTag, ctrl.toggleRowTag)}
                        onCycleRepeat={(val) => ctrl.setAudioConfig({ ...ctrl.audioConfig, repeatPerItem: val })}
                        onCycleSpeed={() => {
                            const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
                            const idx = speeds.indexOf(ctrl.audioConfig.speed || 1.0);
                            const nextSpeed = speeds[(idx + 1) % speeds.length];
                            ctrl.setAudioConfig({ ...ctrl.audioConfig, speed: nextSpeed });
                        }}
                        onToggleAutoPlay={() => ctrl.setAudioConfig({ ...ctrl.audioConfig, autoPlaySingle: !ctrl.audioConfig.autoPlaySingle })}
                        onClose={() => ctrl.setIsAudioBarManuallyHidden(true)}
                        onHide={() => ctrl.setIsAudioBarManuallyHidden(true)}
                    />
                )}

                {ctrl.isAudioActiveButHidden && (
                    <button
                        type="button"
                        onClick={() => ctrl.setIsAudioBarManuallyHidden(false)}
                        className="fixed bottom-6 right-6 z-[60] bg-[#4F46E5] text-white p-4 rounded-full shadow-2xl hover:bg-[#4338ca] transition-all duration-300 animate-bounce focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer hover:shadow-indigo-500/50 hover:shadow-2xl active:scale-95"
                        title="Show Audio Player"
                    >
                        <Volume2 size={24} />
                    </button>
                )}
            </div>

            <VocabularyModals
                deleteModal={ctrl.deleteModal}
                executeDelete={ctrl.executeDelete}
                setDeleteModal={ctrl.setDeleteModal}
                editConfirmationOpen={ctrl.editConfirmationOpen}
                setEditConfirmationOpen={ctrl.setEditConfirmationOpen}
                startEditMode={ctrl.startEditMode}
                unsavedChangesModal={ctrl.unsavedChangesModal}
                confirmExitWithSave={ctrl.confirmExitWithSave}
                confirmExitWithDiscard={ctrl.confirmExitWithDiscard}
                cancelEditModeAttempt={ctrl.cancelEditModeAttempt}
            />

            <ColumnManager
                isOpen={ctrl.isColumnManagerOpen}
                onClose={() => ctrl.setIsColumnManagerOpen(false)}
                allColumns={ctrl.allColumns}
                columnOrder={ctrl.columnOrder}
                setColumnOrder={ctrl.setColumnOrder}
                columnVisibility={ctrl.columnVisibility}
                setColumnVisibility={ctrl.setColumnVisibility}
                onToggleVisibility={ctrl.toggleGlobalVisibility}
                isDarkMode={ctrl.theme === 'dark'}
                onToggleTheme={ctrl.toggleTheme}
            />

            <ImportModal isOpen={ctrl.importModalOpen} onClose={ctrl.closeImport} onImport={ctrl.handleImport} />

        </div >
    );
}

export default VocabularyView;
