import { AUDIO_SETTINGS } from '../../audioSettings';

// Global holder to prevent Garbage Collection in Android WebView
// This is a known "magic fix" for Android TTS silence
window._speechUtteranceHolder = null;

// 🔹 Global callback for Android Native Bridge
// This function is executing by Android's 'webView.evaluateJavascript'
// when the native TTS engine finishes speaking.
window.androidAudioFinished = () => {
    // Dispatch a custom event that React components can listen to
    // This decouples the global callback from specific React closures/instances
    const event = new CustomEvent('android-audio-ended');
    window.dispatchEvent(event);

    // Legacy support (optional, can be removed if strictly following event pattern, 
    // but keeping for safety if other parts rely on it temporarily, though plan says decouple)
    // We will prioritizing the Event approach.
    if (window._currentAndroidCallback && !isStopped) {
        // window._currentAndroidCallback(); // Commented out to enforce Event-driven logic
        window._currentAndroidCallback = null;
    }
};

// Module-level flag to prevent retry after manual stop
let isManuallyStopped = false;

// Module-level flag to prevent callback after manual stop
let isStopped = false;

// Module-level playback session counter to prevent ghost callbacks
let playbackSessionId = 0;

export const stopAudio = () => {
    // Set flags to prevent retry and callback after manual stop
    isManuallyStopped = true;
    isStopped = true;
    // Invalidate old playback sessions
    playbackSessionId++;

    // Stop Native Android TTS
    if (window.Android && window.Android.stop) {
        window.Android.stop();
        window._currentAndroidCallback = null;
    } else if (window.AndroidNative && window.AndroidNative.stop) {
        window.AndroidNative.stop();
        window._currentAndroidCallback = null;
    }

    // Stop Web TTS
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    window._speechUtteranceHolder = null;
};

// 🔹 Cached Voice Object
let cachedJpVoice = null;

// Pre-load logic (Non-blocking)
const loadVoice = () => {
    if (cachedJpVoice && !AUDIO_SETTINGS.FORCE_RELOAD_ON_EVERY_CLICK) return;
    try {
        const voices = window.speechSynthesis.getVoices();
        cachedJpVoice = voices.find(v => v.lang === 'ja-JP' && /natural|google|premium|kyoko|otoya/i.test(v.name));
        if (!cachedJpVoice) cachedJpVoice = voices.find(v => v.lang === 'ja-JP');
    } catch (e) {
        console.warn("TTS Voice Load Error", e);
    }
};

// Initialize voice loading roughly
if (window.speechSynthesis && AUDIO_SETTINGS.PRELOAD_VOICE) {
    // Defer initial load to avoid blocking startup
    setTimeout(() => {
        loadVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoice;
        }
    }, 100);
}

export const playJapaneseAudio = (text, onEnd) => {
    if (AUDIO_SETTINGS.YIELD_TO_UI) {
        // yield to main thread so UI updates (button click state) happen first
        setTimeout(() => {
            _playJapaneseAudioInternal(text, onEnd);
        }, 0);
    } else {
        // EXECUTE IMMEDIATELY (Fastest)
        _playJapaneseAudioInternal(text, onEnd);
    }
};

const _playJapaneseAudioInternal = (text, onEnd) => {
    // Increment session for new playback
    playbackSessionId++;

    // 1. Native Android TTS (Priority #1)
    // MATCHING MainActivity.java: webView.addJavascriptInterface(..., "Android")
    if (window.Android && window.Android.speak) {
        // We rely on 'android-audio-ended' event listener in useAudioPlayer hook
        // just triggering speak here is enough.
        window.Android.speak(text);
        return;
    }
    // Fallback for older code referencing AndroidNative
    if (window.AndroidNative && window.AndroidNative.speak) {
        window.AndroidNative.speak(text);
        return;
    }

    // 2. Web TTS
    if (!window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
    }

    // Checking text validity
    if (!text) {
        if (onEnd) onEnd();
        return;
    }

    // Cancel any ongoing speech immediately
    // Wrap in try-catch as cancel can sometimes throw on Android WebView
    try {
        window.speechSynthesis.cancel();
    } catch (e) {
        console.warn("TTS Cancel failed", e);
    }

    const speak = (attempt = 1) => {
        try {
            // Reset flags for new speak attempt
            isManuallyStopped = false;
            isStopped = false;

            const u = new SpeechSynthesisUtterance(text);
            const currentSessionId = playbackSessionId;
            u.lang = 'ja-JP';
            u.rate = 1.0;

            if (!cachedJpVoice || AUDIO_SETTINGS.FORCE_RELOAD_ON_EVERY_CLICK) loadVoice();
            if (cachedJpVoice) u.voice = cachedJpVoice;

            window._speechUtteranceHolder = u;

            u.onstart = () => {
                // Verified start, so error after this is real interruption
                u._hasStarted = true;
            };

            u.onend = () => {
                if (isStopped) return;
                if (currentSessionId !== playbackSessionId) return;
                window._speechUtteranceHolder = null;
                if (onEnd) onEnd();
                isStopped = false;
            };

            u.onerror = (e) => {
                if (e.error === "interrupted") {
                    if (currentSessionId !== playbackSessionId) return;
                    // Treat as manual stop, no error log, no retry
                    window._speechUtteranceHolder = null;
                    if (onEnd) onEnd();
                    return;
                }
                if (currentSessionId !== playbackSessionId) return;
                console.error(`TTS Error (Attempt ${attempt})`, e);
                window._speechUtteranceHolder = null;

                // If error happens immediately (no start) and we haven't retried yet, TRY AGAIN.
                // This fixes the "first click failure" on many browsers.
                if (!u._hasStarted && attempt <= 2 && !isManuallyStopped) {
                    console.log("Retrying TTS...");
                    setTimeout(() => speak(attempt + 1), 50);
                } else {
                    if (onEnd) onEnd();
                }
            };
            window.speechSynthesis.speak(u);
        } catch (e) {
            console.error("TTS Speak Error", e);
            if (attempt <= 2 && !isManuallyStopped) {
                setTimeout(() => speak(attempt + 1), 50);
            } else {
                if (onEnd) onEnd();
            }
        }
    };

    // Execute immediately
    const voices = window.speechSynthesis.getVoices();
    if ((cachedJpVoice && !AUDIO_SETTINGS.FORCE_RELOAD_ON_EVERY_CLICK) || voices.length > 0) {
        speak();
    } else {
        // Fallback if voices missing
        const onVoices = () => {
            loadVoice();
            speak();
            window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoices);
        setTimeout(() => {
            if (window._speechUtteranceHolder !== null) return;
            speak();
        }, AUDIO_SETTINGS.FALLBACK_TIMEOUT_MS);
    }
};
