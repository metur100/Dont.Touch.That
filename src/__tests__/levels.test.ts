import { stagesOf, validateLevel } from '@/game/engine/validation';
import { CHAPTERS, CLASSIC_LEVELS, LEVELS_PER_CHAPTER } from '@/game/levels';

describe('classic levels', () => {
  it('has exactly 100 levels with unique ids', () => {
    expect(CLASSIC_LEVELS).toHaveLength(100);
    expect(new Set(CLASSIC_LEVELS.map((l) => l.id)).size).toBe(100);
    expect(CLASSIC_LEVELS[0].id).toBe('classic-001');
    expect(CLASSIC_LEVELS[99].id).toBe('classic-100');
  });

  it('every level passes validation', () => {
    const problems = CLASSIC_LEVELS.flatMap((l) => validateLevel(l));
    expect(problems).toEqual([]);
  });

  it('teaches the basics first (onboarding levels 1-5)', () => {
    const first = CLASSIC_LEVELS.slice(0, 5).map((l) => l.instruction);
    expect(first).toEqual([
      "DON'T TOUCH THE BUTTON.",
      "DON'T TAP.",
      "DON'T SWIPE LEFT.",
      "DON'T HOLD THE BUTTON.",
      "DON'T TOUCH THE RED ONE.",
    ]);
  });

  it('uses many different mechanics', () => {
    const kinds = new Set(CLASSIC_LEVELS.flatMap((l) => stagesOf(l).map((s) => s.mechanic.kind)));
    expect(kinds.size).toBeGreaterThanOrEqual(12);
    const types = new Set(CLASSIC_LEVELS.map((l) => l.type));
    expect(types.size).toBeGreaterThanOrEqual(18);
  });

  it('gets harder: average difficulty rises across the bands', () => {
    const avg = (from: number, to: number) => {
      const slice = CLASSIC_LEVELS.slice(from, to);
      return slice.reduce((s, l) => s + l.difficulty, 0) / slice.length;
    };
    const bands = [avg(0, 10), avg(10, 30), avg(30, 60), avg(60, 90), avg(90, 100)];
    for (let i = 1; i < bands.length; i++) expect(bands[i]).toBeGreaterThan(bands[i - 1]);
  });

  it('levels 91-100 are all multi-stage boss levels', () => {
    for (const level of CLASSIC_LEVELS.slice(90)) {
      expect(level.tag).toBe('boss');
      expect(stagesOf(level).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps every stage within the 1.5s - 20s window', () => {
    for (const level of CLASSIC_LEVELS) {
      for (const stage of stagesOf(level)) {
        expect(stage.timeLimit).toBeGreaterThanOrEqual(1500);
        expect(stage.timeLimit).toBeLessThanOrEqual(20000);
      }
    }
  });

  it('defines 10 chapters of 10 levels', () => {
    expect(CHAPTERS).toHaveLength(10);
    expect(CHAPTERS[9].firstLevel).toBe(90);
    expect(LEVELS_PER_CHAPTER * CHAPTERS.length).toBe(CLASSIC_LEVELS.length);
  });
});
