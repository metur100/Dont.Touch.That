import { circleIntersectsRect, classifySwipe, gridSlots, invertDirection, pointInRect } from '@/game/mechanics/logic';

describe('swipe classification', () => {
  it('ignores taps and tiny moves', () => {
    expect(classifySwipe(0, 0)).toBeNull();
    expect(classifySwipe(10, 5, 50, 20)).toBeNull();
  });

  it('detects the dominant axis', () => {
    expect(classifySwipe(-120, 20)).toBe('left');
    expect(classifySwipe(120, -30)).toBe('right');
    expect(classifySwipe(10, -90)).toBe('up');
    expect(classifySwipe(-20, 80)).toBe('down');
  });

  it('accepts short but fast flicks', () => {
    expect(classifySwipe(-25, 3, -1500, 0)).toBe('left');
  });

  it('inverts directions for reversed controls', () => {
    expect(invertDirection('left')).toBe('right');
    expect(invertDirection('up')).toBe('down');
  });
});

describe('geometry', () => {
  it('lays out items inside the area without overlap', () => {
    const area = { width: 360, height: 420 };
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const slots = gridSlots(n, area);
      expect(slots).toHaveLength(n);
      for (const s of slots) {
        expect(s.x - s.r).toBeGreaterThanOrEqual(0);
        expect(s.x + s.r).toBeLessThanOrEqual(area.width);
        expect(s.y - s.r).toBeGreaterThanOrEqual(0);
        expect(s.y + s.r).toBeLessThanOrEqual(area.height);
      }
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const d = Math.hypot(slots[i].x - slots[j].x, slots[i].y - slots[j].y);
          expect(d).toBeGreaterThan(slots[i].r + slots[j].r);
        }
      }
    }
  });

  it('detects circle/rect collisions', () => {
    const wall = { x: 100, y: 100, w: 50, h: 20 };
    expect(circleIntersectsRect({ x: 125, y: 90 }, 15, wall)).toBe(true);
    expect(circleIntersectsRect({ x: 125, y: 60 }, 15, wall)).toBe(false);
    expect(pointInRect({ x: 110, y: 110 }, wall)).toBe(true);
  });
});
