import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Maxfiy ma'lumotlar (token, sessiya) uchun xavfsiz saqlash.
 * iOS — Keychain, Android — Keystore. Web (faqat dev preview) — localStorage.
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        globalThis.localStorage?.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    } catch {
      // Saqlab bo'lmasa — sessiya faqat xotirada qoladi.
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        globalThis.localStorage?.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};
