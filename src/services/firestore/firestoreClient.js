/**
 * firestoreClient.js
 * 
 * RESPONSIBILITY:
 * - Export the Singleton Firestore database instance.
 * - NO Initialization here.
 */

import { db } from "../../firebase";

export const getDb = () => {
    return db;
};

// Kept for backward compatibility if needed, but basically a no-op wrapper now
export const initFirestore = () => {
    return db;
};

