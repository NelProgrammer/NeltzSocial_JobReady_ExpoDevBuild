// src/services/__tests__/SyncService.test.ts
import { enqueueSync, flushSyncQueue, getResumeSyncState } from '../../services/SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

describe('SyncService', () => {
  const mockSetItem = AsyncStorage.setItem as jest.Mock;
  const mockGetItem = AsyncStorage.getItem as jest.Mock;
  const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;
  const mockFetch = NetInfo.fetch as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('enqueues a sync item and sets pending flag', async () => {
    await enqueueSync('resume1', { field: 'value' });
    expect(mockSetItem).toHaveBeenCalledWith('sync_queue', JSON.stringify([{ resumeId: 'resume1', payload: { field: 'value' } }]));
    expect(mockSetItem).toHaveBeenCalledWith('sync_pending_resume1', '1');
  });

  it('flushes queue when online and clears pending flags', async () => {
    // Pretend there is a pending flag and queue stored
    mockGetItem.mockImplementation((key: string) => {
      if (key === 'sync_queue') return Promise.resolve(JSON.stringify([{ resumeId: 'resume1', payload: {} }]));
      if (key === 'sync_pending_resume1') return Promise.resolve('1');
      return Promise.resolve(null);
    });
    mockFetch.mockResolvedValue({ isConnected: true });
    await flushSyncQueue();
    expect(mockRemoveItem).toHaveBeenCalledWith('sync_pending_resume1');
    expect(mockSetItem).toHaveBeenCalledWith('sync_queue', JSON.stringify([]));
  });

  it('does not flush when offline', async () => {
    mockFetch.mockResolvedValue({ isConnected: false });
    await flushSyncQueue();
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });
});
