/**
 * userService.js
 * 
 * RESPONSIBILITY:
 * - Provide a central way to get the current user's ID.
 * - Currently returns a hardcoded "demoUser".
 * - In the future, this will link to Firebase Auth or another identity provider.
 */

// Placeholder constant for Phase 7
const DEMO_USER_ID = 'demoUser1';

/**
 * Get the current user's ID.
 * @returns {string} The user ID.
 */
export const getUserId = () => {
    // Future: return firebase.auth().currentUser.uid;
    return DEMO_USER_ID;
};
