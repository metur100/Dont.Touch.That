/**
 * Pure state machine for one run (one game session). UI components dispatch actions; all
 * scoring/lives/streak rules live here so they can be unit-tested without rendering anything.
 */
import type { GameMode, Goal } from '../types';
import { MODE_RULES } from './modes';
import { calculateScore, streakMilestone, type ScoreBreakdown } from './scoring';

export type RunStatus = 'playing' | 'result' | 'over' | 'complete';

export interface LevelOutcome {
  success: boolean;
  levelIndex: number;
  breakdown: ScoreBreakdown | null;
  streak: number;
  milestone: string | null;
  message: string;
  boss: boolean;
}

export interface RunState {
  mode: GameMode;
  startIndex: number;
  index: number;
  score: number;
  lives: number;
  maxLives: number;
  streak: number;
  bestStreak: number;
  /** Consecutive successes that were fast (act) or clean (survive). */
  perfectStreak: number;
  successes: number;
  failures: number;
  /** Increments on every new attempt; used as a React key to remount the level. */
  attempt: number;
  status: RunStatus;
  last: LevelOutcome | null;
  revived: boolean;
  /** Highest level index cleared in this run, -1 if none. */
  highestCleared: number;
}

export interface ResolveLevelInfo {
  points: number;
  goal: Goal;
  timeLimit: number;
  boss: boolean;
}

export type RunAction =
  | { type: 'resolve'; success: boolean; level: ResolveLevelInfo; reactionMs: number; message: string }
  | { type: 'advance' }
  | { type: 'revive' }
  | { type: 'restart'; startIndex?: number };

export function createRun(mode: GameMode, startIndex = 0): RunState {
  const rules = MODE_RULES[mode];
  return {
    mode,
    startIndex,
    index: startIndex,
    score: 0,
    lives: rules.lives,
    maxLives: rules.lives,
    streak: 0,
    bestStreak: 0,
    perfectStreak: 0,
    successes: 0,
    failures: 0,
    attempt: 0,
    status: 'playing',
    last: null,
    revived: false,
    highestCleared: -1,
  };
}

export function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'resolve': {
      if (state.status !== 'playing') return state;
      const { level } = action;
      if (action.success) {
        const streak = state.streak + 1;
        const breakdown = calculateScore({
          basePoints: level.points,
          goal: level.goal,
          reactionMs: action.reactionMs,
          timeLimit: level.timeLimit,
          streak,
        });
        const perfect = breakdown.fast || level.goal === 'survive';
        return {
          ...state,
          score: state.score + breakdown.total,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          perfectStreak: perfect ? state.perfectStreak + 1 : 0,
          successes: state.successes + 1,
          highestCleared: Math.max(state.highestCleared, state.index),
          status: 'result',
          last: {
            success: true,
            levelIndex: state.index,
            breakdown,
            streak,
            milestone: streakMilestone(streak),
            message: action.message,
            boss: level.boss,
          },
        };
      }
      return {
        ...state,
        lives: Math.max(0, state.lives - 1),
        streak: 0,
        perfectStreak: 0,
        failures: state.failures + 1,
        status: 'result',
        last: {
          success: false,
          levelIndex: state.index,
          breakdown: null,
          streak: 0,
          milestone: null,
          message: action.message,
          boss: level.boss,
        },
      };
    }
    case 'advance': {
      if (state.status !== 'result' || !state.last) return state;
      if (state.lives <= 0) return { ...state, status: 'over' };
      const rules = MODE_RULES[state.mode];
      const moveOn = state.last.success || !rules.retryOnFail;
      const index = moveOn ? state.index + 1 : state.index;
      if (rules.length !== null && index >= rules.length) {
        return { ...state, index, status: 'complete' };
      }
      return { ...state, index, attempt: state.attempt + 1, status: 'playing' };
    }
    case 'revive': {
      if (state.status !== 'over' || state.revived) return state;
      const rules = MODE_RULES[state.mode];
      const moveOn = !!state.last?.success || !rules.retryOnFail;
      const index = moveOn ? state.index + 1 : state.index;
      if (rules.length !== null && index >= rules.length) return state;
      return { ...state, lives: 1, revived: true, index, attempt: state.attempt + 1, status: 'playing' };
    }
    case 'restart':
      return createRun(state.mode, action.startIndex ?? state.startIndex);
    default:
      return state;
  }
}
