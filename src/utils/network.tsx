import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = process.env.EXPO_PUBLIC_API_PORT || '8000';
const PRODUCTION_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.jobready.neltzsocial.com';

/**
 * Dynamically resolves the computer's IP address and scans a range of ports (e.g. 8000 - 8020)
 * to locate where the FastAPI backend server is currently running.
 */
export const scanBackendUrl = async () => {
    if (!__DEV__) {
        return PRODUCTION_URL;
    }
    
    // Resolve host IP (essential for physical devices connecting to host machine)
    const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants.manifest as any)?.hostUri;
    const ip = hostUri ? hostUri.split(':')[0] : (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
    
    const basePort = parseInt(PORT, 10);
    // Scan up to 20 fallback ports consecutively to find the active server
    const portsToCheck = Array.from({ length: 21 }, (_, i) => basePort + i);
    
    for (const p of portsToCheck) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 200); // 200ms limit per LAN check
            
            const response = await fetch(`http://${ip}:${p}/`, { signal: controller.signal });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'online') {
                    console.log(`[Network] Auto-detected backend at: http://${ip}:${p}`);
                    return `http://${ip}:${p}`;
                }
            }
        } catch (e) {
            // Port not open or blocked, proceed to check the next port
        }
    }
    
    // If scanning fails to find an active server, fallback to the default base address
    return Platform.OS === 'android' ? `http://10.0.2.2:${basePort}` : `http://localhost:${basePort}`;
};
