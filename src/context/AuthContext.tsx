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
  const [backendUrl] = useState(() => getBackendUrl());

  useEffect(() => {
    const initAuth = async () => {
      try {
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
            created: new Date().toISOString(),
            lastLogin: Date.now(),
          };
          profilesArray = [guest];
          await Storage.set(Storage.KEYS.PROFILES, profilesArray);
        }
        setProfiles(profilesArray);

        // 2. Fetch & Sync with Server Profiles
        try {
          const response = await fetchWithTimeout(`${backendUrl}/auth/profiles`, {}, 3000);
          if (response.ok) {
            const serverProfiles = await response.json();
            const serverMap = new Map(serverProfiles.map(p => [p.profile_id, p]));
            const localMap = new Map(profilesArray.map(p => [p.id, p]));
            const mergedProfiles = [];

            // Process server profiles (either update local or create fresh from DB)
            for (const s of serverProfiles) {
              const local = localMap.get(s.profile_id);
              if (local) {
                mergedProfiles.push({
                  ...local,
                  email: s.email || local.email,
                  name: s.name || local.name
                });
              } else {
                mergedProfiles.push({
                  id: s.profile_id,
                  name: s.name || 'Cloud User',
                  email: s.email || '',
                  accessToken: s.access_token || null,
                  created: new Date().toISOString(),
                  lastLogin: Date.now()
                });
              }
            }

            // Keep local-only/offline profiles (ensuring we don't wipe active profiles if server database is reset)
            for (const l of profilesArray) {
              if (!serverMap.has(l.id)) {
                mergedProfiles.push({
                  ...l,
                  accessToken: null // Remove access token so it behaves as local fallback
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
        // Update Last Login
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

  const createProfile = async (name, socialLinks = {}) => {
    try {
      // Generate a unique mock token for local verification
      const mockToken = 'mock_' + name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();

      // Attempt to register/login on the backend API
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
      // Delete locally first
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);

      setProfiles(updatedProfiles);
      if (user?.id === profileId) {
        setUser(null);
        await Storage.remove(Storage.KEYS.LAST_ACTIVE_ID);
      }

      // Sync profile deletion to database
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
