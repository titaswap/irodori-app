import React, { useState, useEffect } from 'react';
import VocabularyView from './VocabularyView';
import UpdateNotification from './components/UpdateNotification';
import { mapToApp } from './utils/vocabularyUtils';
import { fetchAllProgress } from './services/firestore/activityService';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXyfE5aiGFaLh9MfX_4oxHLS9J_I6K8pyoHgUmJQZDmbqECS19Q8lGsOUxBFADWthh_Q/exec';

const INITIAL_FOLDERS = [
  // Folders will be generated dynamically
];

function App() {
  const [vocabList, setVocabList] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Define API Service wrapper
  const apiService = {
    // Send new items to Sheet
    sendAdd: async (newItems) => {
        // Prepare payload: array of objects matching sheet headers roughly
        const payload = {
            action: 'add',
            items: newItems.map(item => ({
                hiragana: item.japanese,
                kanji: item.kanji,
                bangla: item.bangla,
                lesson: item.lesson,
                cando: item.cando,
                is_problem: item.isMarked,
                mistake_count: item.mistakes,
                confidence: item.confidence,
                last_practiced: item.lastPracticed
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
    if (!silent && vocabList.length === 0) setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
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
                       // item.mistakes = local.mistakes; // REMOVED
                       // item.confidence = local.confidence; // REMOVED
                       // item.lastPracticed = local.lastPracticed; // REMOVED
                   }
               });
           } catch(e) { console.error("Merge error", e); }
        }

        // Phase 8.2: Overlay Firestore Progress
        try {
            const firestoreProgress = await fetchAllProgress();
            if (firestoreProgress && Object.keys(firestoreProgress).length > 0) {
                 mappedData.forEach(item => {
                     // We match by REAL ID (item.id), not localId
                     if (item.id && firestoreProgress[item.id]) {
                         const p = firestoreProgress[item.id];
                         // Overwrite only if defined in Firestore
                         if (p.isMarked !== undefined) item.isMarked = p.isMarked;
                         // if (p.mistakes !== undefined) item.mistakes = p.mistakes; // REMOVED
                         // if (p.confidence !== undefined) item.confidence = p.confidence; // REMOVED
                         // if (p.lastPracticed !== undefined) item.lastPracticed = p.lastPracticed; // REMOVED
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
      console.error("Fetch error:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Load from LocalStorage on mount AND fetch fresh data
  useEffect(() => {
    const saved = localStorage.getItem('vocabList');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVocabList(parsed);
        setIsLoading(false);
        
        // Generate folders from saved data immediately
        const uniqueBooks = [...new Set(parsed.map(item => item.book))].filter(b => b);
        const savedFolders = uniqueBooks.map(bookName => ({
            id: bookName,
            name: bookName,
            parentId: 'root'
        }));
        setFolders(savedFolders);
        
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    // Always fetch latest data (silently if we have local data)
    fetchSheetData(!!saved);
  }, []);

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
          document.removeEventListener('touchstart', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
      };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1e1e1e]">
        <UpdateNotification />
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
        />
    </div>
  );
}

export default App;
