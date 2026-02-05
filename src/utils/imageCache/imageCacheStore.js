/**
 * imageCacheStore.js
 * 
 * Abstract storage layer for cached images.
 * Uses IndexedDB for Web and can be extended for Capacitor Filesystem.
 * 
 * NO fetch() calls - stores data URLs from Canvas-converted images.
 */

const DB_NAME = 'KanjiImageCache';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/**
 * Open IndexedDB connection
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

/**
 * Get cached image data URL from IndexedDB
 * 
 * @param {string} url - Original image URL
 * @returns {Promise<string|null>} Data URL or null
 */
export async function getCachedImage(url) {
    try {
        const db = await openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(url);

            request.onerror = () => reject(new Error('Failed to get cached image'));
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.dataUrl : null);
            };
        });
    } catch (error) {
        console.error('Error getting cached image:', error);
        return null;
    }
}

/**
 * Save image data URL to IndexedDB
 * 
 * @param {string} url - Original image URL
 * @param {string} dataUrl - Data URL from Canvas
 * @returns {Promise<boolean>} Success status
 */
export async function saveCachedImage(url, dataUrl) {
    try {
        const db = await openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            const imageData = {
                url: url,
                dataUrl: dataUrl,
                timestamp: Date.now()
            };

            const request = objectStore.put(imageData);

            request.onerror = () => reject(new Error('Failed to save cached image'));
            request.onsuccess = () => resolve(true);
        });
    } catch (error) {
        console.error('Error saving cached image:', error);
        return false;
    }
}

/**
 * Clear all cached images
 * 
 * @returns {Promise<boolean>} Success status
 */
export async function clearImageCache() {
    try {
        const db = await openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.clear();

            request.onerror = () => reject(new Error('Failed to clear cache'));
            request.onsuccess = () => resolve(true);
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        return false;
    }
}
