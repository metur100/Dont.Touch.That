import { DAILY_LENGTH, generateDailyChallenge, generateLevel } from '../generators/endless';
import { CLASSIC_LEVELS } from '../levels';
import type { GameMode, LevelDefinition } from '../types';

export interface LevelSource {
  get: (index: number) => LevelDefinition | undefined;
  /** Total levels, or null when infinite. */
  total: number | null;
}

/** Builds the level sequence for a run. Endless levels are generated lazily and cached. */
export function createLevelSource(mode: GameMode, opts: { seed: number; dateKey: string }): LevelSource {
  if (mode === 'classic') {
    return { get: (i) => CLASSIC_LEVELS[i], total: CLASSIC_LEVELS.length };
  }
  if (mode === 'daily' || mode === 'practice') {
    const levels = generateDailyChallenge(opts.dateKey);
    return { get: (i) => levels[i], total: DAILY_LENGTH };
  }
  const cache = new Map<number, LevelDefinition>();
  return {
    get: (i) => {
      let level = cache.get(i);
      if (!level) {
        level = generateLevel(opts.seed, i);
        cache.set(i, level);
      }
      return level;
    },
    total: null,
  };
}
