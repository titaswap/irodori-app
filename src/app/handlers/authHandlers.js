/**
 * Authentication Handlers
 * Email/password auth and user profile management
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../../firebase';

export async function handleEmailAuth(e, {
    email,
    password,
    firstName,
    isSignup,
    setAuthError,
    setIsAuthSubmitting,
    auth
}) {
    e.preventDefault();
    setAuthError("");
    setIsAuthSubmitting(true);

    try {
        const {
            createUserWithEmailAndPassword,
            signInWithEmailAndPassword,
            updateProfile
        } = await import("firebase/auth");

        if (isSignup) {
            if (!firstName.trim()) throw new Error("First Name is required.");

            // 1. Create User
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            // 2. Update Auth Profile
            await updateProfile(userCred.user, {
                displayName: firstName
            });

            // 3. Force Firestore Update
            const userRef = doc(db, "users", userCred.user.uid);
            await setDoc(userRef, {
                displayName: firstName,
                email: email,
                uid: userCred.user.uid,
                provider: "password",
                deviceType: "android",
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            }, { merge: true });

        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        console.error(error);
        setAuthError(error.message.replace("Firebase: ", ""));
    } finally {
        setIsAuthSubmitting(false);
    }
}

export async function ensureUserProfile(firebaseUser) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    const isAndroid = !!window.Android;

    const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        provider: "google",
        lastLoginAt: serverTimestamp(),
        deviceType: isAndroid ? "android" : "web",
        appVersion: __APP_VERSION__
    };

    if (!userSnap.exists()) {
        try {
            await setDoc(userRef, {
                ...userData,
                firstLoginAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            console.log("User profile created for", firebaseUser.uid);
        } catch (error) {
            console.error("Error creating user profile:", error);
        }
    } else {
        try {
            await setDoc(userRef, userData, { merge: true });
            console.log("User profile updated for", firebaseUser.uid);
        } catch (error) {
            console.error("Error updating user profile:", error);
        }
    }
}

export async function handleNativeLoginSuccess(idToken, auth) {
    console.log("Native Token Received. Length:", idToken ? idToken.length : 0);
    try {
        const { GoogleAuthProvider, signInWithCredential } = await import("firebase/auth");
        const credential = GoogleAuthProvider.credential(idToken);
        console.log("Signing in with Credential...");
        const userCred = await signInWithCredential(auth, credential);
        console.log("Firebase Auth SUCCESS. User:", userCred.user.uid);
    } catch (error) {
        console.error("Firebase Auth FAILED:", error);
        alert("Auth Error: " + error.code + " - " + error.message);
    }
}

export function handleNativeLoginError(errorMsg) {
    console.error("Native Login Error from Java:", errorMsg);
    alert("Login Failed: " + errorMsg);
}
