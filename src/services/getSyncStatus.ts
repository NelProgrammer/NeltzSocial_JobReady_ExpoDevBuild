// src/services/getSyncStatus.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncState = 'synced' | 'pending' | 'error' | 'offline';

/**
 * Determines the sync state for a given resume id.
 * - If the device is offline → 'offline'.
 * - If there are pending changes stored locally → 'pending'.
 * - Otherwise → 'synced'.
 */
export async function getSyncStatus(resumeId: string): Promise<SyncState> {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    return 'offline';
  }
  const pendingKey = `sync_pending_${resumeId}`;
  const pending = await AsyncStorage.getItem(pendingKey);
  if (pending) {
    return 'pending';
  }
  return 'synced';
}
