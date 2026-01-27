/**
 * Audio Control Functions Hook
 * Provides control functions for audio playback
 */

import { useCallback } from 'react';
import { stopAudio } from '../../utils/audioPlayer';

export function useAudioControls(state, dispatch, filteredAndSortedData, setIsAudioBarManuallyHidden) {
    const togglePlayPause = useCallback(() => {
        if (state.isPlaying) {
            stopAudio();
            dispatch({ type: 'PAUSE' });
        } else {
            // Priority 1: If in single mode with a singleId, restart single track
            if (state.playbackMode === 'single' && state.singleId) {
                dispatch({ type: 'PLAY_SINGLE', id: state.singleId });
            }
            // Priority 2: If playlist state exists (queue and valid index), resume playlist
            else if (state.playlistQueue.length > 0 && state.playlistIndex >= 0) {
                dispatch({ type: 'RESUME' });
            }
            // Priority 3: Otherwise, just resume (for any other paused state)
            else {
                dispatch({ type: 'RESUME' });
            }
        }
    }, [state.isPlaying, state.playbackMode, state.singleId, state.playlistQueue, state.playlistIndex, dispatch]);

    const stopPlaylist = useCallback(() => {
        stopAudio();
        dispatch({ type: 'STOP' });
    }, [dispatch]);

    const startPlaylist = useCallback((idx = null) => {
        const queue = filteredAndSortedData.map(v => v.localId);
        dispatch({ type: 'START_PLAYLIST', queue, startIndex: idx });
        setIsAudioBarManuallyHidden(false);
    }, [filteredAndSortedData, dispatch, setIsAudioBarManuallyHidden]);

    const handlePlaySingle = useCallback((item, shouldPlay = true) => {
        stopAudio();
        // Force a small delay to ensure cleanup if needed, though stopAudio is sync
        dispatch({ type: 'PLAY_SINGLE', id: item.localId, shouldPlay });
    }, [dispatch]);

    const onNextTrack = useCallback(() => {
        if (state.playbackMode === 'single') {
            // Find current index in filtered list
            const currentId = state.singleId;
            const currentIndex = filteredAndSortedData.findIndex(item => item.localId === currentId || item.id === currentId);

            if (currentIndex !== -1 && currentIndex < filteredAndSortedData.length - 1) {
                const nextItem = filteredAndSortedData[currentIndex + 1];
                handlePlaySingle(nextItem, state.isPlaying);
            }
        } else {
            dispatch({ type: 'NEXT' });
        }
    }, [dispatch, state.playbackMode, state.singleId, state.isPlaying, filteredAndSortedData, handlePlaySingle]);

    const onPrevTrack = useCallback(() => {
        if (state.playbackMode === 'single') {
            const currentId = state.singleId;
            const currentIndex = filteredAndSortedData.findIndex(item => item.localId === currentId || item.id === currentId);

            if (currentIndex > 0) {
                const prevItem = filteredAndSortedData[currentIndex - 1];
                handlePlaySingle(prevItem, state.isPlaying);
            }
        } else {
            dispatch({ type: 'PREV' });
        }
    }, [dispatch, state.playbackMode, state.singleId, state.isPlaying, filteredAndSortedData, handlePlaySingle]);

    return {
        togglePlayPause,
        stopPlaylist,
        startPlaylist,
        handlePlaySingle,
        onNextTrack,
        onPrevTrack
    };
}
