// src/services/__tests__/getSyncStatus.test.ts
import { getSyncStatus } from '../../services/getSyncStatus';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-community/netinfo');
jest.mock('@react-native-async-storage/async-storage');

describe('getSyncStatus', () => {
  const mockFetch = NetInfo.fetch as jest.Mock;
  const mockGetItem = AsyncStorage.getItem as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns offline when no network', async () => {
    mockFetch.mockResolvedValue({ isConnected: false });
    const status = await getSyncStatus('resume1');
    expect(status).toBe('offline');
  });

  it('returns pending when there are pending changes', async () => {
    mockFetch.mockResolvedValue({ isConnected: true });
    mockGetItem.mockResolvedValue('1'); // pending flag exists
    const status = await getSyncStatus('resume1');
    expect(status).toBe('pending');
  });

  it('returns synced when online and no pending flag', async () => {
    mockFetch.mockResolvedValue({ isConnected: true });
    mockGetItem.mockResolvedValue(null);
    const status = await getSyncStatus('resume1');
    expect(status).toBe('synced');
  });
});
