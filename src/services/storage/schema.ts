/** Persisted progress schema + defensive parsing so corrupted storage never breaks the game. */
import type { DailyResult } from '@/game/types';

export type ColorSchemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  colorScheme: ColorSchemePreference;
  /** Show color names on colored objects (color-blind friendly). */
  colorLabels: boolean;
  reduceMotion: boolean;
  theme: string;
}

export interface ProgressState {
  version: 1;
  bestScore: number;
  totalScore: number;
  /** Highest classic level reached (1-based). */
  highestLevel: number;
  classicCompleted: boolean;
  totalGames: number;
  levelsPlayed: number;
  totalSuccesses: number;
  totalFailures: number;
  longestStreak: number;
  currentStreak: number;
  bossesBeaten: number;
  forbiddenIgnored: number;
  totalTouches: number;
  totalPlayMs: number;
  endlessBestScore: number;
  endlessBestLevel: number;
  dailyChallenges: Record<string, DailyResult>;
  achievements: Record<string, number>;
  seenIntro: boolean;
  /** Entitlements unlocked through (future) purchases. */
  entitlements: string[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  haptics: true,
  colorScheme: 'system',
  colorLabels: false,
  reduceMotion: false,
  theme: 'playful',
};

export function createDefaultProgress(): ProgressState {
  return {
    version: 1,
    bestScore: 0,
    totalScore: 0,
    highestLevel: 1,
    classicCompleted: false,
    totalGames: 0,
    levelsPlayed: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    longestStreak: 0,
    currentStreak: 0,
    bossesBeaten: 0,
    forbiddenIgnored: 0,
    totalTouches: 0,
    totalPlayMs: 0,
    endlessBestScore: 0,
    endlessBestLevel: 0,
    dailyChallenges: {},
    achievements: {},
    seenIntro: false,
    entitlements: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown, fallback = 0) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
const flag = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

/** Merges unknown persisted data onto defaults, dropping anything malformed. */
export function sanitizeProgress(raw: unknown): ProgressState {
  const d = createDefaultProgress();
  if (!isObj(raw)) return d;
  const s = isObj(raw.settings) ? raw.settings : {};
  const daily: Record<string, DailyResult> = {};
  if (isObj(raw.dailyChallenges)) {
    for (const [key, value] of Object.entries(raw.dailyChallenges)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && isObj(value)) {
        daily[key] = {
          date: key,
          score: count(value.score),
          levelsCleared: count(value.levelsCleared),
          totalLevels: count(value.totalLevels, 10),
          completedAt: count(value.completedAt),
        };
      }
    }
  }
  const achievements: Record<string, number> = {};
  if (isObj(raw.achievements)) {
    for (const [key, value] of Object.entries(raw.achievements)) {
      if (typeof value === 'number' && Number.isFinite(value)) achievements[key] = value;
    }
  }
  const colorScheme = s.colorScheme === 'light' || s.colorScheme === 'dark' ? s.colorScheme : 'system';
  return {
    version: 1,
    bestScore: count(raw.bestScore),
    totalScore: count(raw.totalScore),
    highestLevel: Math.max(1, Math.min(100, count(raw.highestLevel, 1))),
    classicCompleted: flag(raw.classicCompleted, false),
    totalGames: count(raw.totalGames),
    levelsPlayed: count(raw.levelsPlayed),
    totalSuccesses: count(raw.totalSuccesses),
    totalFailures: count(raw.totalFailures),
    longestStreak: count(raw.longestStreak),
    currentStreak: count(raw.currentStreak),
    bossesBeaten: count(raw.bossesBeaten),
    forbiddenIgnored: count(raw.forbiddenIgnored),
    totalTouches: count(raw.totalTouches),
    totalPlayMs: count(raw.totalPlayMs),
    endlessBestScore: count(raw.endlessBestScore),
    endlessBestLevel: count(raw.endlessBestLevel),
    dailyChallenges: daily,
    achievements,
    seenIntro: flag(raw.seenIntro, false),
    entitlements: Array.isArray(raw.entitlements) ? raw.entitlements.filter((e): e is string => typeof e === 'string') : [],
    settings: {
      sound: flag(s.sound, d.settings.sound),
      music: flag(s.music, d.settings.music),
      haptics: flag(s.haptics, d.settings.haptics),
      colorScheme,
      colorLabels: flag(s.colorLabels, false),
      reduceMotion: flag(s.reduceMotion, false),
      theme: typeof s.theme === 'string' ? s.theme : 'playful',
    },
  };
}
