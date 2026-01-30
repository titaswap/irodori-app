import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTableHoverLock } from '../hooks/useTableHoverLock.jsx';


/**
 * TagDropdown - Suggestion dropdown with create option
 * Shows matching tags (objects with tagId and name) and option to create new tag
 * 
 * suggestions: array of {tagId, name, color, ...} objects
 * currentTags: array of tagIds that are already selected
 */
const TagDropdown = ({ suggestions, inputValue, onSelect, onCreate, currentTags = [], position, parentRef, onClose }) => {
    const { lock, unlock } = useTableHoverLock();
    const trimmedInput = inputValue?.trim() || '';
    const [coords, setCoords] = useState(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    // Detect Android WebView environment
    const isAndroidWebView = () => {
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes('android') && ua.includes('wv');
    };

    // Check if there's an exact match by name
    const hasExactMatch = suggestions.some(tag =>
        tag.name && tag.name.toLowerCase() === trimmedInput.toLowerCase()
    );
    const showCreateOption = trimmedInput && !hasExactMatch;

    // Lock table hover when dropdown mounts, unlock when unmounts
    useEffect(() => {
        lock();
        return () => unlock();
    }, [lock, unlock]);

    // Detect keyboard open/close on mobile using visualViewport
    // Skip on Android WebView - keyboard signals are unreliable there
    useEffect(() => {
        if (!window.visualViewport || isAndroidWebView()) return;

        const handleViewportChange = () => {
            // Keyboard is open when visualViewport height is less than window height
            const keyboardOpen = window.visualViewport.height < window.innerHeight;
            setIsKeyboardOpen(keyboardOpen);
        };

        // Initial check
        handleViewportChange();

        window.visualViewport.addEventListener('resize', handleViewportChange);
        return () => window.visualViewport.removeEventListener('resize', handleViewportChange);
    }, []);

    // Calculate position for portal - useLayoutEffect to prevent flicker
    useLayoutEffect(() => {
        if (position && !parentRef) {
            // Fallback if parentRef not provided (though it should be for portal)
            setCoords(position);
            return;
        }

        if (parentRef && parentRef.current) {
            const rect = parentRef.current.getBoundingClientRect();

            // Smart placement: decide whether to open above or below
            const DROPDOWN_HEIGHT = 192; // max-h-48 = 192px
            const GAP = 6; // Vertical spacing between cell and dropdown

            // Use visualViewport height if available (mobile keyboard support)
            const availableHeight = window.visualViewport?.height || window.innerHeight;

            const spaceBelow = availableHeight - rect.bottom;
            const spaceAbove = rect.top;

            let top;
            if (spaceBelow >= DROPDOWN_HEIGHT) {
                // Enough space below - open downward (default)
                top = rect.bottom + window.scrollY + GAP;
            } else if (spaceAbove >= DROPDOWN_HEIGHT) {
                // Not enough space below but enough above - open upward
                top = rect.top + window.scrollY - DROPDOWN_HEIGHT - GAP;
            } else {
                // Not enough space either way - choose side with more space
                if (spaceBelow > spaceAbove) {
                    top = rect.bottom + window.scrollY + GAP;
                } else {
                    top = rect.top + window.scrollY - DROPDOWN_HEIGHT - GAP;
                }
            }

            // Android WebView: Clamp to visible viewport to prevent hiding behind keyboard
            if (isAndroidWebView() && window.visualViewport) {
                const viewport = window.visualViewport;
                const viewportBottom = viewport.offsetTop + viewport.height;
                const dropdownBottom = top - window.scrollY + DROPDOWN_HEIGHT;

                if (dropdownBottom > viewportBottom) {
                    // Dropdown would go below visible viewport - clamp it
                    top = viewportBottom - DROPDOWN_HEIGHT - GAP + window.scrollY;
                }
            }

            setCoords({
                top: top,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [position, parentRef]);

    // Handle scroll and resize - reposition dropdown to follow cell
    useEffect(() => {
        if (!parentRef?.current) return;

        // Find the scrollable parent container
        const findScrollableParent = (element) => {
            let parent = element?.parentElement;
            while (parent) {
                const overflow = window.getComputedStyle(parent).overflow;
                const overflowY = window.getComputedStyle(parent).overflowY;
                if (
                    overflow === 'auto' ||
                    overflow === 'scroll' ||
                    overflowY === 'auto' ||
                    overflowY === 'scroll' ||
                    parent.classList.contains('overflow-auto')
                ) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        };

        // Update dropdown position to follow the cell
        const updatePosition = () => {
            if (!parentRef?.current) return;

            // FREEZE position when keyboard is open (mobile modal state)
            // Prevents focus loss loop: keyboard open → resize → reposition → focus lost
            // Skip this freeze on Android WebView - keyboard signals are unreliable there
            if (isKeyboardOpen && !isAndroidWebView()) return;

            const rect = parentRef.current.getBoundingClientRect();

            // Check if cell is in viewport (with some tolerance)
            const isInViewport = rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth;

            if (!isInViewport) {
                // Cell left viewport - close dropdown
                if (onClose) {
                    onClose();
                }
            } else {
                // Smart placement: decide whether to open above or below
                const DROPDOWN_HEIGHT = 192; // max-h-48 = 192px
                const GAP = 6; // Vertical spacing between cell and dropdown

                // Use visualViewport height if available (mobile keyboard support)
                const availableHeight = window.visualViewport?.height || window.innerHeight;

                const spaceBelow = availableHeight - rect.bottom;
                const spaceAbove = rect.top;

                let top;
                if (spaceBelow >= DROPDOWN_HEIGHT) {
                    // Enough space below - open downward (default)
                    top = rect.bottom + window.scrollY + GAP;
                } else if (spaceAbove >= DROPDOWN_HEIGHT) {
                    // Not enough space below but enough above - open upward
                    top = rect.top + window.scrollY - DROPDOWN_HEIGHT - GAP;
                } else {
                    // Not enough space either way - choose side with more space
                    if (spaceBelow > spaceAbove) {
                        top = rect.bottom + window.scrollY + GAP;
                    } else {
                        top = rect.top + window.scrollY - DROPDOWN_HEIGHT - GAP;
                    }
                }

                // Android WebView: Clamp to visible viewport to prevent hiding behind keyboard
                if (isAndroidWebView() && window.visualViewport) {
                    const viewport = window.visualViewport;
                    const viewportBottom = viewport.offsetTop + viewport.height;
                    const dropdownBottom = top - window.scrollY + DROPDOWN_HEIGHT;

                    if (dropdownBottom > viewportBottom) {
                        // Dropdown would go below visible viewport - clamp it
                        top = viewportBottom - DROPDOWN_HEIGHT - GAP + window.scrollY;
                    }
                }

                // Update position to follow cell
                setCoords({
                    top: top,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };

        const scrollableContainer = findScrollableParent(parentRef.current);

        if (scrollableContainer) {
            scrollableContainer.addEventListener('scroll', updatePosition, { passive: true });
        }

        // Also handle window resize
        window.addEventListener('resize', updatePosition, { passive: true });

        // Android WebView: Add visualViewport geometrychange listener
        // This handles viewport changes when keyboard opens/closes
        if (isAndroidWebView() && window.visualViewport) {
            window.visualViewport.addEventListener('geometrychange', updatePosition);
        }

        return () => {
            if (scrollableContainer) {
                scrollableContainer.removeEventListener('scroll', updatePosition);
            }
            window.removeEventListener('resize', updatePosition);

            if (isAndroidWebView() && window.visualViewport) {
                window.visualViewport.removeEventListener('geometrychange', updatePosition);
            }
        };
    }, [parentRef, onClose, isKeyboardOpen]);

    if ((suggestions.length === 0 && !showCreateOption) || !coords) {
        return null;
    }

    // Full event isolation to prevent row hover/click interference
    const handleMouseEnter = (e) => e.stopPropagation();
    const handleMouseMove = (e) => e.stopPropagation();
    const handleMouseDown = (e) => e.stopPropagation();
    const handleClick = (e) => e.stopPropagation();

    const dropdownContent = (
        <div
            className="absolute z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[200px]"
            style={{
                top: coords.top,
                left: coords.left,
                pointerEvents: 'auto'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {/* Existing tag suggestions */}
            {suggestions.length > 0 && (
                <div className="py-1">
                    {suggestions.map((tag, idx) => {
                        const isSelected = currentTags.includes(tag.tagId);
                        return (
                            <button
                                key={idx}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelect(tag);
                                }}
                                onMouseEnter={handleMouseEnter}
                                onMouseMove={handleMouseMove}
                                onClick={handleClick}
                                className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${isSelected
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/40'
                                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                {isSelected ? (
                                    <span className="inline-block w-4 h-4 text-indigo-600 dark:text-indigo-400">✓</span>
                                ) : (
                                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                                )}
                                {tag.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Create new tag option */}
            {showCreateOption && (
                <>
                    {suggestions.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                    )}
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCreate(trimmedInput);
                        }}
                        onMouseEnter={handleMouseEnter}
                        onMouseMove={handleMouseMove}
                        onClick={handleClick}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors flex items-center gap-2 font-medium"
                    >
                        <span className="text-lg">➕</span>
                        Create tag: "{trimmedInput}"
                    </button>
                </>
            )}
        </div>
    );

    // Use Portal to render into document.body
    return ReactDOM.createPortal(dropdownContent, document.body);
};

export default TagDropdown;
