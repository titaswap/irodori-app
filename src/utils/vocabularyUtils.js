
import { Check } from 'lucide-react';

// --- CONSTANTS ---
export const INTERNAL_KEYS = new Set([
    'id',
    'localId',
    'book',
    'folderId',

    // System / logic fields
    'isMarked',
    'tags',  // Prevent tags from being rendered as dynamic column (handled by TagCell)
]);

export const FIXED_SYSTEM_COLUMNS = [
    { id: 'isMarked', label: '❗', width: 'w-12', defaultWidth: 80, type: 'action', },
    { id: 'audio', label: '🔊', width: 'w-12', defaultWidth: 80, type: 'action', },
    { id: 'tags', label: 'TAG', width: 'w-32', defaultWidth: 180, type: 'tags', },
];

export const SELECTION_COLUMN = { id: 'selection', label: '#', width: 'w-10', defaultWidth: 48, type: 'system', fixed: 'left' };
// export const DELETE_COLUMN = { id: 'delete', label: '🗑', width: 'w-12', type: 'action', editOnly: true, fixed: 'right' };


// --- HELPERS ---
export const mapToSheet = (item) => {
    const result = {};

    Object.keys(item).forEach(key => {
        if (INTERNAL_KEYS.has(key)) return;
        if (key.startsWith('_')) return;

        result[key] = item[key];
    });

    // System mappings
    result.is_problem = item.isMarked;

    return result;
};


export const mapToApp = (row, index) => {
    // START: Dynamic Mapping - Preserve all source data
    const item = { ...row };

    // Normalize ID and Meta
    const realId = row.id ? String(row.id) : null;
    item.id = realId;
    item.localId = realId || `local_${index}_${Date.now()}`;
    item.book = String(row.book || '1');
    item.folderId = String(row.book || 'Uncategorized');

    // Normalize System/Logic Fields
    item.isMarked = (row.is_problem === true || row.is_problem === "true");



    // Ensure strictly required fields for app logic exist (Search, Audio, Filtering)
    // We prioritize extracting from likely columns if the specific keys don't exist
    // This allows renaming columns in Sheets without breaking existing logic
    if (item.japanese === undefined) {
        // Try 'hiragana', or just first likely string column? 
        // We'll stick to 'hiragana' preference as per original design, or fallback to empty.
        item.japanese = String(row.hiragana || row.japanese || '');
    }
    // Mark if 'japanese' is a synthetic alias so we don't show it twice unless it's real data
    if (!row.japanese) {
        Object.defineProperty(item, '_isSyntheticJapanese', { value: true, enumerable: false });
    }

    if (!item.lesson) item.lesson = String(row.lesson || '1');
    if (!item.cando) item.cando = String(row.cando || '1');
    if (!item.bangla) item.bangla = String(row.bangla || ''); // Fallback for specific UI components if they rely on it

    // Ensure tags is always an array (never convert to single 'tag')
    if (Array.isArray(row.tags)) {
        item.tags = row.tags;
    } else if (typeof row.tag === 'string' && row.tag.trim()) {
        // Migration: convert old single 'tag' to 'tags' array
        item.tags = [row.tag.trim()];
    } else {
        item.tags = [];
    }

    return item;
};

export const getChangedFields = (original, current) => {
    const changes = {}; let hasChanges = false;
    const keys = ['japanese', 'bangla', 'lesson', 'cando', 'isMarked', 'tag']; // Removed stats
    keys.forEach(key => {
        if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
            if (key === 'japanese') changes.hiragana = current[key];
            else if (key === 'isMarked') changes.is_problem = current[key];
            else changes[key] = current[key];
            hasChanges = true;
        }
    });
    return hasChanges ? changes : null;
};
