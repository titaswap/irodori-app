import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * KanjiBreakdownPreview - Shows truncated preview of breakdown text in table cell
 * ONLY used for Kanji folder + breakdown column
 * MEMOIZED to prevent re-renders
 */
const KanjiBreakdownPreview = React.memo(({ text, onViewClick, isActive }) => {
    const truncateText = (text, maxChars = 120) => {
        if (!text || text.length <= maxChars) return text;
        return text.substring(0, maxChars) + '...';
    };

    const displayText = truncateText(text);
    const hasMore = text && text.length > 120;

    return (
        <div className={`w-full h-full px-2 py-0.5 flex flex-col justify-center ${isActive ? 'text-slate-900 dark:text-indigo-100' : 'text-slate-600 dark:text-[#cbd5e1]'}`}>
            <div className="text-sm leading-tight line-clamp-2">
                {displayText || '—'}
            </div>
            {hasMore && (
                <button
                    onClick={onViewClick}
                    className="mt-1 text-xs text-primary flex items-center gap-0.5"
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                    }}
                >
                    View breakdown
                    <ChevronRight size={12} />
                </button>
            )}
        </div>
    );
});

KanjiBreakdownPreview.displayName = 'KanjiBreakdownPreview';

export default KanjiBreakdownPreview;
