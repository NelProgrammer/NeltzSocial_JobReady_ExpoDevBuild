// src/services/SyncService.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSyncStatus } from './getSyncStatus';

type QueueItem = {
  resumeId: string;
  // In a real app this would be the diff or full resume data to sync
  payload: any;
};

const QUEUE_KEY = 'sync_queue';

/**
 * Retrieves the current sync queue from AsyncStorage.
 */
async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Persists the updated queue.
 */
async function setQueue(queue: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Adds a resume change to the sync queue.
 */
export async function enqueueSync(resumeId: string, payload: any): Promise<void> {
  const queue = await getQueue();
  queue.push({ resumeId, payload });
  await setQueue(queue);
  // Mark pending state for this resume
  await AsyncStorage.setItem(`sync_pending_${resumeId}`, '1');
}

/**
 * Attempts to flush the queue when network is available.
 * For this prototype we simply clear the queue and remove pending flags.
 * In a full implementation you would POST to your backend.
 */
export async function flushSyncQueue(): Promise<void> {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    return; // stay queued
  }
  const queue = await getQueue();
  // Simulate sending each item – replace with real API calls.
  for (const item of queue) {
    // TODO: send to server
    // After successful sync, clear pending flag for the resume.
    await AsyncStorage.removeItem(`sync_pending_${item.resumeId}`);
  }
  // Clear the queue after all items processed.
  await setQueue([]);
}

/**
 * Helper to get current sync state for a resume (exposes same enum as getSyncStatus).
 */
export async function getResumeSyncState(resumeId: string) {
  return await getSyncStatus(resumeId);
}
