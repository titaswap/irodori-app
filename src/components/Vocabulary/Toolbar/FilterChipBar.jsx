/**
 * Filter Chip Bar Component
 * Displays filterable chips for lessons and can-do items
 */

import React from 'react';
import { X } from 'lucide-react';

export const FilterChipBar = ({ label, items, activeValues, onToggle, color = 'blue' }) => {
    if (!items || items.length === 0) return null;
    const safeActive = Array.isArray(activeValues) ? activeValues : [];

    const colorClasses = {
        blue: { active: 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/50', inactive: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-400 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-600' },
        indigo: { active: 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50', inactive: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-400 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600' }
    };
    const styles = colorClasses[color] || colorClasses.blue;

    return (
        <div className="flex items-center gap-2 overflow-hidden px-1 select-none transition-all duration-300 h-6 md:h-7 border-b border-transparent">
            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5 w-[50px] shrink-0 text-right">
                {label === 'L' ? 'Lesson' : 'Can-do'}
            </div>

            <div className="flex gap-1 overflow-x-auto items-center h-full no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>
                {items.map(([val, count]) => {
                    const isActive = safeActive.includes(val);
                    return (
                        <button
                            key={val}
                            onClick={() => onToggle(val)}
                            title={`${label === 'L' ? 'Lesson' : 'Can-do'} ${val} – ${count} words`}
                            className={`
                                    flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shrink-0
                                    ${isActive ? styles.active : styles.inactive}
                                `}
                        >
                            <span>{label}{val}</span>
                            <span className={`text-[9px] opacity-70 ${isActive ? 'bg-white/20 px-1 rounded-[2px]' : 'text-slate-500 dark:text-slate-500 bg-slate-300 dark:bg-slate-700 px-1 rounded-[2px]'}`}>{count}</span>
                            {isActive && <X size={10} className="ml-0.5 opacity-80 hover:opacity-100" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
