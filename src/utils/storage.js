import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    META_PREFIX: 'neltz_jobready_resume_meta_',
    DATA_PREFIX: 'neltz_jobready_resume_data_',
};

export const Storage = {
    // Save Resume Meta (List of Resumes)
    saveMeta: async (profileId, meta) => {
        try {
            const key = `${STORAGE_KEYS.META_PREFIX}${profileId}`;
            await AsyncStorage.setItem(key, JSON.stringify(meta));
        } catch (e) {
            console.error('Failed to save resume meta', e);
        }
    },

    // Load Resume Meta
    loadMeta: async (profileId) => {
        try {
            const key = `${STORAGE_KEYS.META_PREFIX}${profileId}`;
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load resume meta', e);
            return [];
        }
    },

    // Save Specific Resume Data
    saveResumeData: async (profileId, resumeId, data) => {
        try {
            const key = `${STORAGE_KEYS.DATA_PREFIX}${profileId}_${resumeId}`;
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Failed to save resume data for ${resumeId}`, e);
        }
    },

    // Load Specific Resume Data
    loadResumeData: async (profileId, resumeId) => {
        try {
            const key = `${STORAGE_KEYS.DATA_PREFIX}${profileId}_${resumeId}`;
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error(`Failed to load resume data for ${resumeId}`, e);
            return null;
        }
    },

    // Delete Resume Data
    deleteResumeData: async (profileId, resumeId) => {
        try {
            const key = `${STORAGE_KEYS.DATA_PREFIX}${profileId}_${resumeId}`;
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error(`Failed to delete resume data for ${resumeId}`, e);
        }
    }
};
