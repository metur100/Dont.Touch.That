/**
 * Level factories: the only place that knows how to turn short, readable level descriptions into
 * full LevelDefinitions. Adding a new level is usually one line in a level file.
 */
import type {
  ArrowConfig,
  ButtonConfig,
  ChaseConfig,
  ChoiceConfig,
  ChoiceItem,
  ColorName,
  CountConfig,
  Direction,
  DragConfig,
  Goal,
  HoldConfig,
  LevelDefinition,
  LevelStage,
  LevelType,
  MechanicConfig,
  Rect,
  ScreenConfig,
  ShakeConfig,
  SwipeConfig,
  SwitchConfig,
  TimingConfig,
} from '../types';

/** A level before an id is assigned (ids depend on where the level is used). */
export type LevelSpec = Omit<LevelDefinition, 'id'>;

export interface CommonOptions {
  instruction: string;
  hint?: string;
  difficulty: number;
  /** Time limit in ms. */
  time?: number;
  type?: LevelType;
  success?: string;
  failure?: string;
  timeout?: string;
  points?: number;
  tag?: 'special' | 'boss';
}

export function pointsFor(difficulty: number): number {
  return 100 + Math.round(difficulty) * 10;
}

function make(
  o: CommonOptions,
  goal: Goal,
  defaultType: LevelType,
  defaultTime: number,
  mechanic: MechanicConfig,
): LevelSpec {
  return {
    type: o.type ?? defaultType,
    instruction: o.instruction,
    hint: o.hint,
    goal,
    difficulty: o.difficulty,
    timeLimit: o.time ?? defaultTime,
    points: o.points ?? pointsFor(o.difficulty),
    mechanic,
    successMessage: o.success,
    failureMessage: o.failure,
    timeoutMessage: o.timeout,
    tag: o.tag,
  };
}

type Without<T> = Omit<T, 'kind'>;

/** One big tempting button. Survive unless it's touched. */
export function buttonLevel(o: CommonOptions & Without<ButtonConfig>): LevelSpec {
  const { label, color, size, motion, speed, skin, taunts, backgroundForbidden, emoji } = o;
  const type: LevelType =
    skin === 'fakeSuccess' ? 'fakeSuccess' : skin && skin !== 'round' ? 'fakeButton'
      : motion === 'move' || motion === 'teleport' ? 'movingButton'
        : motion === 'runAway' ? 'runAway' : 'dontPress';
  return make(o, 'survive', type, 4000, {
    kind: 'button', label, color, size, motion, speed, skin, taunts, backgroundForbidden, emoji,
  });
}

/** Touching anything at all fails. */
export function screenLevel(o: CommonOptions & Without<ScreenConfig>): LevelSpec {
  const { distractions, countdown, message, emoji } = o;
  return make(o, 'survive', 'dontTap', 4000, { kind: 'screen', distractions, countdown, message, emoji });
}

export function swipeLevel(o: CommonOptions & Without<SwipeConfig>): LevelSpec {
  const { forbidden, reversed, mode, emoji, judgeByCard } = o;
  const type: LevelType = reversed ? 'reverse'
    : forbidden.length === 1 && forbidden[0] === 'left' ? 'dontSwipeLeft'
      : forbidden.length === 1 && forbidden[0] === 'right' ? 'dontSwipeRight' : 'dontSwipe';
  return make(o, mode === 'flick' ? 'act' : 'survive', type, mode === 'flick' ? 5000 : 4000, {
    kind: 'swipe', forbidden, reversed, mode, emoji, judgeByCard,
  });
}

export function holdLevel(o: CommonOptions & Without<HoldConfig>): LevelSpec {
  const { mode, holdMs, label, color } = o;
  return make(
    o,
    mode === 'dontRelease' ? 'act' : 'survive',
    mode === 'dontRelease' ? 'dontRelease' : 'dontHold',
    mode === 'dontRelease' ? Math.max(holdMs + 3000, 5000) : 4500,
    { kind: 'hold', mode, holdMs, label, color },
  );
}

export function choiceLevel(o: CommonOptions & Without<ChoiceConfig>): LevelSpec {
  const { items, mode, motion, speed, memoryMs, columns } = o;
  const type: LevelType = memoryMs ? 'memory'
    : items.some((i) => i.invisible) ? 'invisible'
      : motion && motion !== 'none' ? 'movingButton' : 'multipleButtons';
  const time = mode === 'clearSafe' ? 5500 + items.length * 350 + (memoryMs ?? 0) : 4500 + (memoryMs ?? 0);
  return make(o, mode === 'survive' ? 'survive' : 'act', type, time, {
    kind: 'choice', items, mode, motion, speed, memoryMs, columns,
  });
}

/** Shorthand for colored items: `dots(['red'], ['blue','green','yellow'])`. */
export function dots(forbidden: ColorName[], safe: ColorName[]): ChoiceItem[] {
  let n = 0;
  const mk = (color: ColorName, isForbidden: boolean): ChoiceItem => ({ id: `i${n++}`, color, forbidden: isForbidden });
  return interleave(forbidden.map((c) => mk(c, true)), safe.map((c) => mk(c, false)));
}

/** Items with labels or emoji. Each entry: [label/emoji, color, forbidden]. */
export function things(entries: [string, ColorName, boolean][], useEmoji = true): ChoiceItem[] {
  return entries.map(([text, color, forbidden], n) => ({
    id: `i${n}`,
    color,
    forbidden,
    ...(useEmoji ? { emoji: text } : { label: text }),
  }));
}

