import { createRun, runReducer, type ResolveLevelInfo, type RunState } from '@/game/engine/runReducer';
import { calculateScore, FAST_BONUS, isFast, streakBonus, streakMilestone } from '@/game/engine/scoring';

const LEVEL: ResolveLevelInfo = { points: 100, goal: 'survive', timeLimit: 4000, boss: false };
const ACT: ResolveLevelInfo = { points: 120, goal: 'act', timeLimit: 5000, boss: false };

const win = (s: RunState, level = LEVEL, reactionMs = 4000) =>
  runReducer(runReducer(s, { type: 'resolve', success: true, level, reactionMs, message: 'ok' }), { type: 'advance' });
const lose = (s: RunState) =>
  runReducer(runReducer(s, { type: 'resolve', success: false, level: LEVEL, reactionMs: 100, message: 'no' }), { type: 'advance' });

describe('scoring', () => {
  it('awards base points for a plain success', () => {
    expect(calculateScore({ basePoints: 100, goal: 'survive', reactionMs: 4000, timeLimit: 4000, streak: 1 })).toEqual({
      base: 100,
      speed: 0,
      streak: 0,
      total: 100,
      fast: false,
    });
  });

  it('gives a fast bonus only for quick act levels', () => {
    expect(isFast('act', 900, 5000)).toBe(true);
    expect(isFast('act', 3000, 5000)).toBe(false);
    expect(isFast('survive', 10, 5000)).toBe(false);
    expect(calculateScore({ basePoints: 100, goal: 'act', reactionMs: 500, timeLimit: 5000, streak: 1 }).speed).toBe(FAST_BONUS);
  });

  it('streak bonus grows by 25 and caps', () => {
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(2)).toBe(25);
    expect(streakBonus(5)).toBe(100);
    expect(streakBonus(100)).toBe(250);
  });

  it('announces streak milestones', () => {
    expect(streakMilestone(10)).toBe("YOU'RE LEARNING TO RESIST.");
    expect(streakMilestone(20)).toBe('SUSPICIOUSLY GOOD.');
    expect(streakMilestone(50)).toBe("YOU'VE BECOME THE MASTER OF NOT TOUCHING THINGS.");
    expect(streakMilestone(11)).toBeNull();
  });
});

describe('run reducer', () => {
  it('starts with 3 lives and no score', () => {
    const run = createRun('classic');
    expect(run.lives).toBe(3);
    expect(run.score).toBe(0);
    expect(run.status).toBe('playing');
  });

  it('builds a streak and adds streak bonus on consecutive wins', () => {
    let run = createRun('endless');
    run = win(run);
    run = win(run);
    run = win(run);
    expect(run.streak).toBe(3);
    expect(run.bestStreak).toBe(3);
    // 100 + (100 + 25) + (100 + 50)
    expect(run.score).toBe(375);
  });

  it('breaks the streak and costs a life on failure', () => {
    let run = createRun('endless');
    run = win(run);
    run = win(run);
    run = lose(run);
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(2);
    expect(run.lives).toBe(2);
  });

  it('classic retries the failed level; endless moves on', () => {
    const classic = lose(createRun('classic', 4));
    expect(classic.index).toBe(4);
    const endless = lose(createRun('endless'));
    expect(endless.index).toBe(1);
  });

  it('ends the game after three mistakes', () => {
    let run = createRun('classic');
    run = lose(lose(lose(run)));
    expect(run.lives).toBe(0);
    expect(run.status).toBe('over');
  });

  it('completes a fixed-length mode after the last level', () => {
    let run = createRun('daily');
    for (let i = 0; i < 10; i++) run = win(run);
    expect(run.status).toBe('complete');
    expect(run.successes).toBe(10);
  });

  it('revives once with one life', () => {
    let run = lose(lose(lose(createRun('endless'))));
    run = runReducer(run, { type: 'revive' });
    expect(run.status).toBe('playing');
    expect(run.lives).toBe(1);
    run = lose(run);
    expect(run.status).toBe('over');
    expect(runReducer(run, { type: 'revive' }).status).toBe('over');
  });

  it('ignores resolve while showing a result (no double scoring)', () => {
    let run = createRun('endless');
    run = runReducer(run, { type: 'resolve', success: true, level: ACT, reactionMs: 100, message: 'a' });
    const again = runReducer(run, { type: 'resolve', success: true, level: ACT, reactionMs: 100, message: 'b' });
    expect(again).toBe(run);
  });

  it('tracks perfect streaks for fast/clean successes', () => {
    let run = createRun('endless');
    run = win(run, ACT, 300);
    run = win(run, LEVEL, 4000);
    expect(run.perfectStreak).toBe(2);
    run = win(run, ACT, 4900);
    expect(run.perfectStreak).toBe(0);
  });

  it('restart resets the run at a new start index', () => {
    const run = runReducer(win(createRun('classic', 10)), { type: 'restart', startIndex: 20 });
    expect(run.index).toBe(20);
    expect(run.score).toBe(0);
  });
});
