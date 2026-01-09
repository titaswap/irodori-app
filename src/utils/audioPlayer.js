let currentUtterance = null;

export const stopAudio = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    currentUtterance = null;
};

export const playJapaneseAudio = (text, onEnd) => {
    stopAudio();

    if (!text || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
    }

    const speak = () => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        u.rate = 1.0;
        u.pitch = 1.1;

        // 🔹 Explicit Japanese voice selection
        const voices = window.speechSynthesis.getVoices();
        const jpVoice = voices.find(v =>
            v.lang === 'ja-JP' &&
            /natural|google|premium|kyoko|otoya/i.test(v.name)
        );

        if (jpVoice) u.voice = jpVoice;

        currentUtterance = u;

        u.onend = () => {
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        u.onerror = (e) => {
            console.error("Browser TTS Error", e);
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(u);
    };

    // 🔹 Chrome mobile safety
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
    } else {
        setTimeout(speak, 50);
    }
};
