/**
 * userService.js
 * 
 * RESPONSIBILITY:
 * - Provide a central way to get the current user's ID.
 * - Links strictly to Firebase Auth.
 */

import { auth } from "../firebase";

/**
 * Get the current user's ID.
 * @returns {string|null} The user ID or null if not logged in.
 */
export const getUserId = () => {
    return auth.currentUser ? auth.currentUser.uid : null;
};
