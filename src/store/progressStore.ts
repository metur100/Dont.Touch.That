/**
 * Persistent player progress (stats, settings, achievements). Components subscribe to slices with
 * selectors so a stat change doesn't re-render unrelated UI. Saving is debounced.
 */
import { create } from 'zustand';

import { ACHIEVEMENTS, newlyUnlocked, type Achievement } from '@/data/achievements';
import { MODE_RULES } from '@/game/engine/modes';
import type { DailyResult, GameMode } from '@/game/types';
import { createDefaultProgress, type ProgressState, type Settings } from '@/services/storage/schema';
import { storage } from '@/services/storage/storage';

export interface LevelRecord {
  mode: GameMode;
  levelIndex: number;
  success: boolean;
  boss: boolean;
  /** The level contained a forbidden object the player resisted. */
  ignoredForbidden: boolean;
  touches: number;
}

export interface RunRecord {
  mode: GameMode;
  score: number;
  durationMs: number;
  /** Highest level index reached (0-based). */
  reachedIndex: number;
}

interface ProgressStore {
  hydrated: boolean;
  progress: ProgressState;
  /** Achievements unlocked but not yet shown as a toast. */
  achievementQueue: Achievement[];
  hydrate: () => Promise<void>;
  recordLevel: (r: LevelRecord) => void;
  recordRun: (r: RunRecord) => void;
  /** Consumes today's official attempt (so quitting/killing the app can't be used to retry). */
  startDaily: (date: string, totalLevels: number) => void;
  recordDaily: (r: DailyResult) => void;
  setSettings: (s: Partial<Settings>) => void;
  markIntroSeen: () => void;
  grantEntitlement: (id: string) => void;
  resetProgress: () => Promise<void>;
  shiftAchievement: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(state: ProgressState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void storage.save(state);
  }, 400);
}

/** Writes any pending change immediately (e.g. when the app goes to the background). */
export async function flushProgress(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await storage.save(useProgress.getState().progress);
}

export const useProgress = create<ProgressStore>((set, get) => {
  /** Applies a change, unlocks achievements and persists. */
  const update = (fn: (p: ProgressState) => ProgressState) => {
    let next = fn(get().progress);
    const unlocked = newlyUnlocked(next);
    if (unlocked.length) {
      const now = Date.now();
      next = { ...next, achievements: { ...next.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, now])) } };
    }
    set((s) => ({ progress: next, achievementQueue: unlocked.length ? [...s.achievementQueue, ...unlocked] : s.achievementQueue }));
    scheduleSave(next);
  };

  return {
    hydrated: false,
    progress: createDefaultProgress(),
    achievementQueue: [],

    hydrate: async () => {
      const progress = await storage.load();
      set({ progress, hydrated: true });
    },

    recordLevel: (r) => {
      if (!MODE_RULES[r.mode].recordsStats) return;
      update((p) => {
        const currentStreak = r.success ? p.currentStreak + 1 : 0;
        const isClassic = r.mode === 'classic';
        return {
          ...p,
          levelsPlayed: p.levelsPlayed + 1,
          totalSuccesses: p.totalSuccesses + (r.success ? 1 : 0),
          totalFailures: p.totalFailures + (r.success ? 0 : 1),
          currentStreak,
          longestStreak: Math.max(p.longestStreak, currentStreak),
          bossesBeaten: p.bossesBeaten + (r.success && r.boss ? 1 : 0),
          forbiddenIgnored: p.forbiddenIgnored + (r.success && r.ignoredForbidden ? 1 : 0),
          totalTouches: p.totalTouches + r.touches,
          highestLevel: isClassic && r.success ? Math.max(p.highestLevel, Math.min(100, r.levelIndex + 2)) : p.highestLevel,
          classicCompleted: p.classicCompleted || (isClassic && r.success && r.levelIndex === 99),
          endlessBestLevel: r.mode === 'endless' ? Math.max(p.endlessBestLevel, r.levelIndex + 1) : p.endlessBestLevel,
        };
      });
    },

    recordRun: (r) => {
      if (!MODE_RULES[r.mode].recordsStats) return;
      update((p) => ({
        ...p,
        totalGames: p.totalGames + 1,
        totalScore: p.totalScore + r.score,
        bestScore: Math.max(p.bestScore, r.score),
        totalPlayMs: p.totalPlayMs + Math.max(0, r.durationMs),
        endlessBestScore: r.mode === 'endless' ? Math.max(p.endlessBestScore, r.score) : p.endlessBestScore,
      }));
    },

    startDaily: (date, totalLevels) => {
      if (get().progress.dailyChallenges[date]) return;
      update((p) => ({
        ...p,
        dailyChallenges: { ...p.dailyChallenges, [date]: { date, score: 0, levelsCleared: 0, totalLevels, completedAt: 0 } },
      }));
    },

    recordDaily: (r) => {
      // One official attempt per day: once a result is final it never changes.
      const existing = get().progress.dailyChallenges[r.date];
      if (existing && existing.completedAt > 0) return;
      update((p) => ({ ...p, dailyChallenges: { ...p.dailyChallenges, [r.date]: r } }));
    },

    setSettings: (s) => update((p) => ({ ...p, settings: { ...p.settings, ...s } })),

    markIntroSeen: () => update((p) => ({ ...p, seenIntro: true })),

    grantEntitlement: (id) =>
      update((p) => (p.entitlements.includes(id) ? p : { ...p, entitlements: [...p.entitlements, id] })),

    resetProgress: async () => {
      const keepSettings = get().progress.settings;
      const fresh = { ...createDefaultProgress(), settings: keepSettings, seenIntro: true };
      set({ progress: fresh, achievementQueue: [] });
      await storage.save(fresh);
    },

    shiftAchievement: () => set((s) => ({ achievementQueue: s.achievementQueue.slice(1) })),
  };
});

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

/** Non-hook access for services (audio/haptics read settings without subscribing). */
export const getSettings = () => useProgress.getState().progress.settings;
