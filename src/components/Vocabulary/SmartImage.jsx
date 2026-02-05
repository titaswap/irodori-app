/**
 * SmartImage.jsx
 * 
 * CORS-safe offline-first image component.
 * 
 * CRITICAL APPROACH:
 * 1. Renders <img src={url}> normally (browser-managed, CORS-safe)
 * 2. onLoad → caches image using Canvas API
 * 3. onError → tries cached version
 * 4. Graceful fallback if both fail
 * 
 * NO fetch() calls, NO blob conversions, NO CORS errors.
 */

import React, { useState } from 'react';
import { useOfflineImageCache } from '../../hooks/useOfflineImageCache.js';

const SmartImage = React.memo(({ src: originalSrc, alt = '', style = {}, className = '' }) => {
    const { src, onLoad, onError, isFromCache } = useOfflineImageCache(originalSrc);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(!isFromCache);

    const handleLoad = (e) => {
        setIsLoading(false);
        setHasError(false);
        onLoad(e);
    };

    const handleError = async (e) => {
        await onError(e);
        setIsLoading(false);

        // If still erroring after trying cache, show error state
        if (!isFromCache) {
            setHasError(true);
        }
    };

    // Error state - graceful fallback
    if (hasError) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    minHeight: '60px',
                    border: '1px dashed rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    padding: '1rem'
                }}
            >
                <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(0, 0, 0, 0.3)',
                    fontStyle: 'italic'
                }}>
                    Image unavailable
                </span>
            </div>
        );
    }

    // Render image with loading overlay
    return (
        <div style={{ position: 'relative', ...style }}>
            {isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        minHeight: '60px',
                        zIndex: 1
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.3)' }}>
                        Loading...
                    </span>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={className}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.2s ease-in-out'
                }}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
});

SmartImage.displayName = 'SmartImage';

export default SmartImage;
