import type { LevelStage, LevelType, MechanicConfig } from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface PlayArea {
  width: number;
  height: number;
}

/** What a mechanic can do to the outside world. All calls after the first outcome are ignored. */
export interface MechanicApi {
  succeed: (message?: string, at?: Point) => void;
  fail: (message?: string, at?: Point) => void;
  /** Counts a harmless touch (stats + light feedback). */
  touch: (at?: Point) => void;
  /** Replaces the on-screen instruction (fake/switching instructions). */
  setInstruction: (text: string, hint?: string) => void;
  /** Overrides what happens when the timer runs out (null = default for the goal). */
  setTimeoutResult: (result: 'success' | 'fail' | null) => void;
  /** True once the stage has been resolved. */
  isDone: () => boolean;
}

export interface MechanicProps<C extends MechanicConfig = MechanicConfig> {
  config: C;
  stage: LevelStage;
  type: LevelType;
  area: PlayArea;
  api: MechanicApi;
  /** Per-attempt random seed: mechanics derive all randomness from it so rendering stays pure. */
  seed: number;
}
