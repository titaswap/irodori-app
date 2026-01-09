/**
 * firestoreClient.js
 * 
 * RESPONSIBILITY:
 * - Initialize Firebase App and Firestore SDK.
 * - Export the Firestore database instance for use by other services.
 * - Handle authentication state if needed in the future.
 * 
 * CURRENT STATUS:
 * - Placeholder only. No Firebase SDK is imported yet.
 * - Firestore is NOT active.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

let db = null;
let app = null;

export const initFirestore = () => {
    // Prevent multiple initializations
    if (getApps().length > 0) {
        app = getApp();
        db = getFirestore(app);
        console.log("[Firestore] existing app found", app);
        return db;
    }

    // Only initialize if config is present (basic check)
    if (!firebaseConfig.apiKey) {
        console.warn("[Firestore] Missing API Key. Skipping initialization.");
        return null;
    }

    try {
        console.log("[Firestore] Initializing Firebase App...");
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("[Firestore] Initialization successful.");
    } catch (e) {
        console.error("[Firestore] Initialization failed", e);
    }
    return db;
};

export const getDb = () => {
    if (!db) {
        // Auto-init if accessed? Or just warn?
        // Let's try to init if we can, useful for lazy loading.
        if (!app) return initFirestore();

        console.warn("[Firestore] Database not initialized was null, and init failed.");
    }
    return db;
};

