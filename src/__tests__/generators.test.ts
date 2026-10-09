import { stagesOf, validateLevel } from '@/game/engine/validation';
import {
  dailySeed,
  dateKey,
  DAILY_LENGTH,
  endlessDifficulty,
  endlessRoundKind,
  generateDailyChallenge,
  generateLevel,
} from '@/game/generators/endless';
import { createRng, hashString, shuffle } from '@/game/generators/random';
import { TEMPLATES } from '@/game/generators/templates';

describe('random', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, a);
    const seqB = Array.from({ length: 20 }, b);
    expect(seqA).toEqual(seqB);
    seqA.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  it('hashes strings stably', () => {
    expect(hashString('2026-10-09')).toBe(hashString('2026-10-09'));
    expect(hashString('2026-10-09')).not.toBe(hashString('2026-10-10'));
  });

  it('shuffle keeps all elements', () => {
    expect(shuffle(createRng(1), [1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('daily challenge', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 9, 7))).toBe('2026-10-07');
    expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('derives a stable seed from the date', () => {
    expect(dailySeed('2026-10-07')).toBe(dailySeed('2026-10-07'));
    expect(dailySeed('2026-10-07')).not.toBe(dailySeed('2026-10-08'));
  });

  it('generates the same challenge for the same date', () => {
    const a = generateDailyChallenge('2026-10-07');
    const b = generateDailyChallenge('2026-10-07');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('generates different challenges on different dates', () => {
    const a = JSON.stringify(generateDailyChallenge('2026-10-07').map((l) => l.mechanic));
    const b = JSON.stringify(generateDailyChallenge('2026-10-08').map((l) => l.mechanic));
    expect(a).not.toBe(b);
  });

  it('has 10 valid levels ending in a boss', () => {
    const levels = generateDailyChallenge('2026-12-24');
    expect(levels).toHaveLength(DAILY_LENGTH);
    expect(levels[DAILY_LENGTH - 1].tag).toBe('boss');
    expect(levels.flatMap(validateLevel)).toEqual([]);
  });
});

describe('endless generation', () => {
  it('is reproducible for a seed + index', () => {
    expect(JSON.stringify(generateLevel(123, 7))).toBe(JSON.stringify(generateLevel(123, 7)));
  });

  it('has special rounds every 10 and boss rounds every 25 levels', () => {
    expect(endlessRoundKind(9)).toBe('special');
    expect(endlessRoundKind(19)).toBe('special');
    expect(endlessRoundKind(24)).toBe('boss');
    expect(endlessRoundKind(49)).toBe('boss');
    expect(endlessRoundKind(5)).toBe('normal');
    expect(generateLevel(1, 24).tag).toBe('boss');
    expect(stagesOf(generateLevel(1, 24)).length).toBe(3);
    expect(generateLevel(1, 9).tag).toBe('special');
  });

  it('ramps difficulty and caps at 10', () => {
    expect(endlessDifficulty(0)).toBe(1);
    expect(endlessDifficulty(5)).toBe(2);
    expect(endlessDifficulty(1000)).toBe(10);
  });

  it('only produces valid levels (fuzz: 20 seeds x 60 levels)', () => {
    for (let seed = 0; seed < 20; seed++) {
      for (let i = 0; i < 60; i++) {
        const level = generateLevel(seed * 7919, i);
        expect(validateLevel(level)).toEqual([]);
      }
    }
  });

  it('every template produces valid levels at every difficulty', () => {
    for (const t of TEMPLATES) {
      for (let d = t.min; d <= 10; d++) {
        for (let s = 0; s < 10; s++) {
          const spec = t.make(createRng(s * 31 + d), d);
          const problems = validateLevel({ ...spec, id: `${t.id}-${d}-${s}` });
          expect({ template: t.id, problems }).toEqual({ template: t.id, problems: [] });
        }
      }
    }
  });

  it('number puzzles always have at least one safe answer', () => {
    const numbers = TEMPLATES.find((t) => t.id === 'numbers')!;
    for (let s = 0; s < 200; s++) {
      const spec = numbers.make(createRng(s), 6);
      if (spec.mechanic.kind !== 'choice') throw new Error('expected choice');
      expect(spec.mechanic.items.some((i) => !i.forbidden)).toBe(true);
      expect(spec.mechanic.items.some((i) => i.forbidden)).toBe(true);
    }
  });
});
