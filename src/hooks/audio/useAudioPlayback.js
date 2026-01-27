/**
 * Audio Playback Logic Hook
 * Handles audio playback effect, completion logic, and Android event listener
 */

import { useEffect, useRef, useCallback } from 'react';
import { playJapaneseAudio, stopAudio } from '../../utils/audioPlayer';

export function useAudioPlayback(state, dispatch, audioConfig, vocabList, displayData, showToast, wasPlaylistActiveRef) {
    const stateRef = useRef(state);
    const audioConfigRef = useRef(audioConfig);

    // Update refs
    useEffect(() => {
        stateRef.current = state;
        audioConfigRef.current = audioConfig;
    }, [state, audioConfig]);

    // Audio completion handler
    const handleAudioComplete = useCallback(() => {
        const current = stateRef.current;
        const config = audioConfigRef.current;

        if (!current.isPlaying) return;

        if (current.playbackMode === 'single') {
            // Check repeat setting for single row
            const repeatLimit = config.repeatPerItem || 1;
            if (current.singleRepeatCount < repeatLimit - 1) {
                stopAudio();
                setTimeout(() => {
                    if (stateRef.current.isPlaying) {
                        dispatch({ type: 'REPEAT_INCREMENT_SINGLE' });
                    }
                }, 500);
                return;
            }

            // Finished repeats. Check AutoPlay.
            if (config.autoPlaySingle && Array.isArray(displayData)) {
                const currentIndex = displayData.findIndex(item => item.localId === current.singleId || item.id === current.singleId);
                if (currentIndex !== -1 && currentIndex < displayData.length - 1) {
                    stopAudio();
                    const nextId = displayData[currentIndex + 1].localId;
                    setTimeout(() => {
                        if (stateRef.current.isPlaying) {
                            dispatch({ type: 'PLAY_SINGLE', id: nextId });
                        }
                    }, 500);
                    return;
                }
            }

            // Finished all repeats and no auto-play - check for Resume Playlist Context
            stopAudio();

            // If we were previously playing a playlist (context exists), resume it
            if (wasPlaylistActiveRef && wasPlaylistActiveRef.current && current.playlistQueue.length > 0) {
                setTimeout(() => {
                    if (stateRef.current.isPlaying) {
                        dispatch({ type: 'RESUME' });
                    }
                }, 300);
            } else {
                dispatch({ type: 'PAUSE_SINGLE' });
            }
            return;
        }

        // Playlist Progress Logic
        const repeatLimit = config.repeatPerItem || 1;
        if (current.playlistRepeatCount < repeatLimit - 1) {
            stopAudio();
            setTimeout(() => {
                if (stateRef.current.isPlaying) {
                    dispatch({ type: 'REPEAT_INCREMENT' });
                }
            }, 500);
            return;
        }

        if (current.playlistIndex < current.playlistQueue.length - 1) {
            stopAudio();
            setTimeout(() => {
                if (stateRef.current.isPlaying) {
                    dispatch({ type: 'NEXT' });
                }
            }, 800);
            return;
        }

        if (current.playbackMode === 'playlist' && config.playlistLoop) {
            stopAudio();
            setTimeout(() => {
                if (stateRef.current.isPlaying) {
                    dispatch({ type: 'LOOP_BACK' });
                }
            }, 800);
            return;
        }

        // End
        stopAudio();
        dispatch({ type: 'STOP' });
        showToast("Playback Finished");
    }, [showToast, dispatch, displayData, wasPlaylistActiveRef]);

    // Android native event listener
    useEffect(() => {
        const onAndroidAudioEnded = () => {
            if (stateRef.current.isPlaying) {
                handleAudioComplete();
            }
        };

        window.addEventListener('android-audio-ended', onAndroidAudioEnded);
        return () => {
            window.removeEventListener('android-audio-ended', onAndroidAudioEnded);
        };
    }, [handleAudioComplete]);

    // Playback effect
    const isManualMove = useRef(false);

    useEffect(() => {
        if (!state.isPlaying) return;

        let currentId = null;
        if (state.playbackMode === 'playlist' && state.playlistIndex !== -1) {
            currentId = state.playlistQueue[state.playlistIndex];
        } else if (state.playbackMode === 'single') {
            currentId = state.singleId;
        }

        if (!currentId) return;

        const item = vocabList.find(v => v.localId === currentId) || vocabList.find(v => v.id === currentId);

        if (!item) {
            handleAudioComplete();
            return;
        }

        // Update last played row ID
        dispatch({ type: 'UPDATE_LAST_PLAYED', rowId: currentId });

        // Stop previous immediately to ensure silence during transition
        stopAudio();

        const play = () => {
            playJapaneseAudio(item.japanese, () => {
                handleAudioComplete();
            });
        };

        let timer;
        if (isManualMove.current) {
            timer = setTimeout(() => {
                isManualMove.current = false;
                play();
            }, 100);
        } else {
            play();
        }

        return () => {
            clearTimeout(timer);
            stopAudio();
        };
    }, [state.playlistIndex, state.singleId, state.isPlaying, state.playlistRepeatCount, state.singleRepeatCount, state.playbackMode, state.playbackInstanceId, state.playlistQueue, vocabList, handleAudioComplete, dispatch]);

    return { isManualMove };
}
