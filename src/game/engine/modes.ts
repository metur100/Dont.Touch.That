import type { GameMode } from '../types';

export interface ModeRules {
  lives: number;
  /** Classic: a failed level is retried. Others: move on to the next level. */
  retryOnFail: boolean;
  /** Fixed number of levels, or null for endless. */
  length: number | null;
  /** Whether results count toward stats and achievements. */
  recordsStats: boolean;
  label: string;
}

export const MODE_RULES: Record<GameMode, ModeRules> = {
  classic: { lives: 3, retryOnFail: true, length: 100, recordsStats: true, label: 'CLASSIC' },
  endless: { lives: 3, retryOnFail: false, length: null, recordsStats: true, label: 'ENDLESS' },
  daily: { lives: 3, retryOnFail: false, length: 10, recordsStats: true, label: 'DAILY' },
  practice: { lives: 3, retryOnFail: false, length: 10, recordsStats: false, label: 'PRACTICE' },
};
