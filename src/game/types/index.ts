/**
 * Core game types. Levels are pure data: a level describes WHAT the player sees and which
 * mechanic interprets it; mechanics (React components) decide HOW the interaction works.
 */

export type LevelType =
  | 'tap'
  | 'dontTap'
  | 'dontTouch'
  | 'dontSwipe'
  | 'dontSwipeLeft'
  | 'dontSwipeRight'
  | 'dontHold'
  | 'dontDrag'
  | 'dontPress'
  | 'dontWait'
  | 'dontRelease'
  | 'dontShake'
  | 'dontFollow'
  | 'dontStop'
  | 'reverse'
  | 'fakeButton'
  | 'fakeSuccess'
  | 'movingButton'
  | 'runAway'
  | 'multipleButtons'
  | 'chase'
  | 'memory'
  | 'timing'
  | 'reaction'
  | 'count'
  | 'maze'
  | 'fakeInstruction'
  | 'invisible'
  | 'boss';

/**
 * survive: the player wins by NOT doing the forbidden thing until the timer ends.
 * act:     the player must do something (without breaking the rule) before the timer ends.
 */
export type Goal = 'survive' | 'act';

export type Direction = 'left' | 'right' | 'up' | 'down';

export type ColorName = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'gray';

/** Rectangle in play-area fractions (0..1), so levels work on every screen size. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------- Mechanic configurations ----------

export type ButtonMotion = 'none' | 'pulse' | 'wobble' | 'move' | 'runAway' | 'grow' | 'teleport';
export type ButtonSkin = 'round' | 'fakeSuccess' | 'fakeAd' | 'fakeUpdate' | 'gift' | 'cookie' | 'eye';

export interface ButtonConfig {
  kind: 'button';
  label: string;
  color?: ColorName;
  /** Button diameter as a fraction of the play area's shorter side. */
  size?: number;
  motion?: ButtonMotion;
  /** Movement speed multiplier for moving buttons. */
  speed?: number;
  skin?: ButtonSkin;
  /** Label changes over time, cycling every ~1.2s. */
  taunts?: string[];
  /** When true, touching ANYTHING fails — not just the button. */
  backgroundForbidden?: boolean;
  emoji?: string;
}

export type DistractionKind =
  | 'fly'
  | 'notification'
  | 'fakeContinue'
  | 'freeGems'
  | 'stillThere'
  | 'lowBattery'
  | 'fakeCrash'
  | 'confetti';

export interface ScreenConfig {
  kind: 'screen';
  distractions?: DistractionKind[];
  countdown?: boolean;
  message?: string;
  emoji?: string;
}

export interface SwipeConfig {
  kind: 'swipe';
  forbidden: Direction[];
  /** The card moves opposite to the finger. */
  reversed?: boolean;
  /** survive: just don't swipe the wrong way. flick: fling the card in an allowed direction. */
  mode: 'survive' | 'flick';
  emoji?: string;
  /** The forbidden direction is judged by where the CARD goes (relevant when reversed). */
  judgeByCard?: boolean;
}

export interface HoldConfig {
  kind: 'hold';
  mode: 'dontHold' | 'dontRelease';
  holdMs: number;
  label?: string;
  color?: ColorName;
}

export interface ChoiceItem {
  id: string;
  color: ColorName;
  label?: string;
  emoji?: string;
  forbidden: boolean;
  /** Nearly invisible (but faintly shimmering) item. */
  invisible?: boolean;
}

export interface ChoiceConfig {
  kind: 'choice';
  items: ChoiceItem[];
  /** clearSafe: pop every safe item. pickOne: tap one safe item. survive: just don't touch the forbidden. */
  mode: 'clearSafe' | 'pickOne' | 'survive';
  motion?: 'none' | 'drift' | 'shuffle';
  speed?: number;
  /** Colors are shown for this long, then hidden. */
  memoryMs?: number;
  columns?: number;
}

export interface ChaseConfig {
  kind: 'chase';
  chaser: string;
  chaserName: string;
  collect: string;
  count: number;
  speed: number;
}

export interface TimingConfig {
  kind: 'timing';
  /** dontWait: tap fast. reaction: wait for green. zone: tap while the needle is in the zone. */
  mode: 'dontWait' | 'reaction' | 'zone';
  delayMs?: [number, number];
  windowMs?: number;
  /** Fake color changes before the real one (reaction mode). */
  fakeOuts?: number;
  /** Zone width fraction (zone mode). */
  zoneSize?: number;
  /** Needle sweep duration in ms (zone mode). */
  sweepMs?: number;
  label?: string;
}

export interface ArrowConfig {
  kind: 'arrow';
  input: 'tap' | 'swipe';
  rounds: number;
  /** The arrow wiggles toward other buttons to confuse. */
  jitter?: boolean;
}

export interface SwitchPhase {
  instruction: string;
  hint?: string;
  allow: boolean;
  ms: number;
}

export interface SwitchConfig {
  kind: 'switch';
  phases: SwitchPhase[];
  label: string;
  color?: ColorName;
  /** If the player never presses, is that a win? */
  timeoutWins: boolean;
}

export interface ShakeConfig {
  kind: 'shake';
  object: string;
  objectName: string;
  /** Acceleration magnitude (in g) above resting gravity that counts as a shake. */
  threshold?: number;
}

export interface DragConfig {
  kind: 'drag';
  /** maze: drag the token to the goal without touching walls. dontDrag: don't drag the token at all. */
  mode: 'maze' | 'dontDrag';
  token: string;
  walls?: Rect[];
  goal?: Rect;
  start?: { x: number; y: number };
}

export interface CountConfig {
  kind: 'count';
  /** exact: tap exactly N times, then stop. mash: don't stop tapping until N. */
  mode: 'exact' | 'mash';
  target: number;
  maxGapMs?: number;
  label?: string;
  emoji?: string;
}

export type MechanicConfig =
  | ButtonConfig
  | ScreenConfig
  | SwipeConfig
  | HoldConfig
  | ChoiceConfig
  | ChaseConfig
  | TimingConfig
  | ArrowConfig
  | SwitchConfig
  | ShakeConfig
  | DragConfig
  | CountConfig;

export type MechanicKind = MechanicConfig['kind'];

/** One playable screen. Most levels have one stage; boss levels chain several. */
export interface LevelStage {
  instruction: string;
  hint?: string;
  goal: Goal;
  /** Milliseconds. */
  timeLimit: number;
  mechanic: MechanicConfig;
  successMessage?: string;
  failureMessage?: string;
  timeoutMessage?: string;
}

export interface LevelDefinition extends LevelStage {
  id: string;
  type: LevelType;
  /** 1 (trivial) .. 10 (evil). */
  difficulty: number;
  points: number;
  tag?: 'special' | 'boss';
  /** Additional stages played after the first one (boss levels). */
  stages?: LevelStage[];
}

export type GameMode = 'classic' | 'endless' | 'daily' | 'practice';

export interface DailyResult {
  date: string;
  score: number;
  levelsCleared: number;
  totalLevels: number;
  completedAt: number;
}
