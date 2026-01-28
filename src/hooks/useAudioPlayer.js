/**
 * Main Audio Player Hook
 * Combines audio reducer, playback logic, and control functions
 */

import { useReducer, useState, useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { audioReducer, initialState } from './audio/audioReducer';
import { useAudioPlayback } from './audio/useAudioPlayback';
import { useAudioControls } from './audio/useAudioControls';

export const useAudioPlayer = (vocabList, filteredAndSortedData, showToast) => {
    const [state, dispatch] = useReducer(audioReducer, initialState);
    // Initialize config from localStorage
    const [audioConfig, setAudioConfig] = useState(() => {
        const DEFAULT_CONFIG = { speed: 1.0, repeatMode: '1x', repeatPerItem: 1, includeBangla: false, autoPlaySingle: true };
        try {
            const saved = localStorage.getItem('irodori_audio_config');
            if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (e) {
            console.warn("Failed to load audio config", e);
        }
        return DEFAULT_CONFIG;
    });

    // Save config to localStorage on change
    useEffect(() => {
        localStorage.setItem('irodori_audio_config', JSON.stringify(audioConfig));
    }, [audioConfig]);
    const [isAudioBarManuallyHidden, setIsAudioBarManuallyHidden] = useState(false);

    // Persistent context ref: tracks if we should resume playlist after single ends
    const wasPlaylistActiveRef = useRef(false);

    // Playback logic (effects, completion handler, Android listener)
    // Pass filteredAndSortedData and ref for AutoPlay and Resume logic
    const { isManualMove } = useAudioPlayback(state, dispatch, audioConfig, vocabList, filteredAndSortedData, showToast, wasPlaylistActiveRef);

    // Control functions
    const {
        togglePlayPause,
        stopPlaylist,
        startPlaylist,
        handlePlaySingle,
        onNextTrack,
        onPrevTrack
    } = useAudioControls(state, dispatch, filteredAndSortedData, setIsAudioBarManuallyHidden);

    // Wrappers to flag manual moves for debouncing
    const onNextTrackWrapped = useCallback(() => {
        isManualMove.current = true;
        flushSync(() => {
            onNextTrack();
        });
    }, [onNextTrack, isManualMove]);

    const onPrevTrackWrapped = useCallback(() => {
        isManualMove.current = true;
        flushSync(() => {
            onPrevTrack();
        });
    }, [onPrevTrack, isManualMove]);

    const startPlaylistWrapped = useCallback((idx) => {
        isManualMove.current = true;
        // Playing playlist explicitly -> Clear context marker
        wasPlaylistActiveRef.current = false;
        flushSync(() => {
            startPlaylist(idx);
        });
    }, [startPlaylist, isManualMove]);

    const handlePlaySingleWrapped = useCallback((item) => {
        // If we are currently in playlist mode (and playing or paused with queue), save context
        if (state.playbackMode === 'playlist' || (state.playlistQueue.length > 0 && state.playlistIndex >= 0)) {
            wasPlaylistActiveRef.current = true;
        }
        // If we are already in single mode, keep existing ref state (don't overwrite)

        isManualMove.current = true;
        flushSync(() => {
            handlePlaySingle(item);
        });
    }, [handlePlaySingle, isManualMove, state.playbackMode, state.playlistQueue.length, state.playlistIndex]);

    return {
        playbackMode: state.playbackMode,
        isPlaying: state.isPlaying,
        playbackQueue: state.playlistQueue,
        currentIndex: state.playlistIndex,
        currentSingleId: state.singleId,
        lastPlayedRowId: state.lastPlayedRowId,
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
