import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import KanjiBreakdownPreview from './KanjiBreakdownPreview';
import KanjiBreakdownPanel from './KanjiBreakdownPanel';

/**
 * KanjiBreakdownCell - Container component managing breakdown preview + panel
 * ONLY used for Kanji folder + breakdown column
 * 
 * CRITICAL FIX: Uses React Portal to render panel outside table DOM tree
 * This prevents invalid HTML (<div> inside <tr>) which was causing hydration errors
 */
const KanjiBreakdownCell = ({ value, isActive }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const handleViewClick = (e) => {
        e.stopPropagation(); // Prevent row selection
        setIsPanelOpen(true);
    };

    const handleClose = () => {
        setIsPanelOpen(false);
    };

    return (
        <>
            <td
                data-col-id="breakdown"
                className={`px-0 border-r border-slate-200 dark:border-white/5 ${isActive
                    ? '!bg-[#e5f5f1] dark:!bg-transparent'
                    : 'bg-white/40 dark:bg-white/[0.02]'
                    }`}
            >
                <KanjiBreakdownPreview
                    text={value}
                    onViewClick={handleViewClick}
                    isActive={isActive}
                />
            </td>
            {/* CRITICAL: Panel rendered via Portal to document.body (outside table) */}
            {isPanelOpen && createPortal(
                <KanjiBreakdownPanel
                    isOpen={isPanelOpen}
                    text={value}
                    onClose={handleClose}
                />,
                document.body
            )}
        </>
    );
};

export default KanjiBreakdownCell;
