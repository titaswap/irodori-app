/**
 * firebaseConfig.js
 * 
 * RESPONSIBILITY:
 * - Export the Firebase configuration object populated from environment variables.
 * - This file does NOT initialize the app; it just provides the config.
 * 
 * SECURITY:
 * - Uses VITE_ prefixed environment variables.
 * - Do NOT hardcode API keys here.
 */

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
