import { AUDIO_SETTINGS } from '../../audioSettings';

// Global holder to prevent Garbage Collection in Android WebView
// This is a known "magic fix" for Android TTS silence
window._speechUtteranceHolder = null;

// 🔹 Global callback for Android Native Bridge
// This function is executing by Android's 'webView.evaluateJavascript'
// when the native TTS engine finishes speaking.
window.androidAudioFinished = () => {
    // This will be overridden by the current playback 'onEnd'
    if (window._currentAndroidCallback) {
        window._currentAndroidCallback();
        window._currentAndroidCallback = null;
    }
};

export const stopAudio = () => {
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
    // 1. Native Android TTS (Priority #1)
    // MATCHING MainActivity.java: webView.addJavascriptInterface(..., "Android")
    if (window.Android && window.Android.speak) {
        window._currentAndroidCallback = onEnd;
        window.Android.speak(text);
        return;
    }
    // Fallback for older code referencing AndroidNative
    if (window.AndroidNative && window.AndroidNative.speak) {
        window._currentAndroidCallback = onEnd;
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
            const u = new SpeechSynthesisUtterance(text);
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
                window._speechUtteranceHolder = null;
                if (onEnd) onEnd();
            };

            u.onerror = (e) => {
                console.error(`TTS Error (Attempt ${attempt})`, e);
                window._speechUtteranceHolder = null;

                // If error happens immediately (no start) and we haven't retried yet, TRY AGAIN.
                // This fixes the "first click failure" on many browsers.
                if (!u._hasStarted && attempt <= 2) {
                    console.log("Retrying TTS...");
                    setTimeout(() => speak(attempt + 1), 50);
                } else {
                    if (onEnd) onEnd();
                }
            };
            window.speechSynthesis.speak(u);
        } catch (e) {
            console.error("TTS Speak Error", e);
            if (attempt <= 2) {
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
