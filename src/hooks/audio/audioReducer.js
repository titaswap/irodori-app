/**
 * Audio Player State Reducer
 * Manages audio playback state transitions
 */

export const initialState = {
    playbackMode: 'idle', // 'idle', 'playlist', 'single'
    isPlaying: false,
    // Playlist Context
    playlistQueue: [],
    playlistIndex: -1,
    playlistRepeatCount: 0,
    // Single Context
    singleId: null,
    singleRepeatCount: 0,
    // Last Played Row (for keeping highlight after audio ends)
    lastPlayedRowId: null,
};

export function audioReducer(state, action) {
    switch (action.type) {
        case 'START_PLAYLIST':
            return {
                ...state,
                playbackMode: 'playlist',
                isPlaying: true,
                playlistQueue: action.queue,
                playlistIndex: action.startIndex ?? (state.playlistIndex >= 0 ? state.playlistIndex : 0),
                playlistRepeatCount: 0,
                singleId: null // Clear single if starting playlist
            };
        case 'PLAY_SINGLE':
            return {
                ...state,
                playbackMode: 'single',
                isPlaying: action.shouldPlay ?? true,
                singleId: action.id,
                singleRepeatCount: 0, // Explicitly reset repeat count
                playbackInstanceId: (action.shouldPlay ?? true) ? Date.now() : state.playbackInstanceId, // Only trigger effect if playing
                // Do NOT reset playlist fields (preserved for context resume)
            };
        case 'STOP':
            return {
                ...initialState,
                lastPlayedRowId: state.lastPlayedRowId, // Preserve last played row
                playlistQueue: state.playlistQueue, // Preserve playlist queue
                playlistIndex: state.playlistIndex // Preserve playlist position
            };
        case 'REPEAT_INCREMENT_SINGLE':
            return { ...state, singleRepeatCount: state.singleRepeatCount + 1 };
        case 'PAUSE':
            return { ...state, isPlaying: false };
        case 'PAUSE_SINGLE':
            // Pause single audio but KEEP mode as 'single' so bar stays visible (YouTube-like)
            return { ...state, isPlaying: false };
        case 'RESUME':
            // Smart resume: If playlist state exists, resume in playlist mode
            if (state.playlistQueue.length > 0 && state.playlistIndex >= 0) {
                return { ...state, isPlaying: true, playbackMode: 'playlist' };
            }
            // Otherwise, just resume current mode
            return { ...state, isPlaying: true };
        case 'NEXT':
            if (state.playlistIndex < state.playlistQueue.length - 1) {
                return { ...state, playlistIndex: state.playlistIndex + 1, playlistRepeatCount: 0 };
            }
            return state;
        case 'PREV':
            if (state.playlistIndex > 0) {
                return { ...state, playlistIndex: state.playlistIndex - 1, playlistRepeatCount: 0 };
            }
            return state;
        case 'REPEAT_INCREMENT':
            return { ...state, playlistRepeatCount: state.playlistRepeatCount + 1 };
        case 'LOOP_BACK':
            return { ...state, playlistIndex: 0, playlistRepeatCount: 0 };
        case 'UPDATE_LAST_PLAYED':
            return { ...state, lastPlayedRowId: action.rowId };
        default:
            return state;
    }
}
