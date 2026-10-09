import { FALLBACK_MECHANIC, sanitizeLevel, sanitizeMechanic, validateLevel } from '@/game/engine/validation';

describe('level validation & sanitizing', () => {
  it('turns garbage into a playable fallback level', () => {
    for (const garbage of [null, undefined, 42, 'level', [], {}, { mechanic: 'nope' }]) {
      const level = sanitizeLevel(garbage, 'x');
      expect(level.id).toBe('x');
      expect(level.instruction.length).toBeGreaterThan(0);
      expect(level.mechanic).toEqual(FALLBACK_MECHANIC);
      expect(validateLevel(level)).toEqual([]);
    }
  });

  it('clamps out-of-range numbers', () => {
    const level = sanitizeLevel({ id: 'a', instruction: 'X', timeLimit: 999999, difficulty: 99, mechanic: { kind: 'screen' } });
    expect(level.timeLimit).toBe(20000);
    expect(level.difficulty).toBe(10);
  });

  it('fills missing optional configuration with defaults', () => {
    const m = sanitizeMechanic({ kind: 'hold' });
    expect(m).toMatchObject({ kind: 'hold', mode: 'dontHold', holdMs: 800 });
  });

  it('never allows an unwinnable swipe level', () => {
    expect(sanitizeMechanic({ kind: 'swipe', forbidden: ['left', 'right', 'up', 'down'] })).toMatchObject({ forbidden: ['left'] });
    expect(sanitizeMechanic({ kind: 'swipe', forbidden: ['sideways'] })).toMatchObject({ forbidden: ['left'] });
  });

  it('repairs choice levels without a safe item', () => {
    const m = sanitizeMechanic({ kind: 'choice', items: [{ id: 'a', color: 'red', forbidden: true }] });
    if (m.kind !== 'choice') throw new Error('expected choice');
    expect(m.items.some((i) => !i.forbidden)).toBe(true);
  });

  it('degrades a maze without a goal to a "don\'t drag" level', () => {
    expect(sanitizeMechanic({ kind: 'drag', mode: 'maze', walls: [] })).toMatchObject({ mode: 'dontDrag' });
  });

  it('infers the goal from the mechanic when missing', () => {
    expect(sanitizeLevel({ mechanic: { kind: 'chase' } }).goal).toBe('act');
    expect(sanitizeLevel({ mechanic: { kind: 'screen' } }).goal).toBe('survive');
  });

  it('reports a goal/mechanic mismatch', () => {
    const level = { ...sanitizeLevel({ id: 'z', mechanic: { kind: 'screen' } }), goal: 'act' as const };
    expect(validateLevel(level).join()).toMatch(/goal does not match/);
  });
});
