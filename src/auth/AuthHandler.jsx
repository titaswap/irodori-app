import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import {
    getRedirectResult,
    signInWithRedirect,
    GoogleAuthProvider,
    signInWithCredential
} from "firebase/auth";

const provider = new GoogleAuthProvider();

/**
 * Handles the "Token Passing" flow between Chrome and WebView.
 * 
 * Routes:
 * - /login-start:  Running in Chrome. Initiates Login -> Redirects to Google -> Returns -> Redirects to /login-finish
 * - /login-finish: Running in WebView. Consumes Token -> Logs in.
 */
export default function AuthHandler({ onLoginSuccess }) {
    const [status, setStatus] = useState('Checking authentication...');
    const path = window.location.pathname;

    useEffect(() => {
        const handleAuth = async () => {
            // CASE 1: LOGIN START (Run in Chrome)
            if (path.startsWith('/login-start')) {
                setStatus('Initializing secure login via Browser...');

                try {
                    // Check if we just came back from Google
                    const result = await getRedirectResult(auth);

                    if (result) {
                        // Success! We are in Chrome, and we have the user.
                        // Now we pass the token back to the App.
                        setStatus('Login successful! Returning to App...');
                        const token = await result.user.getIdToken();

                        // DEEP LINK redirection
                        // This URL is intercepted by AndroidManifest
                        window.location.href = `https://japanese-learning-app-fcb27.web.app/login-finish?token=${token}`;
                    } else {
                        // We just arrived at /login-start. Triger the flow.
                        console.log("Starting Redirect Flow in Chrome...");
                        await signInWithRedirect(auth, provider);
                    }
                } catch (error) {
                    console.error("Login Start Error:", error);
                    setStatus(`Error: ${error.message}`);
                    // Optionally redirect back to root after a delay
                    setTimeout(() => window.location.href = "/", 3000);
                }
            }

            // CASE 2: LOGIN FINISH (Run in WebView)
            else if (path.startsWith('/login-finish')) {
                setStatus('Finalizing login in App...');

                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');

                if (token) {
                    try {
                        const credential = GoogleAuthProvider.credential(token);
                        await signInWithCredential(auth, credential);
                        console.log("WebView Hydration Complete");
                        // Success! App.jsx auth listener will take over.
                        // Clean URL
                        window.history.replaceState({}, document.title, "/");
                        if (onLoginSuccess) onLoginSuccess();
                    } catch (error) {
                        console.error("Hydration Error:", error);
                        setStatus(`App Login Failed: ${error.message}`);
                    }
                } else {
                    setStatus("Error: No token received.");
                }
            }
        };

        handleAuth();
    }, [path]);

    // Only render UI if we are in one of these special routes
    if (!path.startsWith('/login-start') && !path.startsWith('/login-finish')) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 text-white flex-col p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Secure Login</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p>{status}</p>
        </div>
    );
}
