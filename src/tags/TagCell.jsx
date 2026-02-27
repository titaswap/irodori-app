

import React, { useState, useRef, useEffect } from 'react';
import TagDropdown from './TagDropdown';
import TagBottomSheet from './TagBottomSheet';
import { hasTag } from './tagHelpers';

/**
 * TagCell - Multi-tag cell with add/remove functionality using tag snapshots
 * - Double-click to add tags
 * - Click existing tag to remove it
 * - Supports multiple tags per row
 * 
 * IMPORTANT: item.tags now contains tag snapshots {id, name}
 * allTags is an array of {tagId, name, color, ...} objects from global registry
 */
const TagCell = ({ item, toggleRowTag, allTags, searchTags, createTag, getTagName, isAuthenticated, isActive }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [recentTags, setRecentTags] = useState(() => {
        try {
            const saved = localStorage.getItem('recentTags');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const inputRef = useRef(null);
    const cellRef = useRef(null);

    // Current tags are snapshot objects {id, name}
    const currentTags = Array.isArray(item.tags) ? item.tags : [];

    // Extract tagIds for checking if a tag is already added
    const currentTagIds = currentTags.map(tag => {
        // Handle both old format (string) and new format (object)
        if (typeof tag === 'string') return tag;
        return tag.id;
    });

    // Helper: Get display name for a tag (directly from snapshot)
    const getDisplayName = (tag) => {
        // Handle both old format (string) and new format (object)
        if (typeof tag === 'string') {
            // Old format: try to resolve from allTags
            const globalTag = allTags.find(t => t.tagId === tag);
            return globalTag ? globalTag.name : 'Unknown';
        }
        // New format: use snapshot name directly
        return tag.name || 'Unknown';
    };

    // Handle click outside to close editor
    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e) => {
            if (cellRef.current && !cellRef.current.contains(e.target)) {
                handleCancel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Derived state for suggestions
    // This ensures that when allTags updates (e.g. after creation), 
    // the suggestions update immediately without local state caching.
    const suggestions = React.useMemo(() => {
        let baseList = !inputValue.trim() ? allTags : searchTags(inputValue);

        if (recentTags.length > 0) {
            // Stable sort based on recency
            baseList = [...baseList].sort((a, b) => {
                const idxA = recentTags.indexOf(a.name);
                const idxB = recentTags.indexOf(b.name);

                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        }

        return baseList;
    }, [allTags, inputValue, searchTags, recentTags]);

    // Force re-render verification (as requested)
    /*     console.log(
            "[TagCell render] tags:",
            allTags.map(t => t.name)
        ); */

    // Full event isolation from row handlers
    const handleCellClick = (e) => {
        e.stopPropagation();
    };

    const handleCellDoubleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!isAuthenticated) {
            console.warn('[TagCell] Cannot edit tags - user not authenticated');
            return;
        }

        try {
            const saved = localStorage.getItem('recentTags');
            if (saved) {
                setRecentTags(JSON.parse(saved));
            }
        } catch (e) { }

        setIsEditing(true);
        setInputValue('');
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);

        // Update suggestions based on input (search in tag names)
        // Derived state handles this automatically now
    };

    const updateRecentTags = (tagName) => {
        try {
            const saved = localStorage.getItem('recentTags');
            let recents = saved ? JSON.parse(saved) : [];
            recents = recents.filter(name => name !== tagName);
            recents.unshift(tagName);
            localStorage.setItem('recentTags', JSON.stringify(recents));
            setRecentTags(recents);
        } catch (e) { }
    };

    const handleSelectTag = (tagObj) => {
        console.log('[TagCell] handleSelectTag called with:', tagObj);
        // tagObj should be {tagId, name, ...} from global registry
        if (!tagObj.tagId || !tagObj.name) {
            console.warn('[TagCell] Invalid tag object:', tagObj);
            return;
        }

        console.log('[TagCell] Toggling tag:', tagObj.tagId, tagObj.name, 'for row:', item.localId);
        // Toggle tag by ID and NAME (for snapshot storage)
        toggleRowTag(item.localId, tagObj.tagId, tagObj.name);

        updateRecentTags(tagObj.name);

        // Clear input but keep dropdown open for multi-select
        setInputValue('');
        console.log('[TagCell] Tag toggled successfully');
    };

    const handleCreateTag = async (tagName) => {
        // Create new tag in global registry - returns tagId
        const newTagId = await createTag(tagName);

        if (newTagId) {
            // Add to item using the tagId and tagName
            toggleRowTag(item.localId, newTagId, tagName);

            updateRecentTags(tagName);

            // Clear input but keep dropdown open
            setInputValue('');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && inputValue.trim()) {
            const trimmed = inputValue.trim();
            // Look for exact match by name
            const exactMatch = suggestions.find(
                tag => tag.name.toLowerCase() === trimmed.toLowerCase()
            );

            if (exactMatch) {
                handleSelectTag(exactMatch);
            } else {
                handleCreateTag(trimmed);
            }
        }
    };

    // Handle tag badge click - remove tag
    const handleTagClick = (e, tag) => {
        e.stopPropagation();

        // Extract tagId and tagName from snapshot
        const tagId = typeof tag === 'string' ? tag : tag.id;
        const tagName = typeof tag === 'string' ? (allTags.find(t => t.tagId === tag)?.name || tag) : tag.name;

        toggleRowTag(item.localId, tagId, tagName);
    };

    return (
        <td
            ref={cellRef}
            data-col-id="tags"
            className={`px-2 py-0.5 border-r border-slate-200 dark:border-white/5 ${isActive ? '!bg-[#e5f5f1] dark:!bg-transparent' : 'bg-white/40 dark:bg-white/[0.02]'} relative cursor-pointer`}
            onClick={handleCellClick}
            onDoubleClick={handleCellDoubleClick}
        >
            {isEditing ? (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type to search or create..."
                        className="w-full h-full px-2 py-0.5 bg-transparent outline-none text-sm border-2 border-primary focus:bg-primary/10 transition-all text-slate-900 dark:text-text-main rounded"
                    />
                    {/* Platform-specific UI: Bottom sheet for Android APK, Dropdown for web/desktop */}
                    {(() => {
                        const ua = navigator.userAgent.toLowerCase();
                        const isAndroidAPK = ua.includes('android') && ua.includes('wv');

                        return isAndroidAPK ? (
                            <TagBottomSheet
                                suggestions={suggestions}
                                inputValue={inputValue}
                                onSelect={handleSelectTag}
                                onCreate={handleCreateTag}
                                currentTags={currentTagIds}
                                onClose={handleCancel}
                            />
                        ) : (
                            <TagDropdown
                                suggestions={suggestions}
                                inputValue={inputValue}
                                onSelect={handleSelectTag}
                                onCreate={handleCreateTag}
                                currentTags={currentTagIds}
                                parentRef={cellRef}
                                position={{ top: '100%', left: 0 }}
                                onClose={handleCancel}
                            />
                        );
                    })()}
                </>
            ) : (
                <div className="flex flex-wrap items-center gap-1 min-h-[24px]">
                    {currentTags.length > 0 ? (
                        currentTags.map((tag, idx) => (
                            <span
                                key={idx}
                                onClick={(e) => handleTagClick(e, tag)}
                                className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-800/50 transition-colors"
                                title="Click to remove"
                            >
                                {getDisplayName(tag)}
                            </span>
                        ))
                    ) : (
                        <span className={`text-xs ${isActive ? 'text-slate-500 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-600'}`}>—</span>
                    )}
                </div>
            )}
        </td>
    );
};

export default TagCell;
