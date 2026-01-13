import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { playJapaneseAudio, stopAudio } from '../utils/audioPlayer';

const initialState = {
    playbackMode: 'idle', // 'idle', 'playlist', 'single'
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    repeatCount: 0,
};

function audioReducer(state, action) {
    switch (action.type) {
        case 'START_PLAYLIST':
            return {
                ...state,
                playbackMode: 'playlist',
                isPlaying: true,
                queue: action.queue,
                currentIndex: action.startIndex,
                repeatCount: 0
            };
        case 'PLAY_SINGLE':
            return {
                ...state,
                playbackMode: 'single',
                isPlaying: true,
                queue: [action.id],
                currentIndex: 0,
                repeatCount: 0
            };
        case 'STOP':
            return {
                ...state,
                isPlaying: false,
                playbackMode: 'idle',
                queue: [],
                currentIndex: -1,
                repeatCount: 0
            };
        case 'PAUSE':
            return { ...state, isPlaying: false };
        case 'RESUME':
            return { ...state, isPlaying: true };
        case 'NEXT':
            // Logic: if can go next, do it. Reset repeat.
            if (state.currentIndex < state.queue.length - 1) {
                return { ...state, currentIndex: state.currentIndex + 1, repeatCount: 0 };
            }
            return state;
        case 'PREV':
            if (state.currentIndex > 0) {
                return { ...state, currentIndex: state.currentIndex - 1, repeatCount: 0 };
            }
            return state;
        case 'REPEAT_INCREMENT':
            return { ...state, repeatCount: state.repeatCount + 1 };
        case 'LOOP_BACK':
            return { ...state, currentIndex: 0, repeatCount: 0 };
        default:
            return state;
    }
}

