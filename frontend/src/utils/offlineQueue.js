/**
 * 📦 Offline Action Queue & Synchronization Engine
 * Automatically queues student actions (e.g. drive applications, Q&A questions) when offline,
 * and flushes them to the server when network connectivity is restored.
 */

const QUEUE_KEY = 'gsfc_offline_sync_queue';

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(actionType, payload) {
  try {
    const queue = getOfflineQueue();
    const actionItem = {
      id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: actionType,
      payload,
      timestamp: new Date().toISOString()
    };
    queue.push(actionItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return actionItem;
  } catch (err) {
    console.error('Error queuing offline action:', err);
    return null;
  }
}

export async function flushOfflineQueue(onSyncSuccess = null) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remainingQueue = [];

  for (const item of queue) {
    try {
      if (item.type === 'apply_drive') {
        const res = await fetch('/api/student/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (res.ok) syncedCount++;
        else remainingQueue.push(item);
      } else if (item.type === 'gamification_award') {
        const res = await fetch('/api/gamification/award', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (res.ok) syncedCount++;
        else remainingQueue.push(item);
      } else {
        remainingQueue.push(item);
      }
    } catch {
      remainingQueue.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  if (syncedCount > 0 && typeof onSyncSuccess === 'function') {
    onSyncSuccess(syncedCount);
  }
  return syncedCount;
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker registration skipped:', err.message);
      });
    });
  }
}
