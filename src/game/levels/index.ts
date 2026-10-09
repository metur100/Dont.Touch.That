import { sanitizeLevel } from '../engine/validation';
import type { LevelDefinition } from '../types';
import { LEVELS_1_10, LEVELS_11_30 } from './chapter1';
import { LEVELS_31_60, LEVELS_61_90 } from './chapter2';
import { LEVELS_91_100 } from './chapter3';

const SPECS = [...LEVELS_1_10, ...LEVELS_11_30, ...LEVELS_31_60, ...LEVELS_61_90, ...LEVELS_91_100];

export const classicLevelId = (index: number) => `classic-${String(index + 1).padStart(3, '0')}`;

/** All classic levels, in order. Sanitized once at startup so bad data can't crash a run. */
export const CLASSIC_LEVELS: LevelDefinition[] = SPECS.map((spec, i) => sanitizeLevel({ ...spec, id: classicLevelId(i) }, classicLevelId(i)));

export const LEVELS_PER_CHAPTER = 10;

export const CHAPTERS = [
  { title: 'Hands Off', emoji: '✋' },
  { title: 'Things Move', emoji: '🐔' },
  { title: 'Tempting', emoji: '🎁' },
  { title: 'Liar Liar', emoji: '🤥' },
  { title: 'Upside Down', emoji: '🙃' },
  { title: 'Big Brain', emoji: '🧠' },
  { title: 'Chaos', emoji: '🌪️' },
  { title: 'No Mercy', emoji: '😈' },
  { title: 'Almost Zen', emoji: '🧘' },
  { title: 'The Gauntlet', emoji: '👑' },
].map((c, i) => ({ ...c, index: i, firstLevel: i * LEVELS_PER_CHAPTER }));

export function getClassicLevel(index: number): LevelDefinition | undefined {
  return CLASSIC_LEVELS[index];
}
