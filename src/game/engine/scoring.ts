import type { Goal } from '../types';

export const FAST_BONUS = 50;
export const STREAK_BONUS_STEP = 25;
export const MAX_STREAK_BONUS_STEPS = 10;

export interface ScoreInput {
  basePoints: number;
  goal: Goal;
  /** Time from level start to completion (act levels). */
  reactionMs: number;
  timeLimit: number;
  /** Streak INCLUDING this success. */
  streak: number;
}

export interface ScoreBreakdown {
  base: number;
  speed: number;
  streak: number;
  total: number;
  fast: boolean;
}

/** An act level is "fast" when finished within 40% of its time limit (at least 900ms of slack). */
export function isFast(goal: Goal, reactionMs: number, timeLimit: number): boolean {
  if (goal === 'survive') return false;
  return reactionMs <= Math.max(900, timeLimit * 0.4);
}

/** +25 per consecutive success after the first, capped at +250. */
export function streakBonus(streak: number): number {
  if (streak < 2) return 0;
  return STREAK_BONUS_STEP * Math.min(streak - 1, MAX_STREAK_BONUS_STEPS);
}

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const base = Math.max(0, Math.round(input.basePoints));
  const fast = isFast(input.goal, input.reactionMs, input.timeLimit);
  const speed = fast ? FAST_BONUS : 0;
  const streak = streakBonus(input.streak);
  return { base, speed, streak, total: base + speed + streak, fast };
}

/** Streak milestone banners (null when the streak isn't a milestone). */
export function streakMilestone(streak: number): string | null {
  if (streak === 50) return "YOU'VE BECOME THE MASTER OF NOT TOUCHING THINGS.";
  if (streak === 20) return 'SUSPICIOUSLY GOOD.';
  if (streak === 10) return "YOU'RE LEARNING TO RESIST.";
  if (streak > 0 && streak % 25 === 0) return 'UNTOUCHABLE.';
  return null;
}
