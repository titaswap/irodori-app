
import React from 'react';
import { XCircle, ChevronUp, ChevronDown, Moon, Sun } from 'lucide-react';

const ColumnManager = ({ isOpen, onClose, allColumns, columnOrder, setColumnOrder, columnVisibility, setColumnVisibility, isDarkMode, onToggleTheme }) => {
    if (!isOpen) return null;

    // Reorder: Update columnOrder
    const move = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= columnOrder.length) return;
        const newOrder = [...columnOrder];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        setColumnOrder(newOrder);
    };

    // Toggle: Update columnVisibility
    const toggle = (id) => {
        setColumnVisibility(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-100">Manage Columns</h3>
                    <button onClick={onClose}><XCircle size={20} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {columnOrder.map((colId, index) => {
                        const def = allColumns.find(c => c.id === colId);
                        if (!def) return null;

                        const isVisible = columnVisibility[colId] !== false; // Default true if undefined

                        return (
                            <div key={def.id} className={`flex items-center gap-3 p-2 rounded-lg border ${isVisible ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                                <input
                                    type="checkbox"
                                    checked={isVisible}
                                    onChange={() => toggle(def.id)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                    disabled={def.id === 'selection'}
                                />
                                <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">{def.label || (def.icon ? <def.icon size={14} /> : 'System')}</span>
                                {isVisible && (
                                    <div className="flex gap-1">
                                        <button onClick={() => move(index, index - 1)} disabled={index === 0 || def.fixed || def.id === 'selection' || def.id === 'delete'} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20"><ChevronUp size={16} /></button>
                                        <button onClick={() => move(index, index + 1)} disabled={index === columnOrder.length - 1 || def.fixed || def.id === 'selection' || def.id === 'delete'} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20"><ChevronDown size={16} /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        {isDarkMode ? <Moon size={14} className="fill-slate-200" /> : <Sun size={14} className="text-amber-500 fill-amber-500" />}
                        {isDarkMode ? 'Dark' : 'Light'}
                    </button>

                    <div className="flex items-center gap-4">
                        <button onClick={() => {
                            setColumnOrder(allColumns.map(c => c.id));
                            const defaults = {}; allColumns.forEach(c => defaults[c.id] = true);
                            setColumnVisibility(defaults);
                        }} className="text-xs text-red-500 font-bold hover:underline">Reset</button>
                        <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">Done</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColumnManager;
