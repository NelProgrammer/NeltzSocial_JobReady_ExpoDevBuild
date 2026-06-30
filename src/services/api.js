import { Platform } from 'react-native';

/**
 * Android Emulator Networking Explanation:
 * When running inside an Android Virtual Device (AVD / Emulator), the emulator operates on its own
 * isolated virtual network interface. To the emulator, 'localhost' or '127.0.0.1' refers to the phone emulator itself.
 * Android automatically maps the special IP address '10.0.2.2' to access the host machine's loopback interface (127.0.0.1).
 * Therefore, Android devices must query 'http://10.0.2.2:8000' to reach the FastAPI middleware running on your computer.
 */
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const BackendAPI = {
    BASE_URL: DEFAULT_HOST,

    request: async function (endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (body) options.body = JSON.stringify(body);
            
            const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return await response.json();
        } catch (e) {
            console.error(`[Expo BackendAPI] Request Failed (${endpoint}):`, e);
            throw e;
        }
    },

    verifyAuth: async function (provider, token) {
        return this.request('/auth/verify', 'POST', { provider, token });
    },

    fetchResumes: async function (profileId) {
        return this.request(`/sync/resumes/${profileId}`);
    },

    syncResume: async function (resumeItem) {
        return this.request('/sync/resumes', 'POST', resumeItem);
    },

    searchCandidates: async function (query, city, licenseCode) {
        let params = [];
        if (query) params.push(`query=${encodeURIComponent(query)}`);
        if (city) params.push(`city=${encodeURIComponent(city)}`);
        if (licenseCode) params.push(`license_code=${encodeURIComponent(licenseCode)}`);
        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        return this.request(`/recruit/search${queryString}`);
    }
};
