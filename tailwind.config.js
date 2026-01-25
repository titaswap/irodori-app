/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#6366f1", // More vibrant indigo
                "primary-glow": "#818cf8",
                "bg-deep": "#030712", // Deeper black/navy
                "glass-surface": "rgba(30, 41, 59, 0.4)",
                "glass-border": "rgba(255, 255, 255, 0.08)",
                "text-main": "#f8fafc",
                "text-dim": "#94a3b8",
            },
            fontFamily: {
                display: ["Inter", "Noto Sans JP", "sans-serif"],
                sans: ["Inter", "Noto Sans JP", "sans-serif"],
            },
        },
    },
    plugins: [],
}
