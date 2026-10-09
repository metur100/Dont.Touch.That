import type { ProgressState } from '@/services/storage/schema';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  /** Progress toward the goal, 0..1. */
  progress: (s: ProgressState) => number;
}

const ratio = (value: number, goal: number) => Math.min(1, value / goal);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstTouch', title: 'First Touch', description: 'Play your first level.', emoji: '👆', progress: (s) => ratio(s.levelsPlayed, 1) },
  { id: 'selfControl', title: 'Self Control', description: 'Complete 10 levels in a row without failing.', emoji: '🧘', progress: (s) => ratio(s.longestStreak, 10) },
  { id: 'impossible', title: 'Impossible', description: 'Complete a boss level.', emoji: '👑', progress: (s) => ratio(s.bossesBeaten, 1) },
  { id: 'addiction', title: 'Addiction', description: 'Play 50 levels.', emoji: '🔁', progress: (s) => ratio(s.levelsPlayed, 50) },
  { id: 'resistance', title: 'Resistance', description: 'Reach a streak of 20.', emoji: '🛡️', progress: (s) => ratio(s.longestStreak, 20) },
  { id: 'ignorer', title: 'Professional Ignorer', description: 'Ignore 100 forbidden objects.', emoji: '🙈', progress: (s) => ratio(s.forbiddenIgnored, 100) },
  { id: 'curiosity', title: 'Curiosity Killed the Button', description: 'Fail 100 times.', emoji: '💥', progress: (s) => ratio(s.totalFailures, 100) },
  { id: 'chapter5', title: 'Halfway There', description: 'Reach level 50 in Classic.', emoji: '🏔️', progress: (s) => ratio(s.highestLevel, 50) },
  { id: 'master', title: 'Master of Not Touching', description: 'Beat all 100 Classic levels.', emoji: '🏆', progress: (s) => ratio(s.classicCompleted ? 1 : 0, 1) },
  { id: 'daily', title: 'Daily Devotee', description: 'Finish 5 Daily Challenges.', emoji: '📅', progress: (s) => ratio(Object.values(s.dailyChallenges).filter((d) => d.completedAt > 0).length, 5) },
  { id: 'endless25', title: 'No End in Sight', description: 'Reach level 25 in Endless.', emoji: '♾️', progress: (s) => ratio(s.endlessBestLevel, 25) },
  { id: 'score10k', title: 'Five Digits', description: 'Score 10,000 points in one game.', emoji: '💯', progress: (s) => ratio(s.bestScore, 10000) },
  { id: 'toucher', title: 'Compulsive Toucher', description: 'Touch the screen 1,000 times.', emoji: '🖐️', progress: (s) => ratio(s.totalTouches, 1000) },
];

/** Achievements that are complete in `state` but not yet recorded as unlocked. */
export function newlyUnlocked(state: ProgressState): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.progress(state) >= 1);
}
