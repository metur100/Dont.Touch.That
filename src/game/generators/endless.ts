/**
 * Endless & Daily level generation. Generation is a pure function of (seed, index), so a run can be
 * reproduced exactly and the Daily Challenge is identical for every player on the same date.
 */
import { sanitizeLevel } from '../engine/validation';
import { bossLevel, screenLevel, type LevelSpec } from '../levels/factories';
import type { DistractionKind, LevelDefinition } from '../types';
import { createRng, hashString, pick, shuffle, type Rng } from './random';
import { pickTemplate } from './templates';

export const SPECIAL_EVERY = 10;
export const BOSS_EVERY = 25;

/** Difficulty for the n-th endless level (0-based): ramps up every 5 levels, caps at 10. */
export function endlessDifficulty(index: number): number {
  return Math.min(10, 1 + Math.floor(index / 5));
}

export type RoundKind = 'normal' | 'special' | 'boss';

export function endlessRoundKind(index: number): RoundKind {
  const n = index + 1;
  if (n % BOSS_EVERY === 0) return 'boss';
  if (n % SPECIAL_EVERY === 0) return 'special';
  return 'normal';
}

const levelRng = (seed: number, index: number, salt = ''): Rng => createRng(hashString(`${seed}:${index}${salt}`));

/** The template a given index would pick before de-duplication (used to avoid repeats). */
function rawTemplateId(seed: number, index: number): string {
  return pickTemplate(levelRng(seed, index, ':t'), endlessDifficulty(index)).id;
}

function normalSpec(seed: number, index: number, difficulty: number): LevelSpec {
  const avoid = index > 0 ? rawTemplateId(seed, index - 1) : undefined;
  const template = pickTemplate(levelRng(seed, index, ':t'), difficulty, avoid);
  return template.make(levelRng(seed, index, ':m'), difficulty);
}

const BOSS_DISTRACTIONS: DistractionKind[] = ['fly', 'notification', 'fakeContinue', 'freeGems', 'stillThere', 'fakeCrash'];

function bossSpec(rng: Rng, seed: number, index: number, difficulty: number): LevelSpec {
  const d = Math.min(10, difficulty + 1);
  const opener = screenLevel({
    instruction: "DON'T TOUCH ANYTHING.",
    hint: 'BOSS ROUND',
    distractions: shuffle(rng, BOSS_DISTRACTIONS).slice(0, 3),
    countdown: true,
    difficulty: d,
    time: 5000,
  });
  return bossLevel(
    { difficulty: d, success: pick(rng, ['BOSS DEFEATED.', 'The boss cries quietly.', 'Too easy. (It was not.)']) },
    opener,
    normalSpec(seed, index * 1000 + 1, d),
    normalSpec(seed, index * 1000 + 2, d),
  );
}

export function generateLevel(seed: number, index: number, idPrefix = 'endless'): LevelDefinition {
  const difficulty = endlessDifficulty(index);
  const kind = endlessRoundKind(index);
  const rng = levelRng(seed, index, ':k');
  let spec: LevelSpec;
  if (kind === 'boss') {
    spec = bossSpec(rng, seed, index, difficulty);
  } else if (kind === 'special') {
    spec = bossLevel(
      { difficulty, tag: 'special', success: 'SPECIAL ROUND CLEARED!' },
      normalSpec(seed, index, difficulty),
      normalSpec(seed, index * 1000 + 7, difficulty),
    );
  } else {
    spec = normalSpec(seed, index, difficulty);
  }
  const id = `${idPrefix}-${index + 1}`;
  return sanitizeLevel({ ...spec, id }, id);
}

// ---------- Daily challenge ----------

export const DAILY_LENGTH = 10;
const DAILY_DIFFICULTY = [2, 3, 3, 4, 5, 5, 6, 7, 8, 8];

/** Local date as YYYY-MM-DD. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dailySeed(key: string): number {
  return hashString(`dont-touch-that:daily:${key}`);
}

export function generateDailyChallenge(key: string): LevelDefinition[] {
  const seed = dailySeed(key);
  return DAILY_DIFFICULTY.map((difficulty, index) => {
    const id = `daily-${key}-${index + 1}`;
    const rng = levelRng(seed, index, ':k');
    const spec = index === DAILY_LENGTH - 1 ? bossSpec(rng, seed, index, difficulty) : normalSpec(seed, index, difficulty);
    return sanitizeLevel({ ...spec, id }, id);
  });
}