/** Spreads forbidden items among safe ones so they don't cluster at the start. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const total = a.length + b.length;
  let ai = 0;
  let bi = 0;
  for (let i = 0; i < total; i++) {
    const wantA = ai < a.length && (bi >= b.length || (i * a.length) / total >= ai + 0.3);
    if (wantA) out.push(a[ai++]);
    else out.push(b[bi++]);
  }
  return out;
}

export function chaseLevel(o: CommonOptions & Without<ChaseConfig>): LevelSpec {
  const { chaser, chaserName, collect, count, speed } = o;
  return make(o, 'act', 'chase', 6000 + count * 900, { kind: 'chase', chaser, chaserName, collect, count, speed });
}

export function timingLevel(o: CommonOptions & Without<TimingConfig>): LevelSpec {
  const { mode, delayMs, windowMs, fakeOuts, zoneSize, sweepMs, label } = o;
  const type: LevelType = mode === 'dontWait' ? 'dontWait' : mode === 'reaction' ? 'reaction' : 'timing';
  const time = mode === 'dontWait' ? 2600 : mode === 'reaction' ? 8000 : 7000;
  return make(o, 'act', type, time, { kind: 'timing', mode, delayMs, windowMs, fakeOuts, zoneSize, sweepMs, label });
}

export function arrowLevel(o: CommonOptions & Without<ArrowConfig>): LevelSpec {
  const { input, rounds, jitter } = o;
  return make(o, 'act', 'dontFollow', 2500 + rounds * 2200, { kind: 'arrow', input, rounds, jitter });
}

export function switchLevel(o: CommonOptions & Without<SwitchConfig>): LevelSpec {
  const { phases, label, color, timeoutWins } = o;
  const total = phases.reduce((sum, p) => sum + p.ms, 0);
  return make(o, timeoutWins ? 'survive' : 'act', 'fakeInstruction', total, {
    kind: 'switch', phases, label, color, timeoutWins,
  });
}

export function shakeLevel(o: CommonOptions & Without<ShakeConfig>): LevelSpec {
  const { object, objectName, threshold } = o;
  return make(o, 'survive', 'dontShake', 4500, { kind: 'shake', object, objectName, threshold });
}

export function dragLevel(o: CommonOptions & Without<DragConfig>): LevelSpec {
  const { mode, token, walls, goal, start } = o;
  return make(o, mode === 'maze' ? 'act' : 'survive', mode === 'maze' ? 'maze' : 'dontDrag', mode === 'maze' ? 9000 : 4500, {
    kind: 'drag', mode, token, walls, goal, start,
  });
}

export function countLevel(o: CommonOptions & Without<CountConfig>): LevelSpec {
  const { mode, target, maxGapMs, label, emoji } = o;
  return make(o, 'act', mode === 'mash' ? 'dontStop' : 'count', mode === 'mash' ? 3000 + target * 220 : 4000 + target * 350, {
    kind: 'count', mode, target, maxGapMs, label, emoji,
  });
}

/** Converts a level spec into a stage usable inside a boss level. */
export function asStage(spec: LevelSpec): LevelStage {
  return {
    instruction: spec.instruction,
    hint: spec.hint,
    goal: spec.goal,
    timeLimit: spec.timeLimit,
    mechanic: spec.mechanic,
    successMessage: spec.successMessage,
    failureMessage: spec.failureMessage,
    timeoutMessage: spec.timeoutMessage,
  };
}

/** A multi-stage level: the first spec is the opening stage, the rest follow without a break. */
export function bossLevel(
  o: { difficulty: number; points?: number; tag?: 'special' | 'boss'; success?: string; failure?: string },
  first: LevelSpec,
  ...rest: LevelSpec[]
): LevelSpec {
  const tag = o.tag ?? 'boss';
  return {
    ...first,
    type: tag === 'boss' ? 'boss' : first.type,
    difficulty: o.difficulty,
    points: o.points ?? pointsFor(o.difficulty) * (tag === 'boss' ? 3 : 2),
    successMessage: o.success ?? first.successMessage,
    failureMessage: o.failure ?? first.failureMessage,
    tag,
    stages: rest.map(asStage),
  };
}

// ---------- Maze presets (fractions of the play area) ----------

export const MAZES: { walls: Rect[]; start: { x: number; y: number }; goal: Rect }[] = [
  {
    walls: [{ x: 0, y: 0.45, w: 0.65, h: 0.07 }],
    start: { x: 0.15, y: 0.15 },
    goal: { x: 0.05, y: 0.75, w: 0.3, h: 0.2 },
  },
  {
    walls: [
      { x: 0.3, y: 0.3, w: 0.7, h: 0.06 },
      { x: 0, y: 0.62, w: 0.7, h: 0.06 },
    ],
    start: { x: 0.12, y: 0.12 },
    goal: { x: 0.7, y: 0.78, w: 0.28, h: 0.18 },
  },
  {
    walls: [
      { x: 0.45, y: 0, w: 0.08, h: 0.6 },
      { x: 0.2, y: 0.4, w: 0.08, h: 0.6 },
      { x: 0.72, y: 0.4, w: 0.08, h: 0.6 },
    ],
    start: { x: 0.1, y: 0.15 },
    goal: { x: 0.82, y: 0.78, w: 0.17, h: 0.2 },
  },
  {
    walls: [
      { x: 0.25, y: 0.22, w: 0.75, h: 0.05 },
      { x: 0, y: 0.45, w: 0.75, h: 0.05 },
      { x: 0.25, y: 0.68, w: 0.75, h: 0.05 },
    ],
    start: { x: 0.12, y: 0.1 },
    goal: { x: 0.75, y: 0.8, w: 0.24, h: 0.18 },
  },
];

export const ALL_DIRECTIONS: Direction[] = ['left', 'right', 'up', 'down'];
