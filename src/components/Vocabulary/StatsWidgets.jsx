
import React from 'react';
import { Target, ArrowRight } from 'lucide-react';

export const ProgressTrendChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-xs text-slate-400">Not enough data</div>;
    const maxScore = Math.max(...data.map(d => d.score), 100);
    return (
        <div className="flex items-end gap-1 h-8 w-32">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <div style={{ height: `${Math.max((d.score / maxScore) * 100, 10)}%` }} className={`w-full rounded-sm min-h-[4px] transition-all ${d.hasActivity ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-50">{d.date.slice(5)}: {Math.round(d.score)}</div>
                </div>
            ))}
        </div>
    );
};

export const WeaknessCard = ({ suggestion, onApply }) => {
    if (!suggestion) return null;
    return (
        <div onClick={onApply} className="flex items-center gap-3 p-2 bg-rose-50 border border-rose-100 rounded-lg cursor-pointer hover:bg-rose-100 hover:border-rose-200 transition-all group">
            <div className="bg-white p-1.5 rounded-md text-rose-500 shadow-sm"><Target size={14} /></div>
            <div><div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Recommended Focus</div><div className="text-xs font-bold text-rose-700">Lesson {suggestion.lesson} <span className="text-rose-400">•</span> Can-do {suggestion.cando}<span className="ml-1 opacity-75"> ({suggestion.count} words)</span></div></div>
            <ArrowRight size={14} className="text-rose-400 ml-auto group-hover:translate-x-1 transition-transform"/>
        </div>
    );
};
