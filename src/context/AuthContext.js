import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on launch
        const checkSession = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('active_user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load session', e);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (profileData) => {
        try {
            const userData = {
                id: profileData.id,
                name: profileData.name,
                email: profileData.email,
                photo: profileData.photo,
                provider: profileData.provider
            };
            await AsyncStorage.setItem('active_user', JSON.stringify(userData));
            setUser(userData);
        } catch (e) {
            console.error('Login failed', e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('active_user');
            setUser(null);
        } catch (e) {
            console.error('Logout failed', e);
        }
    };

    const quickStart = async () => {
        // Guest / Local Quick Start
        const guestUser = {
            id: 'guest_' + Date.now(),
            name: 'Quick Start User',
            email: null,
            photo: null,
            provider: 'local'
        };
        await login(guestUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, quickStart }}>
            {children}
        </AuthContext.Provider>
    );
};
