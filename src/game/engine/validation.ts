/**
 * Level validation and sanitizing. Malformed or partial level data never crashes the game:
 * every field is clamped or replaced by a safe fallback.
 */
import type {
  ChoiceItem,
  ColorName,
  Direction,
  Goal,
  LevelDefinition,
  LevelStage,
  LevelType,
  MechanicConfig,
  Rect,
} from '../types';

const COLORS: ColorName[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray'];
const DIRECTIONS: Direction[] = ['left', 'right', 'up', 'down'];

export const MIN_TIME = 1500;
export const MAX_TIME = 20000;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback: string): string => (typeof v === 'string' && v.trim() ? v : fallback);
const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const optNum = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined;
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
const color = (v: unknown, fallback: ColorName): ColorName => (COLORS.includes(v as ColorName) ? (v as ColorName) : fallback);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;

function rect(v: unknown): Rect | undefined {
  if (!isObj(v)) return undefined;
  const r = { x: num(v.x, 0, 0, 1), y: num(v.y, 0, 0, 1), w: num(v.w, 0.2, 0.01, 1), h: num(v.h, 0.2, 0.01, 1) };
  return r;
}

export const FALLBACK_MECHANIC: MechanicConfig = { kind: 'button', label: 'BUTTON', color: 'red', motion: 'pulse' };

