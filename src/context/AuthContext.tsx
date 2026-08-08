// @ts-nocheck
import React, { createContext, useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { getBackendUrl } from '../utils/backendUrl';
import { AuthContextType } from '../types/context';

export const deriveDisplayNameFromEmail = (email: string) => {
  if (!email || !email.includes('@')) return email || '';
  return email.split('@')[0];
};

export const generateAbbreviationProfileId = (firstName: string, middleName?: string | null, surname?: string) => {
  const fn2 = (firstName || '').trim().substring(0, 2).toLowerCase();
  const mn2 = (middleName || '').trim().length > 0 ? (middleName || '').trim().substring(0, 2).toLowerCase() : '';
  const sn2 = (surname || '').trim().substring(0, 2).toLowerCase();
  return `prfl_${fn2}${mn2}${sn2}`;
};

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
  const [backendUrl] = useState(() => getBackendUrl());

  const createGuestPlaceholder = () => ({
    id: 'guest_' + Date.now(),
    name: 'Guest',
    email: '',
    isGuest: true,
    isLocal: true,
    password: null,
    created: new Date().toISOString(),
    lastLogin: Date.now(),
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Load Local Profiles
        const storedProfiles = await Storage.get(Storage.KEYS.PROFILES) || [];
        let profilesArray = storedProfiles;
        
        // Bootstrap a guest profile if empty and NOT in test environment
        if (profilesArray.length === 0 && process.env.NODE_ENV !== 'test') {
          const guest = createGuestPlaceholder();
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
                  name: s.name || deriveDisplayNameFromEmail(s.email) || 'Cloud User',
                  email: s.email || '',
                  accessToken: s.access_token || null,
                  created: new Date().toISOString(),
                  lastLogin: Date.now()
                });
              }
            }

            for (const l of profilesArray) {
              if (!serverMap.has(l.id)) {
                mergedProfiles.push({
                  ...l,
                  accessToken: null
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
        let activeProfile = profilesArray.find(p => p.id === lastActiveId);

        if (!activeProfile && profilesArray.length > 0 && process.env.NODE_ENV !== 'test') {
          activeProfile = profilesArray[0];
        }

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
        setLoading(false);
      }
    };
    initAuth();
  }, [backendUrl]);

  const login = async (profileId) => {
    try {
      const profile = (profiles || []).find(p => p.id === profileId);
      if (profile) {
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
      }
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
      const guest = createGuestPlaceholder();
      const nonGuestProfiles = (profiles || []).filter(p => !p.isGuest);
      const updatedProfiles = [...nonGuestProfiles, guest];

      await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
      await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, guest.id);

      setProfiles(updatedProfiles);
      setUser(guest);
    } catch (e) {
      console.error('[Auth] Logout failed', e);
    }
  };

  const deleteProfile = async (targetId: string) => {
    try {
      const remaining = (profiles || []).filter(p => p.id !== targetId);
      let updatedList = remaining;
      let nextActiveUser = user;

      // If active user is deleted, fallback to guest profile
      if (user?.id === targetId) {
        const guest = createGuestPlaceholder();
        const nonGuestProfiles = remaining.filter(p => !p.isGuest);
        updatedList = [...nonGuestProfiles, guest];
        nextActiveUser = guest;
        await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, guest.id);
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

      const newProfileId = generateAbbreviationProfileId(firstName, middleName, surname);
      const displayName = `${firstName} ${surname}`.trim();
      const defaultPassword = dob || '19900101';

      const upgradedProfile = {
        id: newProfileId,
        name: displayName,
        email: '',
        isGuest: false,
        isLocal: true,
        password: defaultPassword,
        passwordChangeCountdown: 5,
        created: new Date().toISOString(),
        lastLogin: Date.now(),
        socialLinks: {},
        linkedSocials: [],
      };

      const updatedProfiles = (profiles || [])
        .filter(p => p.id !== user.id)
        .concat(upgradedProfile);

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

  const createProfile = async (name, socialLinks = {}) => {
    try {
      const isEmailInput = name && name.includes('@');
      const derivedName = isEmailInput ? deriveDisplayNameFromEmail(name) : name;

      const mockToken = 'mock_' + derivedName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();

      const response = await fetchWithTimeout(`${backendUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          token: mockToken
        })
      }, 3000);

      if (response.ok) {
        const result = await response.json();
        const newProfile = {
          id: result.profile_id,
          name: result.name || derivedName,
          email: result.email || (isEmailInput ? name : ''),
          accessToken: result.access_token,
          created: new Date().toISOString(),
          lastLogin: Date.now(),
          socialLinks: socialLinks,
          linkedSocials: ['google']
        };

        const updatedProfiles = [...(profiles || []).filter(p => !p.isGuest), newProfile];
        await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
        await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, newProfile.id);

        setProfiles(updatedProfiles);
        setUser(newProfile);
        return newProfile;
      }
    } catch (e) {
      console.warn('[Auth] Remote verify failed, falling back to local creation:', e.message);
    }

    const isEmailInput = name && name.includes('@');
    const derivedName = isEmailInput ? deriveDisplayNameFromEmail(name) : name;
    const localId = 'prfl_' + Date.now().toString(36);

    const newProfile = {
      id: localId,
      name: derivedName,
      email: isEmailInput ? name : '',
      isGuest: false,
      isLocal: true,
      password: 'Password123',
      created: new Date().toISOString(),
      lastLogin: Date.now(),
      socialLinks: socialLinks,
      linkedSocials: []
    };

    const updatedProfiles = [...(profiles || []).filter(p => !p.isGuest), newProfile];
    await Storage.set(Storage.KEYS.PROFILES, updatedProfiles);
    await Storage.set(Storage.KEYS.LAST_ACTIVE_ID, newProfile.id);

    setProfiles(updatedProfiles);
    setUser(newProfile);
    return newProfile;
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
        autoUpgradeGuestToLocal,
        changeProfilePassword,
        renameProfile,
        backendUrl,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
