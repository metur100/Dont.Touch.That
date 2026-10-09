import AsyncStorage from '@react-native-async-storage/async-storage';

import { ACHIEVEMENTS, newlyUnlocked } from '@/data/achievements';
import { createDefaultProgress, sanitizeProgress } from '@/services/storage/schema';
import { STORAGE_KEY, storage } from '@/services/storage/storage';
import { flushProgress, useProgress } from '@/store/progressStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  useProgress.setState({ progress: createDefaultProgress(), achievementQueue: [], hydrated: true });
});

describe('storage service', () => {
  it('round-trips progress', async () => {
    const p = { ...createDefaultProgress(), bestScore: 1234, highestLevel: 17, seenIntro: true };
    expect(await storage.save(p)).toBe(true);
    expect(await storage.load()).toEqual(p);
  });

  it('returns defaults for missing data', async () => {
    expect(await storage.load()).toEqual(createDefaultProgress());
  });

  it('survives corrupted JSON', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await AsyncStorage.setItem(STORAGE_KEY, '{not json');
    expect(await storage.load()).toEqual(createDefaultProgress());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('survives storage failures', async () => {
    // The AsyncStorage jest mock is already a jest.fn: queue a one-off rejection (no spy/restore).
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('disk on fire'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await storage.load()).toEqual(createDefaultProgress());
    warn.mockRestore();
  });

  it('sanitizes malformed fields but keeps valid ones', () => {
    const p = sanitizeProgress({
      bestScore: -5,
      totalScore: 'lots',
      highestLevel: 500,
      dailyChallenges: { '2026-10-07': { score: 840, levelsCleared: 8, totalLevels: 10, completedAt: 1 }, junk: 1 },
      settings: { sound: false, colorScheme: 'purple' },
    });
    expect(p.bestScore).toBe(0);
    expect(p.totalScore).toBe(0);
    expect(p.highestLevel).toBe(100);
    expect(Object.keys(p.dailyChallenges)).toEqual(['2026-10-07']);
    expect(p.settings.sound).toBe(false);
    expect(p.settings.colorScheme).toBe('system');
    expect(p.settings.haptics).toBe(true);
  });
});

describe('progress store', () => {
  const level = { mode: 'classic' as const, levelIndex: 0, success: true, boss: false, ignoredForbidden: true, touches: 3 };

  it('records level results, streaks and classic progress', () => {
    const { recordLevel } = useProgress.getState();
    recordLevel(level);
    recordLevel({ ...level, levelIndex: 1 });
    let p = useProgress.getState().progress;
    expect(p.levelsPlayed).toBe(2);
    expect(p.currentStreak).toBe(2);
    expect(p.highestLevel).toBe(3);
    expect(p.totalTouches).toBe(6);
    recordLevel({ ...level, levelIndex: 2, success: false });
    p = useProgress.getState().progress;
    expect(p.currentStreak).toBe(0);
    expect(p.longestStreak).toBe(2);
    expect(p.totalFailures).toBe(1);
  });

  it('does not record practice runs', () => {
    useProgress.getState().recordLevel({ ...level, mode: 'practice' });
    expect(useProgress.getState().progress.levelsPlayed).toBe(0);
  });

  it('allows exactly one official daily result', () => {
    const { startDaily, recordDaily } = useProgress.getState();
    startDaily('2026-10-07', 10);
    expect(useProgress.getState().progress.dailyChallenges['2026-10-07'].completedAt).toBe(0);
    recordDaily({ date: '2026-10-07', score: 840, levelsCleared: 8, totalLevels: 10, completedAt: 1000 });
    recordDaily({ date: '2026-10-07', score: 99999, levelsCleared: 10, totalLevels: 10, completedAt: 2000 });
    expect(useProgress.getState().progress.dailyChallenges['2026-10-07'].score).toBe(840);
  });

  it('unlocks achievements and queues a toast', () => {
    useProgress.getState().recordLevel(level);
    const s = useProgress.getState();
    expect(s.progress.achievements.firstTouch).toBeDefined();
    expect(s.achievementQueue.map((a) => a.id)).toContain('firstTouch');
  });

  it('persists to storage', async () => {
    useProgress.getState().recordRun({ mode: 'endless', score: 777, durationMs: 1000, reachedIndex: 3 });
    await flushProgress();
    const saved = await storage.load();
    expect(saved.bestScore).toBe(777);
    expect(saved.endlessBestScore).toBe(777);
  });
});

describe('achievements', () => {
  it('has unique ids including the required ones', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['firstTouch', 'selfControl', 'impossible', 'addiction', 'resistance', 'ignorer', 'curiosity']) {
      expect(ids).toContain(id);
    }
  });

  it('unlocks based on thresholds', () => {
    const p = { ...createDefaultProgress(), longestStreak: 20, totalFailures: 100 };
    const ids = newlyUnlocked(p).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['selfControl', 'resistance', 'curiosity']));
    expect(ids).not.toContain('addiction');
  });
});
