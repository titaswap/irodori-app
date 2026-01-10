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
    if (window.AndroidNative && window.AndroidNative.stop) {
        window.AndroidNative.stop();
        window._currentAndroidCallback = null;
    }

    // Stop Web TTS
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    window._speechUtteranceHolder = null;
};

export const playJapaneseAudio = (text, onEnd) => {
    // 1. Native Android TTS (Priority #1)
    if (window.AndroidNative && window.AndroidNative.speak) {
        // Store the callback so 'window.androidAudioFinished' can call it later
        window._currentAndroidCallback = onEnd;

        window.AndroidNative.speak(text);
        return;
    }

    // 2. Web TTS Fallback
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    if (!text || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
    }

    // 2. Wrap speak in a small delay to ensure 'cancel' completes signal
    const speak = () => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        u.rate = 1.0;
        u.pitch = 1.0;

        // 🔹 Explicit Japanese voice selection
        const voices = window.speechSynthesis.getVoices();
        const jpVoice = voices.find(v =>
            v.lang === 'ja-JP' &&
            /natural|google|premium|kyoko|otoya/i.test(v.name)
        );

        // ONLY assign voice if we found a good match. 
        // Otherwise let the Android Default Engine (checked in screenshot) handle it.
        // Forcing an incompatible voice object can cause silence.
        if (jpVoice) {
            u.voice = jpVoice;
        }

        // 🔹 GC PROTECTION: Attach to window
        window._speechUtteranceHolder = u;

        u.onend = () => {
            window._speechUtteranceHolder = null;
            if (onEnd) onEnd();
        };

        u.onerror = (e) => {
            console.error("TTS Error", e);
            window._speechUtteranceHolder = null;
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(u);
    };

    // 🔹 Fallback Logic for Voice Loading
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        setTimeout(speak, 10); // Small delay for safety
    } else {
        let handled = false;
        const onVoices = () => {
            if (handled) return;
            handled = true;
            setTimeout(speak, 10);
        };
        window.speechSynthesis.onvoiceschanged = onVoices;

        // Timeout fallback
        setTimeout(() => {
            if (!handled) {
                handled = true;
                setTimeout(speak, 10);
            }
        }, 300);
    }
};
