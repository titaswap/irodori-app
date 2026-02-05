/**
 * Data Fetching Service
 * Handles Google Sheets data fetching and local storage
 */

import { mapToApp } from '../../utils/vocabularyUtils';
import { fetchAllProgress } from '../../services/firestore/activityService';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXyfE5aiGFaLh9MfX_4oxHLS9J_I6K8pyoHgUmJQZDmbqECS19Q8lGsOUxBFADWthh_Q/exec';

export function loadLocalData(setVocabList, setFolders, setIsLoading) {
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

                setIsLoading(false);
                return true;
            }
        } catch (e) {
            console.error("Failed to parse saved data", e);
        }
    }
    return false;
}

export async function fetchSheetData(silent, vocabList, setIsLoading, setVocabList, setFolders) {
    if (!silent && vocabList.length === 0) setIsLoading(true);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(GOOGLE_SCRIPT_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');

        const json = await response.json();
        let rawData = [];

        // Handle new script response: { "Sheet1": [...], "Sheet2": [...] }
        if (typeof json === 'object' && !Array.isArray(json) && !json.data) {
            Object.keys(json).forEach(sheetName => {
                if (Array.isArray(json[sheetName])) {
                    json[sheetName].forEach(row => {
                        rawData.push({ ...row, book: sheetName });
                    });
                }
            });
        } else {
            rawData = Array.isArray(json) ? json : (json.data || []);
        }

        if (rawData.length > 0) {
            const mappedData = rawData.map((row, index) => mapToApp(row, index));

            // Dynamic folder generation
            const uniqueBooks = [...new Set(mappedData.map(item => item.book))].filter(b => b);
            const dynamicFolders = uniqueBooks.map(bookName => ({
                id: bookName,
                name: bookName,
                parentId: 'root'
            }));

            setFolders(dynamicFolders);

            // Restore local marks
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

            // Overlay Firestore progress with timeout protection
            try {
                const progressPromise = fetchAllProgress();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Firestore timeout')), 3000)
                );

                const firestoreProgress = await Promise.race([progressPromise, timeoutPromise]);

                if (firestoreProgress && Object.keys(firestoreProgress).length > 0) {
                    mappedData.forEach(item => {
                        if (item.id && firestoreProgress[item.id]) {
                            const p = firestoreProgress[item.id];
                            if (p.isMarked !== undefined) item.isMarked = p.isMarked;
                            // Tags are now snapshot objects {id, name} for instant display
                            // No resolution needed - use directly from Firestore
                            if (p.tags !== undefined) item.tags = Array.isArray(p.tags) ? p.tags : [];
                        }
                    });
                    console.log("[App] Merged Firestore progress into vocabList");
                }
            } catch (e) {
                console.warn("[App] Firestore progress skipped (offline/timeout):", e.message);
            }

            setVocabList(mappedData);
        } else {
            console.error("Unexpected data format:", json);
        }
    } catch (error) {
        console.warn("Fetch skipped or failed (offline/timeout):", error);
    } finally {
        setIsLoading(false);
    }
}

export const createApiService = () => ({
    sendAdd: async (newItems) => {
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

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    sendUpdate: async (updates) => {
        const payload = {
            action: 'update',
            updates: updates
        };
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
});
