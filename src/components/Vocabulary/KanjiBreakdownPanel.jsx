import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTableHoverLock } from '../../hooks/useTableHoverLock.jsx';
import SmartBreakdownFormatter from './SmartBreakdownFormatter.jsx';

/**
 * KanjiBreakdownPanel - Isolated, stable panel for breakdown text
 * 
 * CRITICAL FIX: This component locks table hover when open to prevent
 * infinite re-render glitch caused by table hover logic running while panel is open.
 * 
 * - Locks table hover on mount
 * - Unlocks table hover on unmount
 * - No hover-based layout changes
 * - No dynamic height calculations
 * - No mouse position tracking
 * - Renders content ONLY ONCE when opened
 */
const KanjiBreakdownPanel = React.memo(({ isOpen, text, onClose }) => {
    const { lock, unlock } = useTableHoverLock();

    // Lock table hover when panel opens, unlock when it closes
    useEffect(() => {
        if (isOpen) {
            lock();
        } else {
            unlock();
        }

        // Cleanup: always unlock on unmount
        return () => {
            unlock();
        };
    }, [isOpen, lock, unlock]);

    // Memoize close handler to prevent re-renders
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, handleClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Full-screen transparent overlay - blocks ALL table interactions */}
            <div
                className="fixed inset-0 z-[35]"
                style={{
                    pointerEvents: 'all',
                    backgroundColor: 'transparent',
                    cursor: 'default'
                }}
            />

            {/* Backdrop - semi-transparent, above overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={handleClose}
                style={{ pointerEvents: 'auto' }}
            />

            {/* Desktop: Right drawer - STABLE, no transitions on hover */}
            <div className="hidden md:block">
                <div
                    className="fixed inset-y-0 right-0 w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-50"
                    style={{
                        pointerEvents: 'auto',
                        maxWidth: '500px',
                        wordWrap: 'break-word'
                    }}
                >
                    <div className="h-full flex flex-col">
                        {/* Header - STABLE */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Kanji Breakdown
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-400"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - STABLE, overflow internal only */}
                        <div
                            className="flex-1 p-6"
                            style={{
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                maxWidth: '100%'
                            }}
                        >
                            {/* Smart formatter - automatically detects structure and applies styling */}
                            <SmartBreakdownFormatter
                                text={text}
                                isDark={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Bottom sheet - STABLE */}
            <div className="md:hidden">
                <div
                    className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl z-50"
                    style={{
                        pointerEvents: 'auto',
                        maxHeight: '80vh',
                        wordWrap: 'break-word'
                    }}
                >
                    <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Kanji Breakdown
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-400"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div
                            className="flex-1 p-6"
                            style={{
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                maxWidth: '100%'
                            }}
                        >
                            {/* Smart formatter - automatically detects structure and applies styling */}
                            <SmartBreakdownFormatter
                                text={text}
                                isDark={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

// Display name for debugging
KanjiBreakdownPanel.displayName = 'KanjiBreakdownPanel';

export default KanjiBreakdownPanel;
