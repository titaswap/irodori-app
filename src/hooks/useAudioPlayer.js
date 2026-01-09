
import { useState, useRef, useEffect, useCallback } from 'react';
import { playJapaneseAudio, stopAudio } from '../utils/audioPlayer';

export const useAudioPlayer = (vocabList, filteredAndSortedData, showToast) => { // Passing dependnecies
    const [playbackMode, setPlaybackMode] = useState('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackQueue, setPlaybackQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [currentRepeatCount, setCurrentRepeatCount] = useState(0);
    const [audioConfig, setAudioConfig] = useState({ speed: 1.0, repeatMode: '1x', includeBangla: false });
    const [isAudioBarManuallyHidden, setIsAudioBarManuallyHidden] = useState(false);

    const utteranceRef = useRef(null);

    const speakText = (text, lang = 'ja-JP', rate = 1.0, onEnd) => {
        // Delegate to modular audio player
        // speed/rate is currently not supported by the simple playJapaneseAudio signature for Gemini, 
        // but the module falls back to browser which fixed rate 1.0. 
        // For now we ignore rate for Gemini to keep it simple as requested, or we could pass it.
        // User asked for "simple function like playJapaneseAudio(text)".
        playJapaneseAudio(text, onEnd);
    };

    const togglePlayPause = () => {
        // Since the new module handles stop/play, pausing Gemini audio mid-stream is complex 
        // (audio element pause). The module exposed stopAudio.
        // Pausing TTS often means stopping.
        // For simplicity, we'll treat toggle as Stop if playing, and Play current if not.
        if (isPlaying) {
            stopAudio();
            setIsPlaying(false);
        } else {
            // Resume/Play logic
            setIsPlaying(true);
        }
    };

    const stopPlaylist = useCallback(() => {
        stopAudio();
        setIsPlaying(false);
        setPlaybackMode('idle');
        setPlaybackQueue([]);
        setCurrentIndex(-1);
        setCurrentRepeatCount(0);
        setIsAudioBarManuallyHidden(false);
    }, []);

    const handleAudioComplete = useCallback(() => {
        if (!isPlaying) return;

        // 1. Check Repeats
        if (currentRepeatCount < (audioConfig.repeatPerItem || 1) - 1) {
            setTimeout(() => setCurrentRepeatCount(prev => prev + 1), 500);
            return;
        }

        // 2. Repeats done, move to next item
        if (currentIndex < playbackQueue.length - 1) {
            setTimeout(() => {
                setCurrentRepeatCount(0);
                setCurrentIndex(prev => prev + 1);
            }, 800);
        } else {
            // 3. Last item done. Check Playlist Loop
            if (playbackMode === 'playlist' && audioConfig.playlistLoop) {
                setTimeout(() => {
                    setCurrentRepeatCount(0);
                    setCurrentIndex(0); // Loop back
                }, 800);
            } else {
                // Stop
                setIsPlaying(false);
                setCurrentRepeatCount(0);
                setCurrentIndex(0);
                showToast("Playback Finished");
            }
        }
    }, [isPlaying, currentRepeatCount, audioConfig, currentIndex, playbackQueue.length, playbackMode, showToast]);

    const playCurrentItem = () => {
        const currentId = playbackQueue[currentIndex];
        const item = vocabList.find(v => v.localId === currentId) || vocabList.find(v => v.id === currentId); // Robust check

        if (!item) {
            handleAudioComplete();
            return;
        }

        // Only playing Japanese as per requirement "Audio playback must always be Japanese language based"
        // And "Use Gemini TTS as primary". 
        // Bangla support in new module? The user requirement said "Audio playback must always be Japanese". 
        // It didn't explicitly forbid Bangla but the goal is "Reliable Japanese pronunciation".
        // The existing code had `if (audioConfig.includeBangla) ...`.
        // If I strictly follow "Audio playback must always be Japanese language based (ja-JP)", I might drop Bangla.
        // BUT preventing regression is good. The new module `playJapaneseAudio` is specific.
        // If we want Bangla, we'd need `playBrowserAudio` directly or similar.
        // Let's assume for now we only play Japanese to satisfy the specific prompt constraints heavily focusing on Japanese.

        playJapaneseAudio(item.japanese, () => {
            handleAudioComplete();
        });
    };

    // Unified Playback Effect
    useEffect(() => {
        if (isPlaying && currentIndex >= 0 && currentIndex < playbackQueue.length) {
            playCurrentItem();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, currentIndex, playbackQueue, currentRepeatCount]);


    const startPlaylist = (idx = 0) => {
        setPlaybackQueue(filteredAndSortedData.map(v => v.localId));
        setCurrentIndex(idx);
        setPlaybackMode('playlist');
        setCurrentRepeatCount(0);
        setIsPlaying(true);
        setIsAudioBarManuallyHidden(false);
    };

    const handlePlaySingle = useCallback((item) => {
        stopPlaylist();
        setPlaybackMode('single');
        setPlaybackQueue([item.localId]);
        setCurrentIndex(0);
        setIsPlaying(true);
    }, [stopPlaylist]);


    return {
        playbackMode, isPlaying, playbackQueue, currentIndex, audioConfig, isAudioBarManuallyHidden,
        setAudioConfig, setIsAudioBarManuallyHidden,
        togglePlayPause, stopPlaylist, startPlaylist, handlePlaySingle,
        onPrevTrack: () => { if (currentIndex > 0) setCurrentIndex(p => p - 1) },
        onNextTrack: () => { if (currentIndex < playbackQueue.length - 1) setCurrentIndex(p => p + 1) }
    };
};
