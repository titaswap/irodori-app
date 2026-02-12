
import React, { useState, useEffect } from 'react';
import {
    Layers, SkipBack, Pause, Play, SkipForward, ChevronDown, Repeat, Star, ToggleLeft, ToggleRight
} from 'lucide-react';

const AudioPlayerBar = ({
    playbackMode,
    playbackQueue,
    currentIndex,
    currentSingleId, // New prop
    vocabList,
    isPlaying,
    audioConfig,
    onPrevTrack,
    onNextTrack,
    onTogglePlayPause,
    onCycleRepeat,
    onCycleSpeed,
    onToggleAutoPlay,
    onHide,
    onToggleMark
}) => {
    const [isHiding, setIsHiding] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Trigger animation on mount
    useEffect(() => {
        // Small delay to ensure DOM has rendered before triggering animation
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    // Show bar if: playlist mode with queue, OR single mode, OR idle mode with playlist state preserved
    if (playbackQueue.length === 0 && playbackMode === 'idle') return null;

    let currentId = playbackMode === 'playlist' ? playbackQueue[currentIndex] : currentSingleId;
    const currentItem = vocabList.find(v => v.localId === currentId);
    if (!currentItem) return null;

    const handleHideClick = (e) => {
        e.stopPropagation();
        setIsHiding(true);
        // Wait for animation to complete before calling onHide
        setTimeout(() => {
            if (onHide) onHide();
        }, 500); // Match the transition duration (500ms)
    };

    return (
        <div className={`w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 h-12 flex items-center justify-between px-3 md:px-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-50 transition-all duration-500 ease-out ${isHiding
            ? 'translate-y-full opacity-0'
            : isVisible
                ? 'translate-y-0 opacity-100 animate-in slide-in-from-bottom-12'
                : 'translate-y-full opacity-0'
            }`}>
            <div className="flex items-center gap-2 w-1/4 min-w-0">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hidden md:block shrink-0"><Layers size={18} /></div>
                <div className="overflow-hidden flex flex-col justify-center">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm leading-tight">{currentItem.japanese}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">{currentItem.bangla}</div>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 flex-1">
                <button onClick={onPrevTrack} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 md:p-1.5 rounded-full transition-colors"><SkipBack size={16} className="md:w-[18px] md:h-[18px]" /></button>

                <button onClick={onTogglePlayPause} className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full shadow-sm transform active:scale-95 transition-all ${isPlaying ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {isPlaying ? <Pause size={16} className="md:w-[18px] md:h-[18px]" fill="white" /> : <Play size={16} className="ml-0.5 md:w-[18px] md:h-[18px]" fill="white" />}
                </button>

                <button onClick={onNextTrack} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 md:p-1.5 rounded-full transition-colors"><SkipForward size={16} className="md:w-[18px] md:h-[18px]" /></button>

                <button
                    onClick={() => onToggleMark(currentItem)} // UPDATED: Pass entire item for tag handler
                    className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-colors order-last outline-none ${Array.isArray(currentItem.tags) && currentItem.tags.some(t => {
                        const tagName = typeof t === 'string' ? t : t.name;
                        return tagName === 'Audio';
                    })
                        ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    title="Tag as Audio Problem"
                >
                    <Star size={16} className="md:w-[18px] md:h-[18px]" fill={
                        Array.isArray(currentItem.tags) && currentItem.tags.some(t => {
                            const tagName = typeof t === 'string' ? t : t.name;
                            return tagName === 'Audio';
                        }) ? "currentColor" : "none"
                    } />
                </button>
                <div className="hidden md:block text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase ml-2">{currentIndex + 1} / {playbackQueue.length} • {audioConfig.repeatMode.toUpperCase()}</div>
            </div>
            <div className="flex items-center gap-2 w-1/4 justify-end min-w-0">
                <button
                    onClick={onToggleAutoPlay}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${audioConfig.autoPlaySingle ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                    title={audioConfig.autoPlaySingle ? "Auto-Play: ON" : "Auto-Play: OFF"}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">Auto</span>
                    {audioConfig.autoPlaySingle ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>

                <div className="relative group shrink-0">
                    <select
                        value={audioConfig.repeatPerItem}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            onCycleRepeat(val);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                        {[1, 2, 3, 5, 10, 20, 30, 40, 50, 100].map(n => (
                            <option key={n} value={n}>{n}x</option>
                        ))}
                    </select>
                    <button className={`p-0 rounded-[4px] flex items-center gap-0.5 transition-all ${audioConfig.repeatPerItem > 1 ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`} title={`Repeat: ${audioConfig.repeatPerItem}x`}>
                        <Repeat size={11} />
                        <span className="text-[9px] font-bold">{audioConfig.repeatPerItem}x</span>
                    </button>

                </div>
                <button onClick={onCycleSpeed} className="hidden md:block p-0 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold w-7 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Speed">{audioConfig.speed}x</button>

                <button
                    onClick={handleHideClick}
                    className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-1 relative z-50"
                    title="Hide"
                >
                    <ChevronDown size={18} />
                </button>
            </div>
        </div>
    );
};

export default AudioPlayerBar;