export const useAudioPlayer = (vocabList, filteredAndSortedData, showToast) => {
    const [state, dispatch] = useReducer(audioReducer, initialState);
    const [audioConfig, setAudioConfig] = useState({ speed: 1.0, repeatMode: '1x', includeBangla: false });
    const [isAudioBarManuallyHidden, setIsAudioBarManuallyHidden] = useState(false);

    // Provide safe access to current state in callbacks without adding dependencies causing re-renders/re-runs of effects
    const stateRef = useRef(state);
    const audioConfigRef = useRef(audioConfig);

    useEffect(() => {
        stateRef.current = state;
        audioConfigRef.current = audioConfig;
    }, [state, audioConfig]);

    // --- ACTIONS ---

    const togglePlayPause = useCallback(() => {
        if (state.isPlaying) {
            stopAudio();
            dispatch({ type: 'PAUSE' });
        } else {
            dispatch({ type: 'RESUME' });
        }
    }, [state.isPlaying]);

    const stopPlaylist = useCallback(() => {
        stopAudio();
        dispatch({ type: 'STOP' });
        setIsAudioBarManuallyHidden(false);
    }, []);

    const startPlaylist = useCallback((idx = 0) => {
        const queue = filteredAndSortedData.map(v => v.localId);
        dispatch({ type: 'START_PLAYLIST', queue, startIndex: idx });
        setIsAudioBarManuallyHidden(false);
    }, [filteredAndSortedData]); // Depend on data

    const handlePlaySingle = useCallback((item) => {
        stopAudio(); // Ensure clean consistency
        dispatch({ type: 'PLAY_SINGLE', id: item.localId });
    }, []);

    const onNextTrack = useCallback(() => {
        dispatch({ type: 'NEXT' });
    }, []);

    const onPrevTrack = useCallback(() => {
        dispatch({ type: 'PREV' });
    }, []);


    // --- AUDIO COMPLETION LOGIC (The Controller) ---
    const handleAudioComplete = useCallback(() => {
        // Read FRESH state from Refs (The "Controller" reads truth)
        const current = stateRef.current;
        const config = audioConfigRef.current;

        if (!current.isPlaying) return; // Should have been stopped, but extra safety.

        // 1. Check Repeat
        const repeatLimit = config.repeatPerItem || 1;
        if (current.repeatCount < repeatLimit - 1) {
            stopAudio(); // Ensure explicit stop before repeating
            setTimeout(() => dispatch({ type: 'REPEAT_INCREMENT' }), 500);
            return;
        }

        // 2. Check Next
        if (current.currentIndex < current.queue.length - 1) {
            stopAudio(); // Ensure explicit stop before next track
            setTimeout(() => dispatch({ type: 'NEXT' }), 800);
            return;
        }

        // 3. Check Loop
        if (current.playbackMode === 'playlist' && config.playlistLoop) {
            stopAudio(); // Ensure explicit stop before looping
            setTimeout(() => dispatch({ type: 'LOOP_BACK' }), 800);
            return;
        }

        // 4. End
        stopAudio();
        dispatch({ type: 'STOP' });
        showToast("Playback Finished");

    }, [showToast]); // Minimal dependencies. Logic relies on refs for latest state.



    // --- ANDROID NATIVE EVENT LISTENER ---
    // Listens for the custom event dispatched by window.androidAudioFinished
    useEffect(() => {
        const onAndroidAudioEnded = () => {
            // Check if we are actually playing before handling end
            // This prevents stale events from triggering unexpected moves
            if (stateRef.current.isPlaying) {
                handleAudioComplete();
            }
        };

        window.addEventListener('android-audio-ended', onAndroidAudioEnded);
        return () => {
            window.removeEventListener('android-audio-ended', onAndroidAudioEnded);
        };
    }, [handleAudioComplete]); // Dependency on handleAudioComplete (which is stable via useCallback)

    // --- SYNC EFFECT (The Player) ---
    // Reacts to State Changes (Source of Truth) and plays audio
    // FIX: Debounce audio calls to preventing UI freezing during rapid clicks
    const isManualMove = useRef(false);

    useEffect(() => {
        if (!state.isPlaying || state.currentIndex === -1 || state.queue.length === 0) {
            return;
        }

        const currentId = state.queue[state.currentIndex];
        const item = vocabList.find(v => v.localId === currentId) || vocabList.find(v => v.id === currentId);

        if (!item) {
            handleAudioComplete();
            return;
        }

        // Stop previous immediately to ensure silence during transition
        stopAudio();

        const play = () => {
            // For Web TTS: pass handleAudioComplete as callback
            // For Android: It relies on the event listener above, but passing it doesn't hurt (logic in audioPlayer separates them)
            playJapaneseAudio(item.japanese, () => {
                handleAudioComplete();
            });
        };

        let timer;
        if (isManualMove.current) {
            // Manual Navigation: Debounce to let UI settle
            // 50ms is enough to debounce machine-gun clicks but feel instant
            // User reported 10-20 clicks -> counting lag.
            // A slightly longer debounce (150ms) ensures we skip intermediate audio entirely.
            timer = setTimeout(() => {
                isManualMove.current = false; // Reset for next time
                play();
            }, 100);
        } else {
            // Auto Advance: Immediate
            play();
        }

        return () => {
            clearTimeout(timer);
            // Don't stop audio here on unmount of effect if it's just a re-render
            // stopAudio() is called at top of effect for next item
            // prevent stopping if component unmounts? No, we should stop.
            stopAudio();
        };

    }, [state.currentIndex, state.isPlaying, state.repeatCount, state.playbackMode, state.queue, vocabList, handleAudioComplete]);

    // WRAPPERS to flag manual moves
    const onNextTrackWrapped = useCallback(() => {
        isManualMove.current = true;
        flushSync(() => {
            onNextTrack();
        });
    }, [onNextTrack]);

    const onPrevTrackWrapped = useCallback(() => {
        isManualMove.current = true;
        flushSync(() => {
            onPrevTrack();
        });
    }, [onPrevTrack]);

    const startPlaylistWrapped = useCallback((idx) => {
        isManualMove.current = true; // Treating start as manual
        flushSync(() => {
            startPlaylist(idx);
        });
    }, [startPlaylist]);

    const handlePlaySingleWrapped = useCallback((item) => {
        isManualMove.current = true;
        flushSync(() => {
            handlePlaySingle(item);
        });
    }, [handlePlaySingle]);


    return {
        playbackMode: state.playbackMode,
        isPlaying: state.isPlaying,
        playbackQueue: state.queue,
        currentIndex: state.currentIndex,
        audioConfig,
        isAudioBarManuallyHidden,
        setAudioConfig,
        setIsAudioBarManuallyHidden,
        togglePlayPause,
        stopPlaylist,
        startPlaylist: startPlaylistWrapped,
        handlePlaySingle: handlePlaySingleWrapped,
        onPrevTrack: onPrevTrackWrapped,
        onNextTrack: onNextTrackWrapped
    };
};
