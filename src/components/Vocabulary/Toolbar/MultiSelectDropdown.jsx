/**
 * Multi-Select Dropdown Component
 * Provides dropdown for filtering by lesson, can-do, and tags
 * With optional tag management features (create, rename, delete)
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Edit2, Trash2, Plus, Check, X } from 'lucide-react';

export const MultiSelectDropdown = ({
    label,
    options,
    selectedValues,
    onChange,
    // Tag management props (only for Tag dropdown)
    enableTagManagement = false,
    onCreateTag,
    onRenameTag,
    onDeleteTag,
    // Row count props (for all dropdowns)
    countMap = {},
    onlyTaggedCount = 0,
    unmarkedCount = 0,
    icon: Icon }) => {
    const safeSelected = Array.isArray(selectedValues) ? selectedValues : [];
    const isAll = safeSelected.length === 0;

    // Special filter mode: "Only Tagged" - shows only rows with at least one tag
    const ONLY_TAGGED_MODE = '__ONLY_TAGGED__';
    const isOnlyTagged = safeSelected.length === 1 && safeSelected[0] === ONLY_TAGGED_MODE;

    const UNMARKED_MODE = 'UNMARKED';
    const isUnmarked = safeSelected.length === 1 && safeSelected[0] === UNMARKED_MODE;

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef(null);

    // Tag management states
    const [editingTag, setEditingTag] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [newTagValue, setNewTagValue] = useState('');
    const [showCreateInput, setShowCreateInput] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target) && (!dropdownRef.current || !dropdownRef.current.contains(event.target))) {
                setIsOpen(false);
                setEditingTag(null);
                setShowCreateInput(false);
            }
        };
        const handleScroll = (e) => {
            if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    // Helper: Get comparable value (tagId for objects, value for strings)
    const getValueKey = (opt) => {
        return typeof opt === 'object' && opt.tagId ? opt.tagId : opt;
    };

    // Helper: Get display name (name for objects, value for strings)
    const getDisplayName = (opt) => {
        return typeof opt === 'object' && opt.name ? opt.name : opt;
    };

    const toggleOption = (val) => {
        const valKey = getValueKey(val);
        let newSelected;
        if (safeSelected.includes(valKey)) {
            newSelected = safeSelected.filter(v => v !== valKey);
        } else {
            newSelected = [...safeSelected, valKey];
        }
        onChange(newSelected);
    };

    const toggleAll = () => {
        onChange([]);
    };

    const toggleOnlyTagged = () => {
        onChange([ONLY_TAGGED_MODE]);
    };

    const toggleUnmarked = () => {
        onChange([UNMARKED_MODE]);
    };

    const handleStartEdit = (optKey, e) => {
        e.stopPropagation();
        setEditingTag(optKey);
        // Find the display name for editing
        const opt = options.find(o => getValueKey(o) === optKey);
        setEditValue(getDisplayName(opt));
    };

    const handleSaveEdit = async (optKey, e) => {
        e.stopPropagation();
        if (!onRenameTag) return;

        const trimmed = editValue.trim();
        if (!trimmed) {
            setEditingTag(null);
            setEditValue('');
            return;
        }

        // Ensure optKey is a string (the tagId)
        const tagId = typeof optKey === 'object' && optKey.tagId ? optKey.tagId : String(optKey);

        console.log("[MultiSelectDropdown] Renaming tag", tagId, "to", trimmed);
        try {
            await onRenameTag(tagId, trimmed);
            setEditingTag(null);
            setEditValue('');
        } catch (err) {
            console.error("[MultiSelectDropdown] Rename failed:", err);
        }
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingTag(null);
        setEditValue('');
    };

    const handleDelete = async (optKey, e) => {
        e.stopPropagation();
        if (!onDeleteTag) return;

        const opt = options.find(o => getValueKey(o) === optKey);
        const displayName = getDisplayName(opt);

        const confirmed = window.confirm(`Delete tag "${displayName}" from all items?\n\nThis will remove the tag from all vocabulary items permanently.`);
        if (confirmed) {
            // Ensure optKey is a string (the tagId)
            const tagId = typeof optKey === 'object' && optKey.tagId ? optKey.tagId : String(optKey);

            console.log("[MultiSelectDropdown] Deleting tag:", tagId);
            try {
                const result = await onDeleteTag(tagId);
                console.log("[MultiSelectDropdown] Delete result:", result);
                if (result === false) {
                    alert(`Failed to delete tag "${displayName}". Please check the console for more details.`);
                    return;
                }
                setEditingTag(null);
                setEditValue('');
            } catch (err) {
                console.error("[MultiSelectDropdown] Delete failed:", err);
                alert(`Error deleting tag "${displayName}": ${err.message}`);
            }
        }
    };

    const handleCreateTag = async (e) => {
        e.stopPropagation();
        if (!onCreateTag) return;

        const trimmed = newTagValue.trim();
        if (!trimmed) {
            console.warn("[MultiSelectDropdown] Empty tag name");
            return;
        }

        console.log("[MultiSelectDropdown] Creating tag:", trimmed);
        try {
            await onCreateTag(trimmed);
            setNewTagValue('');
            setShowCreateInput(false);
        } catch (err) {
            console.error("[MultiSelectDropdown] Create failed:", err);
        }
    };

    // Helper: Get display name for a selected value key
    const getSelectedDisplayName = (valKey) => {
        const option = options.find(o => getValueKey(o) === valKey);
        return option ? getDisplayName(option) : valKey;
    };

    const summary = isAll
        ? "All"
        : isOnlyTagged
            ? "Only Tagged"
            : isUnmarked
                ? "Unmarked Only"
                : safeSelected.length === 1
                    ? getSelectedDisplayName(safeSelected[0])
                    : `${safeSelected.length} selected`;

    return (
        <div className="relative group flex-shrink-0" ref={containerRef}>
            <button
                onClick={(e) => {
                    if (!isOpen) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                    }
                    setIsOpen(!isOpen);
                }}
                title={`${label} Filter`}
                className={`
                    flex items-center justify-center gap-1.5 appearance-none 
                    transition-all duration-200
                    text-[11px] font-semibold 
                    rounded-full
                    focus:outline-none 
                    h-6 md:h-7 min-w-[24px] md:min-w-[80px] px-1 md:px-2 md:justify-between
                    ${!isAll
                        ? 'bg-transparent border border-primary text-primary dark:text-primary hover:bg-primary/10'
                        : 'bg-transparent border border-slate-500 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-700 dark:hover:border-indigo-400/50'
                    }
                    ${isOpen ? 'ring-2 ring-primary/50' : ''}
                `}
            >
                <div className="md:hidden flex items-center justify-center gap-0.5">
                    {Icon ? (
                        <Icon size={14} className="opacity-90" />
                    ) : (
                        <span className="text-[11px] uppercase">{label.charAt(0)}</span>
                    )}
                    <ChevronDown size={10} strokeWidth={3} className={`transition-transform ${isOpen ? 'rotate-180' : ''} opacity-80`} />
                </div>
                <span className="hidden md:block truncate max-w-[100px]">{label}: {summary}</span>
                <ChevronDown size={12} className={`hidden md:block transition-transform ${isOpen ? 'rotate-180' : ''} ${!isAll ? 'text-indigo-200' : 'text-slate-400'}`} />
            </button>
            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
                    className="w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-[9999] max-h-80 overflow-y-auto overflow-x-hidden p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
                >
                    <div
                        onClick={() => { toggleAll(); setIsOpen(false); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-bold ${isAll ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <div className={`w-4 h-4 rounded border !border-solid flex items-center justify-center ${isAll ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                            {isAll && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                        </div>
                        All
                    </div>

                    {/* Only Tagged option - only for Tag dropdown */}
                    {enableTagManagement && (
                        <>
                            <div
                                onClick={() => { toggleOnlyTagged(); setIsOpen(false); }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-bold ${isOnlyTagged ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 rounded border !border-solid flex items-center justify-center ${isOnlyTagged ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                                    {isOnlyTagged && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                                </div>
                                <span className="flex-1">Only Tagged</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isOnlyTagged ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                    {onlyTaggedCount}
                                </span>
                            </div>
                            <div
                                onClick={() => { toggleUnmarked(); setIsOpen(false); }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-bold ${isUnmarked ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 rounded border !border-solid flex items-center justify-center ${isUnmarked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                                    {isUnmarked && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                                </div>
                                <span className="flex-1">Unmarked Only</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isUnmarked ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                    {unmarkedCount}
                                </span>
                            </div>
                        </>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    {options.map(opt => {
                        const optKey = getValueKey(opt);
                        const displayName = getDisplayName(opt);
                        const isSelected = safeSelected.includes(optKey);
                        const isEditing = editingTag === optKey;

                        return (
                            <div
                                key={optKey}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'} ${isEditing ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                            >
                                {!isEditing ? (
                                    <>
                                        <div
                                            onClick={() => toggleOption(opt)}
                                            className="flex items-center gap-2 flex-1 cursor-pointer"
                                        >
                                            <div className={`w-4 h-4 rounded border !border-solid flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                                                {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                            </div>
                                            <span className="truncate flex-1">{displayName}</span>
                                            {/* Row count badge */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isSelected ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                {countMap[optKey] || 0}
                                            </span>
                                        </div>
                                        {enableTagManagement && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={(e) => handleStartEdit(optKey, e)}
                                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                                    title="Rename tag"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(optKey, e)}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                                    title="Delete tag"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(optKey, e);
                                                if (e.key === 'Escape') handleCancelEdit(e);
                                            }}
                                            className="flex-1 px-2 py-1 text-xs border border-indigo-300 dark:border-indigo-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => handleSaveEdit(opt, e)}
                                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded transition-colors"
                                            title="Save"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                                            title="Cancel"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {enableTagManagement && (
                        <>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                            {!showCreateInput ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowCreateInput(true); }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                    <Plus size={14} />
                                    Create New Tag
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={newTagValue}
                                        onChange={(e) => setNewTagValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateTag(e);
                                            if (e.key === 'Escape') { setShowCreateInput(false); setNewTagValue(''); }
                                        }}
                                        placeholder="New tag name..."
                                        className="flex-1 min-w-0 px-2 py-1 text-xs border border-indigo-300 dark:border-indigo-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCreateTag}
                                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded transition-colors"
                                        title="Create"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowCreateInput(false); setNewTagValue(''); }}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                                        title="Cancel"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};
