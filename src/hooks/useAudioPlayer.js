
import { useState, useRef, useEffect, useCallback } from 'react';

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
        const synth = window.speechSynthesis;
        synth.cancel();
        if (!text) { onEnd?.(); return; }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = rate;
        utteranceRef.current = u;
        u.onend = () => { utteranceRef.current = null; onEnd?.(); };
        synth.speak(u);
    };

    const togglePlayPause = () => {
        const synth = window.speechSynthesis;
        if (isPlaying) {
            synth.pause();
            setIsPlaying(false);
        } else {
            if (synth.paused) {
                synth.resume();
                setIsPlaying(true);
            } else {
                setIsPlaying(true);
            }
        }
    };

    const stopPlaylist = useCallback(() => {
        window.speechSynthesis.cancel();
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

        speakText(item.japanese, 'ja-JP', audioConfig.speed, () => {
            if (audioConfig.includeBangla) {
                setTimeout(() => {
                    if (!isPlaying) return; // Check if stopped
                    speakText(item.bangla, 'bn-BD', audioConfig.speed, handleAudioComplete);
                }, 300);
            } else {
                handleAudioComplete();
            }
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
