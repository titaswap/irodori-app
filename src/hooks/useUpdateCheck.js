import { useState, useEffect } from 'react';

const compareVersions = (v1, v2) => {
    if (!v1 || !v2) return null;

    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const x = a[i] || 0;
        const y = b[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
};

export const useUpdateCheck = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateDetails, setUpdateDetails] = useState({
        force: false,
        message: '',
        storeUrl: '',
        version: ''
    });

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                // Final robust implementation using injected Env Var
                const remoteUrl = __REMOTE_VERSION_URL__;

                if (!remoteUrl) return;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const response = await fetch(`${remoteUrl}?t=${Date.now()}`, {
                    cache: 'no-store',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) return;

                const remoteData = await response.json();
                const localVersion = __APP_VERSION__;

                const cmp = compareVersions(remoteData.version, localVersion);

                if (cmp === 1) {
                    setUpdateAvailable(true);
                    setUpdateDetails(remoteData);
                }
            } catch {
                // Fail silently in production
                // console.error('[UpdateCheck] Error:', err);
            }
        };

        checkUpdate();
    }, []);

    return { updateAvailable, ...updateDetails };
};
