import React, { createContext, useState, useEffect } from 'react';
import { Storage } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // 1. Load Profiles List
                const storedProfiles = await Storage.get(Storage.KEYS.PROFILES) || [];
                setProfiles(storedProfiles);

                // 2. Check for Active Session
                const lastActiveId = await Storage.get(Storage.KEYS.LAST_ACTIVE_ID);
                if (lastActiveId) {
                    const activeProfile = storedProfiles.find(p => p.id === lastActiveId);
                    if (activeProfile) {
                        setUser(activeProfile);
                    }
                }
            } catch (e) {
                console.error('[Auth] Initialization failed', e);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

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
            const newProfile = {
                id: 'prof_' + Date.now(),
                name: name,
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
            console.error('[Auth] Profile creation failed', e);
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
        } catch (e) {
            console.error('[Auth] Profile deletion failed', e);
        }
    };

    const quickStart = async () => {
        return createProfile('Quick Start User', { local: true });
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            profiles, 
            loading, 
            login, 
            logout, 
            createProfile, 
            deleteProfile, 
            quickStart 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