/** Returns a safe mechanic config, or the fallback button if the data is unusable. */
export function sanitizeMechanic(raw: unknown): MechanicConfig {
  if (!isObj(raw)) return FALLBACK_MECHANIC;
  switch (raw.kind) {
    case 'button':
      return {
        kind: 'button',
        label: str(raw.label, 'BUTTON'),
        color: color(raw.color, 'red'),
        size: optNum(raw.size, 0.2, 0.75),
        motion: oneOf(raw.motion, ['none', 'pulse', 'wobble', 'move', 'runAway', 'grow', 'teleport'] as const, 'pulse'),
        speed: optNum(raw.speed, 0.2, 4),
        skin: oneOf(raw.skin, ['round', 'fakeSuccess', 'fakeAd', 'fakeUpdate', 'gift', 'cookie', 'eye'] as const, 'round'),
        taunts: Array.isArray(raw.taunts) ? raw.taunts.filter((t): t is string => typeof t === 'string') : undefined,
        backgroundForbidden: bool(raw.backgroundForbidden),
        emoji: optStr(raw.emoji),
      };
    case 'screen':
      return {
        kind: 'screen',
        distractions: Array.isArray(raw.distractions)
          ? raw.distractions.filter((d) =>
            ['fly', 'notification', 'fakeContinue', 'freeGems', 'stillThere', 'lowBattery', 'fakeCrash', 'confetti'].includes(d as string),
          ) as never
          : undefined,
        countdown: bool(raw.countdown),
        message: optStr(raw.message),
        emoji: optStr(raw.emoji),
      };
    case 'swipe': {
      const forbidden = Array.isArray(raw.forbidden)
        ? raw.forbidden.filter((d): d is Direction => DIRECTIONS.includes(d as Direction))
        : [];
      const unique = [...new Set(forbidden)];
      return {
        kind: 'swipe',
        // At least one direction must stay allowed, or flick levels would be impossible.
        forbidden: unique.length === 0 || unique.length === 4 ? ['left'] : unique,
        reversed: bool(raw.reversed),
        mode: oneOf(raw.mode, ['survive', 'flick'] as const, 'survive'),
        emoji: optStr(raw.emoji),
        judgeByCard: bool(raw.judgeByCard),
      };
    }
    case 'hold':
      return {
        kind: 'hold',
        mode: oneOf(raw.mode, ['dontHold', 'dontRelease'] as const, 'dontHold'),
        holdMs: num(raw.holdMs, 800, 200, 8000),
        label: optStr(raw.label),
        color: color(raw.color, 'purple'),
      };
    case 'choice': {
      const items: ChoiceItem[] = Array.isArray(raw.items)
        ? raw.items.filter(isObj).slice(0, 12).map((it, i) => ({
          id: str(it.id, `i${i}`),
          color: color(it.color, 'blue'),
          label: optStr(it.label),
          emoji: optStr(it.emoji),
          forbidden: it.forbidden === true,
          invisible: bool(it.invisible),
        }))
        : [];
      const mode = oneOf(raw.mode, ['clearSafe', 'pickOne', 'survive'] as const, 'clearSafe');
      const hasSafe = items.some((i) => !i.forbidden);
      const hasForbidden = items.some((i) => i.forbidden);
      const usable = items.length >= 2 && hasSafe && (hasForbidden || mode !== 'survive');
      return {
        kind: 'choice',
        items: usable
          ? items
          : [
            { id: 'f', color: 'red', forbidden: true },
            { id: 's1', color: 'blue', forbidden: false },
            { id: 's2', color: 'green', forbidden: false },
          ],
        mode,
        motion: oneOf(raw.motion, ['none', 'drift', 'shuffle'] as const, 'none'),
        speed: optNum(raw.speed, 0.2, 3),
        memoryMs: optNum(raw.memoryMs, 300, 5000),
        columns: optNum(raw.columns, 1, 4),
      };
    }
    case 'chase':
      return {
        kind: 'chase',
        chaser: str(raw.chaser, '🐔'),
        chaserName: str(raw.chaserName, 'chicken'),
        collect: str(raw.collect, '🌽'),
        count: Math.round(num(raw.count, 3, 1, 8)),
        speed: num(raw.speed, 1, 0.3, 3.5),
      };
    case 'timing': {
      const delay = Array.isArray(raw.delayMs) && raw.delayMs.length === 2
        ? [num(raw.delayMs[0], 1000, 200, 6000), num(raw.delayMs[1], 2000, 200, 8000)]
        : undefined;
      return {
        kind: 'timing',
        mode: oneOf(raw.mode, ['dontWait', 'reaction', 'zone'] as const, 'dontWait'),
        delayMs: delay ? [Math.min(delay[0], delay[1]), Math.max(delay[0], delay[1])] : undefined,
        windowMs: optNum(raw.windowMs, 300, 5000),
        fakeOuts: optNum(raw.fakeOuts, 0, 5),
        zoneSize: optNum(raw.zoneSize, 0.08, 0.6),
        sweepMs: optNum(raw.sweepMs, 500, 5000),
        label: optStr(raw.label),
      };
    }
    case 'arrow':
      return {
        kind: 'arrow',
        input: oneOf(raw.input, ['tap', 'swipe'] as const, 'tap'),
        rounds: Math.round(num(raw.rounds, 1, 1, 6)),
        jitter: bool(raw.jitter),
      };
    case 'switch': {
      const phases = Array.isArray(raw.phases)
        ? raw.phases.filter(isObj).map((p) => ({
          instruction: str(p.instruction, "DON'T PRESS."),
          hint: optStr(p.hint),
          allow: p.allow === true,
          ms: num(p.ms, 1500, 300, 10000),
        }))
        : [];
      return {
        kind: 'switch',
        phases: phases.length ? phases : [{ instruction: "DON'T PRESS.", allow: false, ms: 3000 }],
        label: str(raw.label, 'BUTTON'),
        color: color(raw.color, 'red'),
        timeoutWins: raw.timeoutWins !== false,
      };
    }
    case 'shake':
      return {
        kind: 'shake',
        object: str(raw.object, '🥤'),
        objectName: str(raw.objectName, 'soda'),
        threshold: optNum(raw.threshold, 0.3, 3),
      };
    case 'drag': {
      const mode = oneOf(raw.mode, ['maze', 'dontDrag'] as const, 'dontDrag');
      const goal = rect(raw.goal);
      const start = isObj(raw.start) ? { x: num(raw.start.x, 0.15, 0, 1), y: num(raw.start.y, 0.15, 0, 1) } : undefined;
      return {
        kind: 'drag',
        // A maze without a goal is unwinnable: degrade to the "don't drag" variant.
        mode: mode === 'maze' && !goal ? 'dontDrag' : mode,
        token: str(raw.token, '⚽'),
        walls: Array.isArray(raw.walls) ? raw.walls.map(rect).filter((r): r is Rect => !!r) : undefined,
        goal,
        start,
      };
    }
    case 'count':
      return {
        kind: 'count',
        mode: oneOf(raw.mode, ['exact', 'mash'] as const, 'exact'),
        target: Math.round(num(raw.target, 5, 1, 60)),
        maxGapMs: optNum(raw.maxGapMs, 250, 3000),
        label: optStr(raw.label),
        emoji: optStr(raw.emoji),
      };
    default:
      return FALLBACK_MECHANIC;
  }
}

