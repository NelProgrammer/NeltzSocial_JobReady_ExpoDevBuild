import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    META: 'resume_meta',
    DATA_PREFIX: 'neltz_jobready_resume_data_',
};

export const Storage = {
    // Save Resume Meta (List of Resumes)
    saveMeta: async (meta) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
        } catch (e) {
            console.error('Failed to save resume meta', e);
        }
    },

    // Load Resume Meta
    loadMeta: async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.META);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load resume meta', e);
            return [];
        }
    },

    // Save Specific Resume Data
    saveResumeData: async (id, data) => {
        try {
            await AsyncStorage.setItem(`${STORAGE_KEYS.DATA_PREFIX}${id}`, JSON.stringify(data));
        } catch (e) {
            console.error(`Failed to save resume data for ${id}`, e);
        }
    },

    // Load Specific Resume Data
    loadResumeData: async (id) => {
        try {
            const jsonValue = await AsyncStorage.getItem(`${STORAGE_KEYS.DATA_PREFIX}${id}`);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error(`Failed to load resume data for ${id}`, e);
            return null;
        }
    },

    // Delete Resume Data
    deleteResumeData: async (id) => {
        try {
            await AsyncStorage.removeItem(`${STORAGE_KEYS.DATA_PREFIX}${id}`);
        } catch (e) {
            console.error(`Failed to delete resume data for ${id}`, e);
        }
    }
};
