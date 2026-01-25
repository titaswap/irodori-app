import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { auth, db } from './firebase'; // Singleton imports
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import VocabularyView from './VocabularyView';
import UpdateNotification from './components/UpdateNotification';
import { mapToApp } from './utils/vocabularyUtils';
import { fetchAllProgress } from './services/firestore/activityService';
import { googleLogin } from "./auth/googleLogin";
import { uiConfig } from './config/uiConfig';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXyfE5aiGFaLh9MfX_4oxHLS9J_I6K8pyoHgUmJQZDmbqECS19Q8lGsOUxBFADWthh_Q/exec';

const INITIAL_FOLDERS = [];

function App() {
    // Auth State
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Detect Platform (Global Scope for Render)
    // STRICT CHECK as requested
    const isAndroid = typeof window !== "undefined" && !!window.Android;

    const [vocabList, setVocabList] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Email/Pass State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState(""); // New: First Name
    const [isSignup, setIsSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // New: Password Toggle
    const [authError, setAuthError] = useState("");
    const [isAuthSubmitting, setIsAuthSubmitting] = useState(false); // New: Loading State

    const handleEmailAuth = async (e) => {
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

                // 3. Force Firestore Update (to ensure name is saved immediately)
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
    };

    // Profile Management
    const ensureUserProfile = async (firebaseUser) => {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        // Detect Platform
        // "Android" is the bridge name defined in MainActivity.java
        const isAndroid = !!window.Android;

        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: "google",
            lastLoginAt: serverTimestamp(),
            deviceType: isAndroid ? "android" : "web",
            appVersion: __APP_VERSION__ // Defined in vite.config.js
        };

        if (!userSnap.exists()) {
            try {
                // New User: Create with firstLoginAt
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
            // Existing User: Update (Merge) - preserves firstLoginAt and custom data
            try {
                await setDoc(userRef, userData, { merge: true });
                console.log("User profile updated for", firebaseUser.uid);
            } catch (error) {
                console.error("Error updating user profile:", error);
            }
        }
    };

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Logged In
                setUser(currentUser);

                // CRITICAL: Fire-and-forget user profile check to prevent blocking offline startup
                ensureUserProfile(currentUser).catch(err => console.warn("Profile sync skipped (offline):", err));

                // 1. Try to load local data INSTANTLY
                const hasLocalData = loadLocalData();

                // 2. Fetch fresh data in background (silent if we have local data, blocking only if completely empty)
                fetchSheetData(hasLocalData);
            } else {
                // Logged Out
                setUser(null);
                setVocabList([]); // Clear sensitive data
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper: Load from LocalStorage
    const loadLocalData = () => {
        const saved = localStorage.getItem('vocabList');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setVocabList(parsed);

                    // Generate folders immediately
                    const uniqueBooks = [...new Set(parsed.map(item => item.book))].filter(b => b);
                    const savedFolders = uniqueBooks.map(bookName => ({
                        id: bookName,
                        name: bookName,
                        parentId: 'root'
                    }));
                    setFolders(savedFolders);

                    setIsLoading(false); // Unblock UI immediately
                    return true;
                }
            } catch (e) {
                console.error("Failed to parse saved data", e);
            }
        }
        return false;
    };

    const apiService = {
        // Send new items to Sheet
        sendAdd: async (newItems) => {
            // Prepare payload: array of objects matching sheet headers roughly
            const payload = {
                action: 'add',
                items: newItems.map(item => ({
                    hiragana: item.japanese,
                    bangla: item.bangla,
                    lesson: item.lesson,
                    cando: item.cando,
                    is_problem: item.isMarked,
                }))
            };

            // Use no-cors? No, we likely want response. But if CORS fails, we can try with 'no-cors' but we won't get response.
            // Assuming the script handles CORS (it should if set to "Anyone").
            // Usually POST requires simple text/plain to avoid preflight if script not handling OPTIONS.
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
                // Note: omitting Content-Type 'application/json' sometimes helps with simple requests if script reads postData.contents
                // But let's try standard first.
            });
        },

        // Send updates for existing items
        sendUpdate: async (updates) => {
            const payload = {
                action: 'update',
                updates: updates // Array of objects with id and fields to update
            };
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
    };



    const fetchSheetData = async (silent = false) => {
        // If not silent (meaning no local data), show loader.
        if (!silent && vocabList.length === 0) setIsLoading(true);

        try {
            // Set timeout for fetch to prevent infinite hanging on slow connections
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(GOOGLE_SCRIPT_URL, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Network response was not ok');

            const json = await response.json();

            let rawData = [];

            // HANDLE NEW SCRIPT RESPONSE: { "Sheet1": [...], "Sheet2": [...] }
            if (typeof json === 'object' && !Array.isArray(json) && !json.data) {
                Object.keys(json).forEach(sheetName => {
                    if (Array.isArray(json[sheetName])) {
                        json[sheetName].forEach(row => {
                            // Inject 'book' property from the key
                            rawData.push({ ...row, book: sheetName });
                        });
                    }
                });
            } else {
                // Fallback for legacy or flat list format
                rawData = Array.isArray(json) ? json : (json.data || []);
            }

            if (rawData.length > 0) {
                const mappedData = rawData.map((row, index) => mapToApp(row, index));

                // --- DYNAMIC FOLDER GENERATION ---
                const uniqueBooks = [...new Set(mappedData.map(item => item.book))].filter(b => b);
                const dynamicFolders = uniqueBooks.map(bookName => ({
                    id: bookName, // Use book name as ID for simplicity
                    name: bookName,
                    parentId: 'root'
                }));

                setFolders(dynamicFolders);
                // --------------------------------

                // Restore local marks (Legacy LocalStorage)
                const saved = localStorage.getItem('vocabList');
                if (saved) {
                    try {
                        const localMap = new Map(JSON.parse(saved).map(i => [i.localId, i]));
                        mappedData.forEach(item => {
                            const local = localMap.get(item.localId);
                            if (local) {
                                item.isMarked = local.isMarked;
                            }
                        });
                    } catch (e) { console.error("Merge error", e); }
                }

                // Phase 8.2: Overlay Firestore Progress
                // Run in background, don't block render if possible (though we are in async)
                try {
                    const firestoreProgress = await fetchAllProgress();
                    if (firestoreProgress && Object.keys(firestoreProgress).length > 0) {
                        mappedData.forEach(item => {
                            // We match by REAL ID (item.id), not localId
                            if (item.id && firestoreProgress[item.id]) {
                                const p = firestoreProgress[item.id];
                                // Overwrite only if defined in Firestore
                                if (p.isMarked !== undefined) item.isMarked = p.isMarked;
                            }
                        });
                        console.log("[App] Merged Firestore progress into vocabList");
                    }
                } catch (e) {
                    console.error("[App] Failed to merge Firestore progress", e);
                }

                setVocabList(mappedData);
            } else {
                console.error("Unexpected data format:", json);
            }
        } catch (error) {
            console.warn("Fetch skipped or failed (offline/timeout):", error);
            // If we are in silent mode (have local data), this is fine.
            // If we are NOT in silent mode, we might be stuck loading?
            // Ensure we stop loading state.
        } finally {
            setIsLoading(false);
        }
    };

    // Save to LocalStorage whenever list changes
    useEffect(() => {
        if (vocabList.length > 0) {
            localStorage.setItem('vocabList', JSON.stringify(vocabList));
        }
    }, [vocabList]);

    // Audio Unlock for Android WebView
    useEffect(() => {
        const unlockAudio = () => {
            // 1. Resume AudioContext if it exists (Web Audio API)
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') {
                    ctx.resume().then(() => console.log('AudioContext resumed'));
                }
                // Play silent buffer to force-wake audio thread
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            }

            // 2. Wake up SpeechSynthesis (Android quirks)
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            console.log('Audio subsystem unlocked via user interaction');

            // Remove listeners once unlocked
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);






    // Listen for Native Login Success (Android)
    useEffect(() => {
        // Signal Native Android that Web is Ready (Handshake)
        if (window.Android && window.Android.onWebReady) {
            console.log("Sending onWebReady signal to Native...");
            window.Android.onWebReady();
        }

        window.onNativeLoginSuccess = async (idToken) => {
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
        };

        window.onNativeLoginError = (errorMsg) => {
            console.error("Native Login Error from Java:", errorMsg);
            alert("Login Failed: " + errorMsg);
        }

        return () => {
            // Cleanup if needed
        };
    }, []);


    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#030712] text-white selection:bg-indigo-500/30">
            {/* Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full -z-10"></div>
                <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full -z-10"></div>
            </div>

            <UpdateNotification />

            {authLoading ? (
                <div className="flex h-screen w-screen items-center justify-center text-white">
                    Loading IrodoriAI...
                </div>
            ) : !user ? (
                <div className="flex h-screen w-screen items-center justify-center bg-gray-900 flex-col gap-4">
                    <h1 className="text-2xl text-white font-bold">Welcome to IrodoriAI</h1>

                    {!isAndroid && (
                        <div className="flex flex-col gap-6 w-full max-w-sm">
                            {/* DESKTOP: Google Login */}
                            <button
                                onClick={async () => {
                                    try {
                                        await googleLogin();
                                    } catch (e) {
                                        console.error(e);
                                        alert("Login Error: " + e.message);
                                    }
                                }}
                                className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 shadow-md transition-all transform hover:scale-105"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                                    <path fill="#EA4335" d="M12 4.66c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Sign in with Google</span>
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center justify-center w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-600"></div>
                                </div>
                                <span className="relative z-10 bg-gray-900 px-4 text-gray-400 text-sm font-medium">
                                    OR
                                </span>
                            </div>

                            {/* Email/Password Form (Desktop) */}
                            <form onSubmit={handleEmailAuth} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col gap-4">
                                <h2 className="text-xl text-white font-semibold text-center">
                                    {isSignup ? "Create Account" : "Sign In with Email"}
                                </h2>

                                {authError && (
                                    <div className="bg-red-500/20 text-red-200 p-2 rounded text-sm text-center border border-red-500/50">
                                        {authError}
                                    </div>
                                )}

                                {isSignup && (
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                )}

                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isAuthSubmitting}
                                    className={`font-bold py-3 px-4 rounded transition-colors ${isAuthSubmitting
                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-500 text-white"
                                        }`}
                                >
                                    {isAuthSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {isSignup ? "Creating account..." : "Signing in..."}
                                        </span>
                                    ) : (
                                        isSignup ? "Sign Up" : "Login"
                                    )}
                                </button>

                                <div className="text-center mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSignup(!isSignup);
                                            setAuthError("");
                                        }}
                                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                                    >
                                        {isSignup ? "Already have an account? Login" : "Need an account? Sign Up"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {isAndroid && (
                        /* MOBILE (Android): Email/Password Form ONLY */
                        <form onSubmit={handleEmailAuth} className="w-full max-w-sm bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col gap-4 border-2 border-green-500">
                            {/* MANDATORY VERIFICATION LABEL */}
                            <div className="bg-green-900 text-green-100 text-xs font-bold p-2 text-center uppercase tracking-widest mb-2 rounded">
                                ANDROID EMAIL LOGIN ACTIVE
                            </div>

                            <h2 className="text-xl text-white font-semibold text-center">
                                {isSignup ? "Create Account" : "Sign In"}
                            </h2>

                            {authError && (
                                <div className="bg-red-500/20 text-red-200 p-2 rounded text-sm text-center border border-red-500/50">
                                    {authError}
                                </div>
                            )}

                            {isSignup && (
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            )}

                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isAuthSubmitting}
                                className={`font-bold py-3 px-4 rounded transition-colors ${isAuthSubmitting
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-500 text-white"
                                    }`}
                            >
                                {isAuthSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isSignup ? "Creating account..." : "Signing in..."}
                                    </span>
                                ) : (
                                    isSignup ? "Sign Up" : "Login"
                                )}
                            </button>

                            <div className="text-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignup(!isSignup);
                                        setAuthError(""); // Clear errors on toggle
                                    }}
                                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                                >
                                    {isSignup ? "Already have an account? Login" : "Need an account? Sign Up"}
                                </button>
                            </div>
                        </form>
                    )}
                    {/* Fallback for WebView if popup blocked? Usually works with Chrome Custom Tabs */}
                </div>
            ) : (
                <VocabularyView
                    vocabList={vocabList}
                    setVocabList={setVocabList}
                    folders={folders}
                    setFolders={setFolders}
                    currentFolderId={currentFolderId}
                    setCurrentFolderId={setCurrentFolderId}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    isSyncing={isSyncing}
                    setIsSyncing={setIsSyncing}
                    apiService={apiService}
                    fetchSheetData={fetchSheetData}
                    user={user}
                />
            )}
        </div>
    );
}

export default App;
