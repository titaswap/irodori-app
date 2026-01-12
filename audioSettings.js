export const AUDIO_SETTINGS = {
    /**
     * YIELD_TO_UI:
     * - true: (Default) Button click animation er jonno ektu wait korbe (~1 frame). ETA SAFETY ER JONNO VALO.
     * - false: Click korar sathe sathe audio play hobe. Button click freeze hote pare kintu audio FAST hobe.
     * FAST CHAILE ETA 'false' KORE DIN.
     */
    YIELD_TO_UI: false,

    /**
     * PRELOAD_VOICE:
     * - true: App start howar sathe sathe Japanese voice load kore rakhbe.
     * - false: Click korar por voice khujbe (Prothom bar slow hote pare).
     */
    PRELOAD_VOICE: true,

    /**
     * FORCE_RELOAD_ON_EVERY_CLICK:
     * - true: Proti click e notun kore voice khujbe (Slow, kintu safe).
     * - false: Cached voice use korbe (Sobcheye FAST).
     */
    FORCE_RELOAD_ON_EVERY_CLICK: false,

    /**
     * FALLBACK_TIMEOUT_MS:
     * Jodi Japanese voice na pawa jay, koto khon wait korbe?
     * Kom (50ms) hole fast fallback hobe. Beshi hole deri hobe.
     */
    FALLBACK_TIMEOUT_MS: 50
};
