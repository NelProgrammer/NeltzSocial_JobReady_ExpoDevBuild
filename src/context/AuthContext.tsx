// @ts-nocheck
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../utils/storage';
import { getBackendUrl } from '../utils/backendUrl';
import { AuthContextType } from '../types/context';
import {
  deriveDisplayNameFromEmail,
  generateAbbreviationProfileId,
  createGuestPlaceholder,
  createLocalProfileRecord,
  createServerProfileRecord,
  commitActiveProfile,
  ensureOfflineSessionState,
  replaceSessionWithGuest,
  deleteProfileState,
  rewriteStorageKey,
  upgradedGuestProfile,
  QUICK_START_NAME,
  EXPO_IDENTITY_KEYS,
} from '@jobready/core';

export { deriveDisplayNameFromEmail, generateAbbreviationProfileId };

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profiles: [],
  loading: true,
  login: async () => {},
  logout: async () => {},
  createProfile: async () => {},
  deleteProfile: async () => {},
  quickStart: async () => {},
  autoUpgradeGuestToLocal: async () => {},
  changeProfilePassword: async () => {},
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
  const [backendUrl, setBackendUrl] = useState(() => getBackendUrl());

  // Load custom backend URL override from Storage on startup if present
  useEffect(() => {
    const loadCustomUrl = async () => {
      try {
        const savedCustomUrl = await Storage.get(Storage.KEYS.CUSTOM_BACKEND_URL);
        if (savedCustomUrl && typeof savedCustomUrl === 'string' && savedCustomUrl.trim()) {
          setBackendUrl(savedCustomUrl.trim());
        }
      } catch (e) {
        console.error('[Auth] Failed to load custom backend URL', e);
      }
    };
    loadCustomUrl();
  }, []);

  const setCustomBackendUrl = async (url: string) => {
    try {
      const cleanUrl = (url || '').trim().replace(/\/+$/, '');
      if (!cleanUrl) {
        await Storage.remove(Storage.KEYS.CUSTOM_BACKEND_URL);
        setBackendUrl(getBackendUrl());
      } else {
        await Storage.set(Storage.KEYS.CUSTOM_BACKEND_URL, cleanUrl);
        setBackendUrl(cleanUrl);
      }
    } catch (e) {
      console.error('[Auth] Failed to set custom backend URL', e);
    }
  };

  // Background profile synchronization with server (Non-blocking)
  const syncRemoteProfilesBackground = async (localProfiles) => {
    try {
      const lastActiveId = await Storage.get(Storage.KEYS.LAST_ACTIVE_ID);
      const tokenBearer =
        (localProfiles || []).find((p) => p.id === lastActiveId)?.accessToken ||
        (localProfiles || []).find((p) => p.accessToken)?.accessToken;
      if (!tokenBearer) {
        return;
      }
      const response = await fetchWithTimeout(
        `${backendUrl}/auth/profiles`,
        { headers: { Authorization: `Bearer ${tokenBearer}` } },
        3000
      );
      if (response && response.ok) {
        const serverProfiles = await response.json();
        const currentLocal = (await Storage.get(Storage.KEYS.PROFILES)) || localProfiles || [];
        const serverMap = new Map(serverProfiles.map((p: any) => [p.profile_id, p]));
        const localMap = new Map(currentLocal.map((p: any) => [p.id, p]));
        const mergedProfiles = [];

        for (const s of serverProfiles) {
          const local = localMap.get(s.profile_id);
          if (local) {
            mergedProfiles.push({
              ...local,
              email: s.email || local.email,
              name: s.name || local.name,
              accessToken: s.access_token || local.accessToken || null,
            });
          } else {
            mergedProfiles.push({
              id: s.profile_id,
              name: s.name || deriveDisplayNameFromEmail(s.email) || 'Cloud User',
              email: s.email || '',
              accessToken: s.access_token || null,
              created: new Date().toISOString(),
              lastLogin: Date.now(),
            });
          }
        }

        for (const l of currentLocal) {
          if (!serverMap.has(l.id)) {
            mergedProfiles.push(l);
          }
        }

        await Storage.set(Storage.KEYS.PROFILES, mergedProfiles);
        setProfiles(mergedProfiles);

        const currentActiveId = await Storage.get(Storage.KEYS.LAST_ACTIVE_ID);
        if (currentActiveId) {
          const updatedActive = mergedProfiles.find((p: any) => p.id === currentActiveId);
          if (updatedActive) {
            setUser(updatedActive);
          }
        }
      }
    } catch (apiErr: any) {
      // Gracefully suppress network/offline errors during background sync
      // App continues seamlessly in local/offline mode
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      let profilesArray = [];
      try {
        // 1. Load Local Profiles from AsyncStorage immediately
        const storedProfiles = await Storage.get(Storage.KEYS.PROFILES) || [];
        const lastActiveId = await Storage.get(Storage.KEYS.LAST_ACTIVE_ID);
        const bootstrapped = ensureOfflineSessionState(storedProfiles, lastActiveId, {
          bootstrapGuest: process.env.NODE_ENV !== 'test',
        });
        profilesArray = bootstrapped.profiles;
        await Storage.set(Storage.KEYS.PROFILES, profilesArray);
        setProfiles(profilesArray);

        let activeProfile = profilesArray.find(p => p.id === bootstrapped.activeId);

        if (activeProfile) {
          if (activeProfile.passwordChangeCountdown !== undefined && activeProfile.passwordChangeCountdown > 0) {
            activeProfile.passwordChangeCountdown -= 1;
            const updated = profilesArray.map(p => p.id === activeProfile.id ? activeProfile : p);
            await Storage.set(Storage.KEYS.PROFILES, updated);
            setProfiles(updated);
          }
          setUser(activeProfile);
          await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, activeProfile.id);
        } else {
          if (process.env.NODE_ENV !== 'test') {
            const guest = createGuestPlaceholder();
            setUser(guest);
            setProfiles([guest]);
            await Storage.set(Storage.KEYS.PROFILES, [guest]);
            await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, guest.id);
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error('[Auth] Initialization failed', e);
      } finally {
        // Unlock UI immediately for 0ms blocking offline startup
        setLoading(false);
      }

      // 3. Initiate Non-blocking Background Profile Sync with server (if not in test mode)
      if (process.env.NODE_ENV !== 'test') {
        syncRemoteProfilesBackground(profilesArray);
      }
    };
    initAuth();
  }, [backendUrl]);

  const login = async (profileId) => {
    try {
      const profile = (profiles || []).find(p => p.id === profileId);
      if (!profile) return;

      if (profile.email && profile.password && !profile.accessToken) {
        try {
          await signupOrLogin(profile.email, profile.password, profile.name || deriveDisplayNameFromEmail(profile.email), profile.socialLinks || {});
          return;
        } catch (e) {
          console.warn('[Auth] Online login on switch unavailable, using local profile:', e.message);
        }
      }

      let updatedProfile = { ...profile, lastLogin: Date.now() };
      if (updatedProfile.passwordChangeCountdown !== undefined && updatedProfile.passwordChangeCountdown > 0) {
        updatedProfile.passwordChangeCountdown -= 1;
      }

      const updatedProfiles = profiles.map(p =>
        p.id === profileId ? updatedProfile : p
      );

      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, profileId);

      setProfiles(updatedProfiles);
      setUser(updatedProfile);
    } catch (e) {
      console.error('[Auth] Login failed', e);
    }
  };

  const logout = async () => {
    try {
      await Storage.remove(Storage.KEYS.LAST_ACTIVE_ID);
      if (process.env.NODE_ENV === 'test') {
        setUser(null);
        return;
      }
      const next = replaceSessionWithGuest(profiles || []);
      await Storage.set(Storage.KEYS.PROFILES, next.profiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, next.guest.id);

      setProfiles(next.profiles);
      setUser(next.guest);
    } catch (e) {
      console.error('[Auth] Logout failed', e);
    }
  };

  const deleteProfile = async (targetId: string) => {
    try {
      const next = deleteProfileState(profiles || [], targetId, user?.id);
      let updatedList = next.profiles;
      let nextActiveUser = user;

      if (next.guest) {
        nextActiveUser = next.guest;
        await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, next.guest.id);
      }

      await Storage.set(Storage.KEYS.PROFILES, updatedList);
      setProfiles(updatedList);
      setUser(nextActiveUser);
    } catch (e) {
      console.error('[Auth] Delete profile failed', e);
    }
  };

  const autoUpgradeGuestToLocal = async ({ firstName, middleName, surname, idNumber, dob }: any) => {
    try {
      if (!user || !user.isGuest) return user;

      const upgradedProfile = {
        ...upgradedGuestProfile({ firstName, middleName, surname, idNumber, dob }),
        passwordChangeCountdown: 5,
        created: new Date().toISOString(),
      };
      const newProfileId = upgradedProfile.id;

      const updatedProfiles = commitActiveProfile(
        (profiles || []).filter(p => p.id !== user.id),
        upgradedProfile,
      );

      try {
        const keys = await AsyncStorage.getAllKeys();
        for (const key of keys) {
          const nextKey = rewriteStorageKey(key, user.id, newProfileId, EXPO_IDENTITY_KEYS.dataPrefixes);
          if (!nextKey || nextKey === key) continue;
          const value = await AsyncStorage.getItem(key);
          if (value != null) await AsyncStorage.setItem(nextKey, value);
          await AsyncStorage.removeItem(key);
        }
      } catch (migErr) {
        console.warn('[Auth] Error migrating guest resume data to upgraded profile:', migErr);
      }

      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, newProfileId);

      setProfiles(updatedProfiles);
      setUser(upgradedProfile);
      return upgradedProfile;
    } catch (e) {
      console.error('[Auth] Auto-upgrade failed:', e);
      return null;
    }
  };

  const changeProfilePassword = async (profileId, newPassword) => {
    try {
      const updatedProfiles = (profiles || []).map(p => {
        if (p.id === profileId) {
          const copy = { ...p, password: newPassword };
          delete copy.passwordChangeCountdown;
          return copy;
        }
        return p;
      });

      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      setProfiles(updatedProfiles);
      if (user?.id === profileId) {
        const active = updatedProfiles.find(p => p.id === profileId);
        setUser(active);
      }
    } catch (e) {
      console.error('[Auth] Change password failed:', e);
    }
  };

  const renameProfile = async (profileId, newName) => {
    try {
      if (!newName || !newName.trim()) return;
      const cleanName = newName.trim();
      const updatedProfiles = (profiles || []).map(p => {
        if (p.id === profileId) {
          return { ...p, name: cleanName };
        }
        return p;
      });

      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      setProfiles(updatedProfiles);
      if (user?.id === profileId) {
        const active = updatedProfiles.find(p => p.id === profileId);
        setUser(active);
      }
    } catch (e) {
      console.error('[Auth] Rename profile failed:', e);
    }
  };

  const saveActiveProfile = async (newProfile) => {
    const updatedProfiles = commitActiveProfile(profiles || [], newProfile);
    await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
    await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, newProfile.id);
    setProfiles(updatedProfiles);
    setUser(newProfile);
    return newProfile;
  };

  const createLocalProfile = async (name, socialLinks = {}, extras = {}) => {
    return saveActiveProfile({
      ...createLocalProfileRecord(name, socialLinks, extras),
      created: new Date().toISOString(),
    });
  };

  const applyServerAuth = async (result, socialLinks = {}, extras = {}) => {
    return saveActiveProfile({
      ...createServerProfileRecord(result, { ...extras, socialLinks }),
      created: new Date().toISOString(),
    });
  };

  const signupOrLogin = async (email, password, name, socialLinks = {}) => {
    const signupRes = await fetchWithTimeout(
      `${backendUrl}/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      },
      5000,
    );
    if (signupRes.ok) {
      return applyServerAuth(await signupRes.json(), socialLinks, { email, password, name, linkedSocials: ['email'] });
    }
    const loginRes = await fetchWithTimeout(
      `${backendUrl}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      5000,
    );
    if (loginRes.ok) {
      return applyServerAuth(await loginRes.json(), socialLinks, { email, password, name, linkedSocials: ['email'] });
    }
    throw new Error(`Online signup/login failed (${signupRes.status}/${loginRes.status})`);
  };

  const createProfile = async (name, socialLinks = {}, credentials = {}) => {
    const email = credentials.email || (name && name.includes('@') ? name : '');
    const password = credentials.password;
    const derivedName = email ? deriveDisplayNameFromEmail(email) : name;
    const forceLocal = Boolean(socialLinks.local);

    if (email && password && !forceLocal) {
      try {
        return await signupOrLogin(email, password, derivedName, socialLinks);
      } catch (e) {
        console.warn('[Auth] Job 2 signup/login unavailable, keeping a local profile:', e.message);
        return createLocalProfile(derivedName, socialLinks, { email, password });
      }
    }

    const socialProvider = credentials.provider || (!forceLocal && Object.keys(socialLinks).find((k) => k !== 'local'));
    const socialToken = credentials.token;
    if (socialProvider && socialToken && !forceLocal) {
      try {
        const response = await fetchWithTimeout(
          `${backendUrl}/auth/verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: socialProvider, token: socialToken }),
          },
          5000,
        );
        if (response.ok) {
          return applyServerAuth(await response.json(), socialLinks, {
            linkedSocials: [socialProvider],
            name: derivedName,
          });
        }
      } catch (e) {
        console.warn('[Auth] Social verify unavailable, keeping a local profile:', e.message);
      }
    }

    return createLocalProfile(derivedName, socialLinks, { email, password });
  };

  const quickStart = async () => {
    return createProfile(QUICK_START_NAME, { local: true });
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
        autoUpgradeGuestToLocal,
        changeProfilePassword,
        renameProfile,
        backendUrl,
        setCustomBackendUrl,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
