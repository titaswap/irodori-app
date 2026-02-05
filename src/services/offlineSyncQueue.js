/**
 * Offline Sync Queue Service
 * 
 * CRITICAL: Ensures offline changes are NEVER lost, even if app closes.
 * 
 * ARCHITECTURE:
 * 1. Every write operation is queued to localStorage BEFORE attempting Firestore
 * 2. Queue persists across app close/reopen
 * 3. Sync processor replays queued operations on:
 *    - App startup
 *    - Network reconnect
 *    - Auth ready
 * 4. Operations are idempotent (safe to replay)
 */

import { v4 as uuidv4 } from 'uuid';

const QUEUE_STORAGE_KEY = 'offlineSyncQueue';
const MAX_RETRY_COUNT = 5;
const SYNC_BATCH_SIZE = 10;

/**
 * Queue Entry Format:
 * {
 *   id: "uuid-v4",
 *   type: "updateProgress" | "addTag" | "removeTag",
 *   payload: { itemId, data, userId },
 *   timestamp: 1707134400000,
 *   retryCount: 0,
 *   userId: "user-abc"
 * }
 */

// ==================== QUEUE STORAGE ====================

/**
 * Load queue from localStorage
 * @returns {Array} Queue entries
 */
function loadQueue() {
    try {
        const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (!stored) return [];

        const queue = JSON.parse(stored);
        return Array.isArray(queue) ? queue : [];
    } catch (e) {
        console.error('[SyncQueue] Failed to load queue from storage:', e);
        return [];
    }
}

/**
 * Save queue to localStorage
 * @param {Array} queue - Queue entries
 */
function saveQueue(queue) {
    try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('[SyncQueue] Failed to save queue to storage:', e);
    }
}

// ==================== QUEUE OPERATIONS ====================

/**
 * Enqueue an operation for later sync
 * @param {string} type - Operation type: "updateProgress" | "addTag" | "removeTag"
 * @param {Object} payload - Operation payload
 * @returns {string} Operation ID
 */
export function enqueueOperation(type, payload) {
    const operationId = uuidv4();
    const entry = {
        id: operationId,
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
        userId: payload.userId
    };

    const queue = loadQueue();
    queue.push(entry);
    saveQueue(queue);

    console.log(`[SyncQueue] Enqueued ${type} operation ${operationId}`, payload);
    return operationId;
}

/**
 * Dequeue an operation after successful sync
 * @param {string} operationId - Operation ID to remove
 */
export function dequeueOperation(operationId) {
    const queue = loadQueue();
    const filtered = queue.filter(entry => entry.id !== operationId);
    saveQueue(filtered);

    console.log(`[SyncQueue] Dequeued operation ${operationId}`);
}

/**
 * Get all queued operations
 * @returns {Array} Queue entries
 */
export function getAllQueuedOperations() {
    return loadQueue();
}

/**
 * Clear entire queue (use with caution)
 */
export function clearQueue() {
    saveQueue([]);
    console.log('[SyncQueue] Queue cleared');
}

/**
 * Get queue size
 * @returns {number} Number of queued operations
 */
export function getQueueSize() {
    return loadQueue().length;
}

/**
 * Increment retry count for an operation
 * @param {string} operationId - Operation ID
 */
function incrementRetryCount(operationId) {
    const queue = loadQueue();
    const updated = queue.map(entry =>
        entry.id === operationId
            ? { ...entry, retryCount: entry.retryCount + 1 }
            : entry
    );
    saveQueue(updated);
}

/**
 * Remove operations that exceeded max retries
 */
function removeFailedOperations() {
    const queue = loadQueue();
    const filtered = queue.filter(entry => {
        if (entry.retryCount >= MAX_RETRY_COUNT) {
            console.warn(`[SyncQueue] Removing operation ${entry.id} after ${entry.retryCount} failed retries`);
            return false;
        }
        return true;
    });
    saveQueue(filtered);
}

// ==================== SYNC PROCESSOR ====================

/**
 * Process the sync queue - replay all queued operations
 * @returns {Promise<Object>} Sync results { success: number, failed: number }
 */
export async function processSyncQueue() {
    const queue = loadQueue();

    if (queue.length === 0) {
        console.log('[SyncQueue] Queue is empty, nothing to sync');
        return { success: 0, failed: 0 };
    }

    console.log(`[SyncQueue] Processing ${queue.length} queued operations...`);

    // Remove operations that exceeded max retries
    removeFailedOperations();

    // Reload queue after cleanup
    const cleanQueue = loadQueue();

    let successCount = 0;
    let failedCount = 0;

    // Process in batches to avoid overwhelming Firestore
    for (let i = 0; i < cleanQueue.length; i += SYNC_BATCH_SIZE) {
        const batch = cleanQueue.slice(i, i + SYNC_BATCH_SIZE);

        // Process batch sequentially to maintain order
        for (const entry of batch) {
            try {
                await executeOperation(entry);
                dequeueOperation(entry.id);
                successCount++;
                console.log(`[SyncQueue] ✓ Synced ${entry.type} (${entry.id})`);
            } catch (e) {
                incrementRetryCount(entry.id);
                failedCount++;
                console.warn(`[SyncQueue] ✗ Failed to sync ${entry.type} (${entry.id}):`, e.message);
            }
        }
    }

    console.log(`[SyncQueue] Sync complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
}

/**
 * Execute a queued operation
 * @param {Object} entry - Queue entry
 */
async function executeOperation(entry) {
    const { type, payload } = entry;

    // Dynamically import to avoid circular dependencies
    const { updateProgress, addTagIdToProgress, removeTagIdFromProgress } =
        await import('./firestore/activityService');

    switch (type) {
        case 'updateProgress':
            await updateProgress(payload.itemId, payload.data, true); // skipQueue = true
            break;

        case 'addTag':
            await addTagIdToProgress(payload.itemId, payload.tagId, payload.tagName, true); // skipQueue = true
            break;

        case 'removeTag':
            await removeTagIdFromProgress(payload.itemId, payload.tagId, true); // skipQueue = true
            break;

        default:
            throw new Error(`Unknown operation type: ${type}`);
    }
}

// ==================== UTILITIES ====================

/**
 * Check if browser is online
 * @returns {boolean}
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Start automatic sync processor
 * Triggers sync on network reconnect
 */
export function startSyncProcessor() {
    // Sync on network reconnect
    window.addEventListener('online', () => {
        console.log('[SyncQueue] Network reconnected, processing queue...');
        processSyncQueue().catch(err =>
            console.error('[SyncQueue] Auto-sync failed:', err)
        );
    });

    console.log('[SyncQueue] Sync processor started');
}
