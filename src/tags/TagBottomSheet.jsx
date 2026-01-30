import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTableHoverLock } from '../hooks/useTableHoverLock.jsx';
import TagSearchModal from './TagSearchModal.jsx';

/**
 * TagBottomSheet - Mobile-optimized bottom sheet for tag selection (Android APK)
 * Phase 6.4: Two-step interaction model
 * 
 * STEP 1 (This Component):
 * - NO real input element (fake input button only)
 * - Shows all tags (no filtering)
 * - Tag selection works perfectly (no keyboard interference)
 * - Tapping fake input opens TagSearchModal (Step 2)
 * 
 * STEP 2 (TagSearchModal):
 * - Real input in separate layer
 * - Keyboard opens safely
 * - Filtered tag list
 * 
 * This solves Android WebView limitation where real input + scrollable list + keyboard
 * cannot coexist in the same layer without tap event conflicts.
 */
const TagBottomSheet = ({ suggestions, inputValue: initialValue, onSelect, onCreate, currentTags = [], onClose }) => {
    const { lock, unlock } = useTableHoverLock();
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Lock table hover when bottom sheet mounts
    useEffect(() => {
        lock();
        return () => unlock();
    }, [lock, unlock]);

    // Handle tag selection - NO AUTO-CLOSE for multi-select
    const handleSelect = (tag) => {
        // Explicitly blur active element to prevent WebView auto-restore
        document.activeElement?.blur();

        console.log('[TagBottomSheet] Tag selected:', tag);
        onSelect(tag);
        // DO NOT close - allow multi-selection
        // Bottom sheet closes only via Done button, Close (X), or Android back
    };

    // Handle tag creation - NO AUTO-CLOSE for multi-select
    const handleCreate = (tagName) => {
        // Explicitly blur active element
        document.activeElement?.blur();

        console.log('[TagBottomSheet] Creating tag:', tagName);
        onCreate(tagName);
        // DO NOT close - allow adding more tags
    };

    // Open search modal when fake input is tapped
    const handleSearchClick = () => {
        setShowSearchModal(true);
    };

    return ReactDOM.createPortal(
        <>
            {/* Bottom Sheet (Step 1) */}
            <div className="fixed inset-0 z-50 flex items-end animate-fadeIn">
                {/* Backdrop - NO onClick handler */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Bottom Sheet */}
                <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-slideUp">
                    {/* Header with Fake Input */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Tags</h3>
                            <button
                                onClick={onClose}
                                className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* FAKE INPUT - Button styled as input */}
                        <button
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[TagBottomSheet] Fake input tapped, opening search modal');
                                handleSearchClick();
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                            style={{ touchAction: 'manipulation' }}
                        >
                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Tap to search or create tag...</span>
                        </button>
                    </div>

                    {/* All Tags List (No Filtering) */}
                    <div className="flex-1 overflow-y-auto">
                        {suggestions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No tags available
                            </div>
                        ) : (
                            <div className="p-2">
                                {/* All Tags */}
                                {suggestions.map((tag) => {
                                    const isSelected = currentTags.includes(tag.tagId);

                                    // Tap detection - track touch movement to distinguish tap from swipe
                                    let touchStartX = 0;
                                    let touchStartY = 0;

                                    const handleTouchStart = (e) => {
                                        const touch = e.touches[0];
                                        touchStartX = touch.clientX;
                                        touchStartY = touch.clientY;
                                        console.log('[TagBottomSheet] Touch start:', touchStartX, touchStartY);
                                    };

                                    const handleTouchEnd = (e) => {
                                        const touch = e.changedTouches[0];
                                        const touchEndX = touch.clientX;
                                        const touchEndY = touch.clientY;

                                        // Calculate movement distance
                                        const deltaX = Math.abs(touchEndX - touchStartX);
                                        const deltaY = Math.abs(touchEndY - touchStartY);
                                        const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                                        console.log('[TagBottomSheet] Touch end - movement:', movement);

                                        // Only select if movement < 8px (tap, not swipe)
                                        if (movement < 8) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('[TagBottomSheet] Tap detected, selecting tag:', tag);
                                            handleSelect(tag);
                                        } else {
                                            console.log('[TagBottomSheet] Swipe detected, ignoring selection');
                                        }
                                    };

                                    return (
                                        <button
                                            key={tag.tagId}
                                            onTouchStart={handleTouchStart}
                                            onTouchEnd={handleTouchEnd}
                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                                }`}
                                            style={{ touchAction: 'manipulation' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                                    style={{ backgroundColor: tag.color || '#6B7280' }}
                                                >
                                                    {tag.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{tag.name}</div>
                                                </div>
                                                {isSelected && (
                                                    <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Modal (Step 2) - Rendered above bottom sheet */}
            {showSearchModal && (
                <TagSearchModal
                    suggestions={suggestions}
                    currentTags={currentTags}
                    onSelect={handleSelect}
                    onCreate={handleCreate}
                    onClose={() => setShowSearchModal(false)}
                />
            )}
        </>,
        document.body
    );
};

export default TagBottomSheet;
