import React, { useState, useEffect } from 'react';
import VocabularyView, { mapToApp } from './VocabularyView';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXyfE5aiGFaLh9MfX_4oxHLS9J_I6K8pyoHgUmJQZDmbqECS19Q8lGsOUxBFADWthh_Q/exec';

const INITIAL_FOLDERS = [
  { id: 'f1', name: 'Irodori Book 1', parentId: 'root' },
  { id: 'f2', name: 'Exam Prep', parentId: 'root' },
];

function App() {
  const [vocabList, setVocabList] = useState([]);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
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
      const data = Array.isArray(json) ? json : json.data;
      
      if (Array.isArray(data)) {
        const mappedData = data.map((row, index) => mapToApp(row, index));
        
        // Restore local marks to prevent overwriting with stale server data
        const saved = localStorage.getItem('vocabList');
        if (saved) {
           try {
               const localMap = new Map(JSON.parse(saved).map(i => [i.localId, i]));
               mappedData.forEach(item => {
                   const local = localMap.get(item.localId);
                   // Preserve isMarked and confidence if local version exists
                   if (local) {
                       item.isMarked = local.isMarked;
                       item.mistakes = local.mistakes;
                       item.confidence = local.confidence;
                       item.lastPracticed = local.lastPracticed;
                   }
               });
           } catch(e) { console.error("Merge error", e); }
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
        setVocabList(JSON.parse(saved));
        setIsLoading(false);
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

  return (
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
  );
}

export default App;
