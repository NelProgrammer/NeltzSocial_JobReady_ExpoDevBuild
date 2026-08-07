// @ts-nocheck
import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { getBackendUrl } from '../utils/backendUrl';
import { Storage } from '../utils/storage';

import { AuthContextType } from '../types/context';
export const AuthContext = createContext<AuthContextType>({
  user: null,
  profiles: [],
  loading: true,
  login: async () => {},
  logout: async () => {},
  createProfile: async () => {},
  deleteProfile: async () => {},
  quickStart: async () => {},
  backendUrl: '',
  updateBackendUrl: async () => {},
  testBackendConnection: async () => ({ success: false, message: '' }),
  connectProfileToServer: async () => ({ success: false, message: '' }),
});

// Simple fetch wrapper; AbortController may be undefined in Jest
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendUrl, setBackendUrlState] = useState(() => getBackendUrl());

  const updateBackendUrl = async (newUrl: string) => {
    const trimmed = (newUrl || '').trim().replace(/\/+$/, '');
    if (!trimmed) return;
    await Storage.set(Storage.KEYS.BACKEND_URL, trimmed);
    setBackendUrlState(trimmed);
  };

  const testBackendConnection = async (urlToTest?: string) => {
    const target = (urlToTest || backendUrl).trim().replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(`${target}/auth/profiles`, {}, 3000);
      if (res.ok) {
        return { success: true, message: `Connected to backend server at ${target}` };
      }
      return { success: false, message: `Server returned status code: ${res.status}` };
    } catch (err: any) {
      return { success: false, message: `Connection failed to ${target}: ${err.message || 'Network request error'}` };
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Load custom backend URL if previously saved
        const savedUrl = await Storage.get(Storage.KEYS.BACKEND_URL);
        const activeUrl = savedUrl || getBackendUrl();
        setBackendUrlState(activeUrl);

        // 1. Load Local Profiles
        const storedProfiles = await Storage.get(Storage.KEYS.PROFILES) || [];
        let profilesArray = storedProfiles;
        
        // Bootstrap a guest profile if empty and NOT in test environment
        if (profilesArray.length === 0 && process.env.NODE_ENV !== 'test') {
          const guest = {
            id: 'guest_' + Date.now(),
            name: 'Guest',
            email: '',
            isGuest: true,
            isLocal: true,
            created: new Date().toISOString(),
            lastLogin: Date.now(),
          };
          profilesArray = [guest];
          await Storage.set(Storage.KEYS.PROFILES, profilesArray);
        }
        setProfiles(profilesArray);

        // 2. Fetch & Sync with Server Profiles
        try {
          const response = await fetchWithTimeout(`${activeUrl}/auth/profiles`, {}, 3000);
          if (response.ok) {
            const serverProfiles = await response.json();
            const serverMap = new Map(serverProfiles.map(p => [p.profile_id, p]));
            const localMap = new Map(profilesArray.map(p => [p.id, p]));
            const mergedProfiles = [];

            // Process server profiles
            for (const s of serverProfiles) {
              const local = localMap.get(s.profile_id);
              if (local) {
                mergedProfiles.push({
                  ...local,
                  email: s.email || local.email,
                  name: s.name || local.name,
                  isLocal: false
                });
              } else {
                mergedProfiles.push({
                  id: s.profile_id,
                  name: s.name || 'Cloud User',
                  email: s.email || '',
                  accessToken: s.access_token || null,
                  isLocal: false,
                  created: new Date().toISOString(),
                  lastLogin: Date.now()
                });
              }
            }

            // Keep local-only profiles
            for (const l of profilesArray) {
              if (!serverMap.has(l.id)) {
                mergedProfiles.push({
                  ...l,
                  isLocal: l.isLocal !== undefined ? l.isLocal : true,
                  accessToken: l.accessToken || null
                });
              }
            }

            await Storage.set(Storage.KEYS.PROFILES, mergedProfiles);
            setProfiles(mergedProfiles);
            profilesArray = mergedProfiles;
          }
        } catch (apiErr) {
          console.warn('[Auth] Remote profile sync failed, falling back to local storage:', apiErr.message);
        }

        // 3. Check for Active Session
        const lastActiveId = await Storage.get(Storage.KEYS.LAST_ACTIVE_ID);
        if (lastActiveId) {
          const activeProfile = profilesArray.find(p => p.id === lastActiveId);
          if (activeProfile) {
            setUser(activeProfile);
          } else {
            setUser(null);
            await Storage.remove(Storage.KEYS.LAST_ACTIVE_ID);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('[Auth] Initialization failed', e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [backendUrl]);

  const login = async (profileId) => {
    try {
      const profile = (profiles || []).find(p => p.id === profileId);
      if (profile) {
        const updatedProfiles = profiles.map(p =>
          p.id === profileId ? { ...p, lastLogin: Date.now() } : p
        );

        await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
        await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, profileId);

        setProfiles(updatedProfiles);
        setUser(profile);
      }
    } catch (e) {
      console.error('[Auth] Login failed', e);
    }
  };

  const logout = async () => {
    try {
      await Storage.remove(Storage.KEYS.LAST_ACTIVE_ID);
      setUser(null);
    } catch (e) {
      console.error('[Auth] Logout failed', e);
    }
  };

  const connectProfileToServer = async (profileId: string) => {
    try {
      const targetProfile = (profiles || []).find(p => p.id === profileId);
      if (!targetProfile) return { success: false, message: 'Profile not found' };

      const mockToken = 'mock_' + targetProfile.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
      const response = await fetchWithTimeout(`${backendUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          token: mockToken
        })
      }, 5000);

      if (!response.ok) {
        return { success: false, message: `Server returned status: ${response.status}` };
      }

      const result = await response.json();
      const updatedProfile = {
        ...targetProfile,
        id: result.profile_id || targetProfile.id,
        email: result.email || targetProfile.email,
        accessToken: result.access_token || 'verified_token',
        isLocal: false
      };

      const updatedProfiles = profiles.map(p => p.id === profileId ? updatedProfile : p);
      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, updatedProfile.id);

      setProfiles(updatedProfiles);
      if (user?.id === profileId) setUser(updatedProfile);
      return { success: true, message: 'Successfully connected profile to server!' };
    } catch (e: any) {
      return { success: false, message: `Connection failed: ${e.message || 'Server unreachable'}` };
    }
  };

  const createProfile = async (name, socialLinks = {}) => {
    try {
      const mockToken = 'mock_' + name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();

      const response = await fetchWithTimeout(`${backendUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          token: mockToken
        })
      }, 5000);

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }

      const result = await response.json();

      const newProfile = {
        id: result.profile_id,
        name: result.name || name,
        email: result.email || '',
        accessToken: result.access_token,
        isLocal: false,
        created: new Date().toISOString(),
        lastLogin: Date.now(),
        socialLinks: socialLinks
      };

      const updatedProfiles = [...(profiles || []), newProfile];
      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, newProfile.id);

      setProfiles(updatedProfiles);
      setUser(newProfile);
      return newProfile;
    } catch (e) {
      console.warn('[Auth] Backend profile registration skipped, falling back to local mode:', e.message);

      // Offline/Local Fallback
      const localId = 'prof_' + Date.now();
      const newProfile = {
        id: localId,
        name: name,
        accessToken: null,
        isLocal: true,
        created: new Date().toISOString(),
        lastLogin: Date.now(),
        socialLinks: socialLinks
      };

      const updatedProfiles = [...(profiles || []), newProfile];
      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, newProfile.id);

      setProfiles(updatedProfiles);
      setUser(newProfile);
      return newProfile;
    }
  };

  const deleteProfile = async (profileId) => {
    try {
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);

      setProfiles(updatedProfiles);
      if (user?.id === profileId) {
        setUser(null);
        await Storage.remove(Storage.KEYS.LAST_ACTIVE_ID);
      }

      try {
        await fetchWithTimeout(`${backendUrl}/auth/profiles/${profileId}`, {
          method: 'DELETE'
        }, 5000);
      } catch (serverErr) {
        console.warn('[Auth] Remote profile delete failed:', serverErr.message);
      }
    } catch (e) {
      console.error('[Auth] Profile deletion failed', e);
    }
  };

  const quickStart = async () => {
    return createProfile('Quick Start User', { local: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        loading,
        login,
        logout,
        createProfile,
        deleteProfile,
        quickStart,
        backendUrl,
        updateBackendUrl,
        testBackendConnection,
        connectProfileToServer,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
