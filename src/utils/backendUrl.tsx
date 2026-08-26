// src/utils/backendUrl.js
// Deterministic backend URL resolver – replaces the heavy scanBackendUrl implementation.
// It works both in development (Expo) and in production, and it never performs network I/O.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const DEFAULT_PRODUCTION_URL = 'https://api.jobready.neltzsocial.com';

const DEFAULT_PORT = process.env.EXPO_PUBLIC_API_PORT || '8000';
const PRODUCTION_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_PRODUCTION_URL;

/**
 * Returns the backend URL to be used by the app.
 *
 * - Checks for an explicit override via `EXPO_PUBLIC_API_URL`.
 * - In production (`!__DEV__`) it returns the static PRODUCTION_URL.
 * - In development, if no override, it derives the host IP from Expo's Constants.
 *   When running on a physical Android device the special address `10.0.2.2` is used as a fallback.
 *   For iOS/web it falls back to `localhost`.
 * - The function is synchronous – no async/await, no network requests – making it safe for Jest tests.
 */
export const getBackendUrl = () => {
  // Allow developers to force a specific URL (e.g., via .env, build-time env, or CI).
  const devOverride = process.env.EXPO_PUBLIC_API_URL;
  if (devOverride) {
    return devOverride;
  }

  // Production shortcut
  if (!__DEV__) {
    return PRODUCTION_URL;
  }

  // Resolve the host IP from Expo constants. `hostUri` looks like "192.168.1.42:19000".
  const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants.manifest as any)?.hostUri;
  const ipFromHost = hostUri ? hostUri.split(':')[0] : null;

  // Determine a safe fallback when hostUri is unavailable.
  const fallbackIp = Platform?.OS === 'android' ? '10.0.2.2' : 'localhost';

  const finalIp = ipFromHost ?? fallbackIp;
  return `http://${finalIp}:${DEFAULT_PORT}`;
};
