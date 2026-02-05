/**
 * useOfflineImageCache.js
 * 
 * CORS-safe offline-first image caching hook.
 * 
 * CRITICAL: NO fetch() calls for images!
 * - Uses native <img> loading (browser-managed, CORS-safe)
 * - Caches AFTER successful DOM load using Canvas API
 * - Falls back to cached version on error
 */

import { useState, useEffect, useCallback } from 'react';
import { getCachedImage, saveCachedImage } from '../utils/imageCache/imageCacheStore.js';

/**
 * Convert loaded img element to data URL using Canvas
 * This is CORS-safe because the image is already loaded by the browser
 * 
 * @param {HTMLImageElement} img - Loaded image element
 * @returns {string|null} Data URL or null if conversion fails
 */
function imageToDataURL(img) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Convert to data URL (PNG format for quality)
        return canvas.toDataURL('image/png');
    } catch (error) {
        // CORS error or other canvas error - image can't be cached
        //console.warn('Cannot cache image (likely CORS):', error);
        return null;
    }
}

/**
 * Custom hook for offline-first image caching
 * 
 * @param {string} originalSrc - Original image URL
 * @returns {Object} { src, onLoad, onError, isFromCache }
 */
export function useOfflineImageCache(originalSrc) {
    const [src, setSrc] = useState(originalSrc);
    const [isFromCache, setIsFromCache] = useState(false);
    const [loadAttempted, setLoadAttempted] = useState(false);

    // Check cache on mount
    useEffect(() => {
        if (!originalSrc) return;

        async function checkCache() {
            const cachedDataUrl = await getCachedImage(originalSrc);

            if (cachedDataUrl) {
                // Use cached version
                setSrc(cachedDataUrl);
                setIsFromCache(true);
            } else {
                // Use original URL (will load from network)
                setSrc(originalSrc);
                setIsFromCache(false);
            }
        }

        checkCache();
    }, [originalSrc]);

    /**
     * Called when image successfully loads
     * Cache the image for offline use
     */
    const handleLoad = useCallback((event) => {
        const img = event.target;

        // If already from cache, no need to re-cache
        if (isFromCache) return;

        // Convert to data URL and cache
        const dataUrl = imageToDataURL(img);
        if (dataUrl) {
            saveCachedImage(originalSrc, dataUrl);
        }
    }, [originalSrc, isFromCache]);

    /**
     * Called when image fails to load
     * Try to use cached version if available
     */
    const handleError = useCallback(async () => {
        // Prevent infinite error loops
        if (loadAttempted) return;
        setLoadAttempted(true);

        // Try cached version
        const cachedDataUrl = await getCachedImage(originalSrc);

        if (cachedDataUrl) {
            setSrc(cachedDataUrl);
            setIsFromCache(true);
        }
        // If no cache, let the error state show
    }, [originalSrc, loadAttempted]);

    return {
        src,
        onLoad: handleLoad,
        onError: handleError,
        isFromCache
    };
}
