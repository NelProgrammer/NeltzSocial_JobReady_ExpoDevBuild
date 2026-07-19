// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    META_PREFIX: 'neltz_jobready_resume_meta_',
    DATA_PREFIX: 'neltz_jobready_resume_data_',
    UI_SETTINGS_PREFIX: 'neltz_jobready_ui_settings_',
    PROFILES: 'neltz_jobready_profiles',
    LAST_ACTIVE_ID: 'neltz_jobready_last_active_id',
};

export const Storage = {
    KEYS: STORAGE_KEYS,

    // Generic Methods
    set: async (key, value) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Failed to set storage key: ${key}`, e);
        }
    },

    get: async (key) => {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error(`Failed to get storage key: ${key}`, e);
            return null;
        }
    },

    remove: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error(`Failed to remove storage key: ${key}`, e);
        }
    },

    // Save Resume Meta (List of Resumes)
    saveMeta: async (profileId, meta) => {
        try {
            const key = `${STORAGE_KEYS.META_PREFIX}${profileId}`;
            await Storage.set(key, meta);
        } catch (e) {
            console.error('Failed to save resume meta', e);
        }
    },

    // Load Resume Meta
    loadMeta: async (profileId) => {
        return await Storage.get(`${STORAGE_KEYS.META_PREFIX}${profileId}`) || [];
    },

    // Save Specific Resume Data
    saveResumeData: async (profileId, resumeId, data) => {
        const key = `${STORAGE_KEYS.DATA_PREFIX}${profileId}_${resumeId}`;
        await Storage.set(key, data);
    },

    // Load Specific Resume Data
    loadResumeData: async (profileId, resumeId) => {
        return await Storage.get(`${STORAGE_KEYS.DATA_PREFIX}${profileId}_${resumeId}`);
    },

    // Delete Resume Data
    deleteResumeData: async (profileId, resumeId) => {
        const key = `${STORAGE_KEYS.DATA_PREFIX}${profileId}_${resumeId}`;
        await Storage.remove(key);
    },

    // Save Specific UI Settings
    saveUiSettings: async (profileId, resumeId, settings) => {
        const key = `${STORAGE_KEYS.UI_SETTINGS_PREFIX}${profileId}_${resumeId}`;
        await Storage.set(key, settings);
    },

    // Load Specific UI Settings
    loadUiSettings: async (profileId, resumeId) => {
        return await Storage.get(`${STORAGE_KEYS.UI_SETTINGS_PREFIX}${profileId}_${resumeId}`);
    },

    // Delete UI Settings
    deleteUiSettings: async (profileId, resumeId) => {
        const key = `${STORAGE_KEYS.UI_SETTINGS_PREFIX}${profileId}_${resumeId}`;
        await Storage.remove(key);
    }
};

