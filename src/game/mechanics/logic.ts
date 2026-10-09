/** Pure geometry/gesture helpers shared by mechanics (unit-tested, no React). */
import type { Direction, Rect } from '../types';
import type { PlayArea, Point } from './types';

export const SWIPE_MIN_DISTANCE = 45;
export const SWIPE_MIN_VELOCITY = 600;

/**
 * Classifies a finger movement as a swipe direction, or null for taps/small moves.
 * A swipe needs enough distance OR a quick flick, and the dominant axis wins.
 */
export function classifySwipe(dx: number, dy: number, vx = 0, vy = 0): Direction | null {
  const dist = Math.hypot(dx, dy);
  const speed = Math.hypot(vx, vy);
  if (dist < SWIPE_MIN_DISTANCE && !(dist > 15 && speed > SWIPE_MIN_VELOCITY)) return null;
  // Use velocity direction for quick flicks, displacement otherwise.
  const [x, y] = dist >= SWIPE_MIN_DISTANCE ? [dx, dy] : [vx, vy];
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

export function invertDirection(d: Direction): Direction {
  return d === 'left' ? 'right' : d === 'right' ? 'left' : d === 'up' ? 'down' : 'up';
}

export function directionVector(d: Direction): Point {
  return d === 'left' ? { x: -1, y: 0 } : d === 'right' ? { x: 1, y: 0 } : d === 'up' ? { x: 0, y: -1 } : { x: 0, y: 1 };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointInCircle(p: Point, c: Point, r: number): boolean {
  return distance(p, c) <= r;
}

export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/** Converts a fractional rect (0..1) to pixels within the play area. */
export function toPixels(r: Rect, area: PlayArea): Rect {
  return { x: r.x * area.width, y: r.y * area.height, w: r.w * area.width, h: r.h * area.height };
}

export function circleIntersectsRect(c: Point, radius: number, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return Math.hypot(c.x - nx, c.y - ny) < radius;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export interface Slot extends Point {
  r: number;
}

/** Grid layout for N round items, sized to fit the area. */
export function gridSlots(n: number, area: PlayArea, columns?: number): Slot[] {
  const cols = columns ?? (n <= 2 ? 2 : n <= 4 ? 2 : n <= 9 ? 3 : 4);
  const rows = Math.ceil(n / cols);
  const cellW = area.width / cols;
  const cellH = area.height / rows;
  const r = Math.min(cellW, cellH) * 0.36;
  const slots: Slot[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    // Center incomplete last rows.
    const offset = (cols - inRow) * cellW * 0.5;
    const col = i % cols;
    slots.push({ x: offset + cellW * (col + 0.5), y: cellH * (row + 0.5), r });
  }
  return slots;
}

/** Random point inside the area keeping `margin` from the edges. */
export function randomPoint(area: PlayArea, margin: number, rnd: () => number = Math.random): Point {
  return {
    x: margin + rnd() * Math.max(1, area.width - margin * 2),
    y: margin + rnd() * Math.max(1, area.height - margin * 2),
  };
}

/** A random point at least `minDist` away from `avoid` (best effort). */
export function randomPointAwayFrom(area: PlayArea, margin: number, avoid: Point, minDist: number): Point {
  let best = randomPoint(area, margin);
  for (let i = 0; i < 12; i++) {
    const p = randomPoint(area, margin);
    if (distance(p, avoid) >= minDist) return p;
    if (distance(p, avoid) > distance(best, avoid)) best = p;
  }
  return best;
}
