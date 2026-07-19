global.IS_REACT_ACT_ENVIRONMENT = true;
import React, { useContext, useEffect } from 'react';
jest.setTimeout(60000);
import { render, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, AuthProvider } from '../src/context/AuthContext';
import { Storage } from '../src/utils/storage';

// 1. Mock dependencies to isolate test from network/device hardware
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: '127.0.0.1:8081' }
}));

jest.mock('../src/utils/network', () => ({
  scanBackendUrl: jest.fn().mockResolvedValue('http://127.0.0.1:8000')
}));

// Mock global fetch to skip real API calls during test runs
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: false, // Force it to trigger offline fallbacks in Context code
    status: 500,
    json: () => Promise.resolve({ error: 'Server offline' }),
  })
);

describe('AuthContext Javascript Integration Tests', () => {
  beforeEach(async () => {
    // Clear mock storage before each test
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  let authContextHandle = null;
  const TestComponent = ({ setAuth }) => {
    const auth = useContext(AuthContext);
    useEffect(() => {
      setAuth(auth);
    }, [auth]);
    return null;
  };

  const renderContext = async () => {
    authContextHandle = null; // Reset global handle to prevent stale references from previous tests
    const setAuth = (auth) => {
      authContextHandle = auth;
    };
    const result = render(
      <AuthProvider>
        <TestComponent setAuth={setAuth} />
      </AuthProvider>
    );
    // Wait for async init to settle
    await waitFor(() => {
      expect(authContextHandle).not.toBeNull();
      expect(authContextHandle.loading).toBe(false);
    }, { timeout: 20000 });
    return result;
  };

  test('Initial Bootstrapping: loads fallback empty profile states and resolved active URL', async () => {
    await renderContext();
    
    expect(authContextHandle.loading).toBe(false);
    expect(authContextHandle.user).toBeNull();
    expect(authContextHandle.profiles).toEqual([]);
    expect(authContextHandle.backendUrl).toBe('http://127.0.0.1:8000');
  });

  test('Profile Creation: creates a new local profile and saves it to AsyncStorage', async () => {
    await renderContext();
    
    // Trigger local profile creation
    await act(async () => {
      await authContextHandle.createProfile('Nelson Programmer', { local: true });
    });

    // Check react state update
    expect(authContextHandle.user).not.toBeNull();
    expect(authContextHandle.user.name).toBe('Nelson Programmer');
    expect(authContextHandle.profiles.length).toBe(1);

    // Verify it is committed to mock storage
    const rawProfiles = await AsyncStorage.getItem(Storage.KEYS.PROFILES);
    const parsedProfiles = JSON.parse(rawProfiles);
    expect(parsedProfiles.length).toBe(1);
    expect(parsedProfiles[0].name).toBe('Nelson Programmer');
  });

  test('Logout: terminates active user session and clears stored active ID', async () => {
    await renderContext();
    
    // 1. Create Profile
    await act(async () => {
      await authContextHandle.createProfile('Nelson Developer');
    });
    expect(authContextHandle.user).not.toBeNull();

    // 2. Trigger Logout
    await act(async () => {
      await authContextHandle.logout();
    });

    // 3. Verify session was cleared
    expect(authContextHandle.user).toBeNull();
    const activeId = await AsyncStorage.getItem(Storage.KEYS.LAST_ACTIVE_ID);
    expect(activeId).toBeNull();
  });
});