function goalFor(mechanic: MechanicConfig, raw: unknown): Goal {
  if (raw === 'act' || raw === 'survive') return raw;
  switch (mechanic.kind) {
    case 'chase':
    case 'timing':
    case 'arrow':
    case 'count':
      return 'act';
    case 'swipe':
      return mechanic.mode === 'flick' ? 'act' : 'survive';
    case 'hold':
      return mechanic.mode === 'dontRelease' ? 'act' : 'survive';
    case 'choice':
      return mechanic.mode === 'survive' ? 'survive' : 'act';
    case 'drag':
      return mechanic.mode === 'maze' ? 'act' : 'survive';
    case 'switch':
      return mechanic.timeoutWins ? 'survive' : 'act';
    default:
      return 'survive';
  }
}

export function sanitizeStage(raw: unknown): LevelStage {
  const o = isObj(raw) ? raw : {};
  const mechanic = sanitizeMechanic(o.mechanic);
  return {
    instruction: str(o.instruction, "DON'T TOUCH THAT."),
    hint: optStr(o.hint),
    goal: goalFor(mechanic, o.goal),
    timeLimit: num(o.timeLimit, 4000, MIN_TIME, MAX_TIME),
    mechanic,
    successMessage: optStr(o.successMessage),
    failureMessage: optStr(o.failureMessage),
    timeoutMessage: optStr(o.timeoutMessage),
  };
}

export function sanitizeLevel(raw: unknown, fallbackId = 'level'): LevelDefinition {
  const o = isObj(raw) ? raw : {};
  const stage = sanitizeStage(o);
  const difficulty = num(o.difficulty, 1, 1, 10);
  const stages = Array.isArray(o.stages) ? o.stages.slice(0, 8).map(sanitizeStage) : undefined;
  return {
    ...stage,
    id: str(o.id, fallbackId),
    type: (typeof o.type === 'string' ? o.type : 'dontTouch') as LevelType,
    difficulty,
    points: Math.round(num(o.points, 100 + difficulty * 10, 0, 100000)),
    tag: o.tag === 'boss' || o.tag === 'special' ? o.tag : undefined,
    stages: stages && stages.length ? stages : undefined,
  };
}

/** Lists problems with a level definition (used by tests and dev tooling). Empty = valid. */
export function validateLevel(level: LevelDefinition): string[] {
  const problems: string[] = [];
  const check = (stage: LevelStage, where: string) => {
    if (!stage.instruction.trim()) problems.push(`${where}: empty instruction`);
    if (stage.timeLimit < MIN_TIME || stage.timeLimit > MAX_TIME) problems.push(`${where}: timeLimit out of range`);
    const m = stage.mechanic;
    if (m.kind === 'choice') {
      if (!m.items.some((i) => !i.forbidden)) problems.push(`${where}: no safe items`);
      if (new Set(m.items.map((i) => i.id)).size !== m.items.length) problems.push(`${where}: duplicate item ids`);
    }
    if (m.kind === 'swipe' && (m.forbidden.length === 0 || m.forbidden.length === 4)) problems.push(`${where}: invalid forbidden directions`);
    if (m.kind === 'drag' && m.mode === 'maze' && !m.goal) problems.push(`${where}: maze without goal`);
    if (m.kind === 'switch' && !m.timeoutWins && !m.phases.some((p) => p.allow)) problems.push(`${where}: unwinnable switch`);
    if (goalFor(m, undefined) !== stage.goal) problems.push(`${where}: goal does not match mechanic`);
  };
  if (!level.id) problems.push('missing id');
  if (level.difficulty < 1 || level.difficulty > 10) problems.push('difficulty out of range');
  check(level, level.id);
  level.stages?.forEach((s, i) => check(s, `${level.id}#${i + 2}`));
  return problems;
}

export function stagesOf(level: LevelDefinition): LevelStage[] {
  return [level, ...(level.stages ?? [])];
}
