
import React, { useState, useRef, useEffect } from 'react';
import TagDropdown from './TagDropdown';
import { hasTag } from './tagHelpers';

/**
 * TagCell - Multi-tag cell with add/remove functionality using tagIds
 * - Double-click to add tags
 * - Click existing tag to remove it
 * - Supports multiple tags per row
 * 
 * IMPORTANT: item.tags now contains tagIds (not tag names)
 * allTags is an array of {tagId, name, color, ...} objects
 */
const TagCell = ({ item, toggleRowTag, allTags, searchTags, createTag, getTagName, isAuthenticated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const inputRef = useRef(null);
    const cellRef = useRef(null);

    // Current tagIds array
    const currentTagIds = Array.isArray(item.tags) ? item.tags : [];

    // Helper: Get display name for a tagId
    const getDisplayName = (tagId) => {
        const tag = allTags.find(t => t.tagId === tagId);
        return tag ? tag.name : 'Unknown';
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

        setIsEditing(true);
        setInputValue('');
        setSuggestions(allTags);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);

        // Update suggestions based on input (search in tag names)
        if (value.trim()) {
            const filtered = searchTags(value);
            setSuggestions(filtered);
        } else {
            setSuggestions(allTags);
        }
    };

    const handleSelectTag = (tagObj) => {
        // tagObj should be {tagId, name, ...}
        if (!tagObj.tagId) {
            console.warn('[TagCell] Invalid tag object:', tagObj);
            return;
        }

        // Toggle tag by ID
        toggleRowTag(item.localId, tagObj.tagId);

        // Clear input but keep dropdown open for multi-select
        setInputValue('');
        setSuggestions(allTags);
    };

    const handleCreateTag = async (tagName) => {
        // Create new tag in store - returns tagId
        const newTagId = await createTag(tagName);

        if (newTagId) {
            // Add to item using the tagId
            toggleRowTag(item.localId, newTagId);

            // Clear input but keep dropdown open
            setInputValue('');
            setSuggestions(allTags);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setInputValue('');
        setSuggestions([]);
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
    const handleTagClick = (e, tagId) => {
        e.stopPropagation();
        toggleRowTag(item.localId, tagId);
    };

    return (
        <td
            ref={cellRef}
            data-col-id="tags"
            className="px-2 py-0.5 border-r border-slate-200 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] relative cursor-pointer"
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
                    <TagDropdown
                        suggestions={suggestions}
                        inputValue={inputValue}
                        onSelect={handleSelectTag}
                        onCreate={handleCreateTag}
                        currentTags={currentTagIds}
                        position={{ top: '100%', left: 0 }}
                    />
                </>
            ) : (
                <div className="flex flex-wrap items-center gap-1 min-h-[24px]">
                    {currentTagIds.length > 0 ? (
                        currentTagIds.map((tagId, idx) => (
                            <span
                                key={idx}
                                onClick={(e) => handleTagClick(e, tagId)}
                                className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-800/50 transition-colors"
                                title="Click to remove"
                            >
                                {getDisplayName(tagId)}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                    )}
                </div>
            )}
        </td>
    );
};

export default TagCell;
