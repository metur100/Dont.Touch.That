/**
 * The only module that touches AsyncStorage. All failures are swallowed and logged: the game keeps
 * working in memory if storage is unavailable.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultProgress, sanitizeProgress, type ProgressState } from './schema';

export const STORAGE_KEY = 'dont-touch-that:progress:v1';

export const storage = {
  async load(): Promise<ProgressState> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultProgress();
      return sanitizeProgress(JSON.parse(raw));
    } catch (error) {
      console.warn('[storage] load failed, using defaults', error);
      return createDefaultProgress();
    }
  },

  async save(state: ProgressState): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('[storage] save failed', error);
      return false;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[storage] clear failed', error);
    }
  },
};
