import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * TagSearchModal - Separate search layer for Android APK (Phase 6.4 Step 2)
 * Contains REAL input element in isolated layer
 * Keyboard opens safely here without interfering with tag list
 * 
 * This modal sits ABOVE the bottom sheet (z-60 vs z-50)
 * Allows keyboard + input + list to coexist without WebView tap conflicts
 */
const TagSearchModal = ({ suggestions, currentTags = [], onSelect, onCreate, onClose }) => {
    const [inputValue, setInputValue] = useState('');
    const [keyboardLocked, setKeyboardLocked] = useState(false);
    const inputRef = useRef(null);
    const trimmedInput = inputValue?.trim() || '';

    // Filter suggestions based on input
    const filtered = suggestions.filter(tag =>
        tag.name && tag.name.toLowerCase().includes(trimmedInput.toLowerCase())
    );

    // Check if there's an exact match
    const hasExactMatch = filtered.some(tag =>
        tag.name && tag.name.toLowerCase() === trimmedInput.toLowerCase()
    );
    const showCreateOption = trimmedInput && !hasExactMatch;

    // Auto-focus is SAFE here (separate layer from tag list)
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSelect = (tag) => {
        // Explicitly blur active element to prevent WebView auto-restore
        document.activeElement?.blur();

        // Lock keyboard to prevent auto-reopen
        setKeyboardLocked(true);

        onSelect(tag);
        // DO NOT close - allow multi-selection

        console.log('[TagSearchModal] Tag selected, keyboard locked');
    };

    const handleCreate = () => {
        if (trimmedInput) {
            // Explicitly blur active element
            document.activeElement?.blur();

            // Lock keyboard
            setKeyboardLocked(true);

            onCreate(trimmedInput);
            // DO NOT close - allow adding more tags

            console.log('[TagSearchModal] Tag created, keyboard locked');
        }
    };

    // Handle input focus - prevent auto-reopen if keyboard is locked
    const handleInputFocus = (e) => {
        if (keyboardLocked) {
            console.log('[TagSearchModal] Focus blocked - keyboard locked');
            e.target.blur();
        } else {
            console.log('[TagSearchModal] Input focused');
        }
    };

    // Handle input click - unlock keyboard and allow focus
    const handleInputClick = () => {
        console.log('[TagSearchModal] Input clicked - unlocking keyboard');
        setKeyboardLocked(false);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col animate-fadeIn">
            {/* Header with Real Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        aria-label="Back"
                    >
                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Search Tags</h3>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleInputFocus}
                    onClick={handleInputClick}
                    placeholder="Type to search or create tag..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
            </div>

            {/* Filtered Tag List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 && !showCreateOption ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {trimmedInput ? 'No tags found' : 'Start typing to search...'}
                    </div>
                ) : (
                    <div className="p-2">
                        {/* Create New Tag Option */}
                        {showCreateOption && (
                            <button
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCreate();
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-800"
                                style={{ touchAction: 'manipulation' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">Create "{trimmedInput}"</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Add as new tag</div>
                                    </div>
                                </div>
                            </button>
                        )}

                        {/* Filtered Tags */}
                        {filtered.map((tag) => {
                            const isSelected = currentTags.includes(tag.tagId);

                            // Tap detection - track touch movement to distinguish tap from swipe
                            let touchStartX = 0;
                            let touchStartY = 0;

                            const handleTouchStart = (e) => {
                                const touch = e.touches[0];
                                touchStartX = touch.clientX;
                                touchStartY = touch.clientY;
                            };

                            const handleTouchEnd = (e) => {
                                const touch = e.changedTouches[0];
                                const touchEndX = touch.clientX;
                                const touchEndY = touch.clientY;

                                // Calculate movement distance
                                const deltaX = Math.abs(touchEndX - touchStartX);
                                const deltaY = Math.abs(touchEndY - touchStartY);
                                const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                                // Only select if movement < 8px (tap, not swipe)
                                if (movement < 8) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('[TagSearchModal] Tap detected, selecting tag:', tag);
                                    handleSelect(tag);
                                } else {
                                    console.log('[TagSearchModal] Swipe detected, ignoring selection');
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
        </div>,
        document.body
    );
};

export default TagSearchModal;
