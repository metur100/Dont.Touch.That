/**
 * Parameterized level templates for procedurally generated levels (Endless & Daily).
 * Each template turns (rng, difficulty) into a level spec using the same factories as Classic.
 */
import {
  ALL_DIRECTIONS,
  arrowLevel,
  buttonLevel,
  chaseLevel,
  choiceLevel,
  countLevel,
  dots,
  dragLevel,
  holdLevel,
  MAZES,
  screenLevel,
  shakeLevel,
  swipeLevel,
  switchLevel,
  things,
  timingLevel,
  type LevelSpec,
} from '../levels/factories';
import type { ColorName, Direction, DistractionKind, SwitchPhase } from '../types';
import { chance, pick, randInt, shuffle, type Rng } from './random';

export interface Template {
  id: string;
  /** Minimum difficulty at which the template appears. */
  min: number;
  weight: number;
  make: (rng: Rng, d: number) => LevelSpec;
}

const COLORS: ColorName[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];
const COLOR_WORD: Record<ColorName, string> = {
  red: 'RED', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW', purple: 'PURPLE', orange: 'ORANGE', pink: 'PINK', gray: 'GRAY',
};
const DIR_WORD: Record<Direction, string> = { left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN' };

const BUTTON_LABELS = ['BUTTON', 'PRESS ME', 'DO IT', 'FREE COOKIE', 'CLICK', 'TOUCH ME', 'BOOP', '???', 'NEW!', 'PRIZE'];
const BUTTON_INSTRUCTIONS = [
  "DON'T TOUCH THE BUTTON.",
  "DON'T PRESS IT.",
  "DON'T PRESS THE BUTTON.",
  "DON'T EVEN THINK ABOUT IT.",
  "DON'T BOOP THE BUTTON.",
];
const TAUNTS = [
  ['press me', 'please', 'just once', 'come on'],
  ['boop?', 'boop!', 'BOOP', 'b o o p'],
  ['FREE', 'TOTALLY FREE', 'no catch', 'okay small catch'],
  ['you want to', 'you know you do', 'do it', 'coward'],
];

const EMOJI_SETS: { safe: string; bad: string; safeName: string; badName: string }[] = [
  { safe: '🎈', bad: '💣', safeName: 'balloons', badName: 'BOMBS' },
  { safe: '🍬', bad: '👻', safeName: 'candy', badName: 'GHOSTS' },
  { safe: '🍎', bad: '🐛', safeName: 'apples', badName: 'WORMS' },
  { safe: '💎', bad: '☠️', safeName: 'gems', badName: 'SKULLS' },
  { safe: '🐟', bad: '🦈', safeName: 'fish', badName: 'SHARKS' },
  { safe: '⭐', bad: '🌚', safeName: 'stars', badName: 'MOONS' },
  { safe: '🍩', bad: '🥦', safeName: 'donuts', badName: 'BROCCOLI' },
  { safe: '🐣', bad: '🐍', safeName: 'chicks', badName: 'SNAKES' },
];

const CHASERS = [
  { chaser: '🐔', chaserName: 'CHICKEN', collect: '🌽' },
  { chaser: '🐝', chaserName: 'BEE', collect: '🌸' },
  { chaser: '🐶', chaserName: 'DOG', collect: '🦴' },
  { chaser: '🦖', chaserName: 'DINOSAUR', collect: '🥚' },
  { chaser: '🐈', chaserName: 'CAT', collect: '🐟' },
  { chaser: '🦀', chaserName: 'CRAB', collect: '🐚' },
];

const DISTRACTIONS: DistractionKind[] = ['fly', 'notification', 'fakeContinue', 'freeGems', 'stillThere', 'lowBattery', 'fakeCrash'];

const colorsExcept = (rng: Rng, exclude: ColorName[], n: number) =>
  shuffle(rng, COLORS.filter((c) => !exclude.includes(c))).slice(0, n);

export const TEMPLATES: Template[] = [
  {
    id: 'button',
    min: 1,
    weight: 3,
    make: (rng, d) => buttonLevel({
      instruction: pick(rng, BUTTON_INSTRUCTIONS),
      label: pick(rng, BUTTON_LABELS),
      color: pick(rng, COLORS),
      motion: d < 3 ? pick(rng, ['pulse', 'wobble'] as const) : pick(rng, ['pulse', 'wobble', 'move', 'teleport', 'grow', 'runAway'] as const),
      speed: 0.8 + d * 0.15,
      taunts: chance(rng, 0.5) ? pick(rng, TAUNTS) : undefined,
      backgroundForbidden: d >= 6 && chance(rng, 0.4),
      difficulty: d,
      time: 3500 + randInt(rng, 0, 1500),
    }),
  },
  {
    id: 'screen',
    min: 1,
    weight: 2,
    make: (rng, d) => screenLevel({
      instruction: pick(rng, ["DON'T TAP.", "DON'T TOUCH THE SCREEN.", "DON'T MOVE.", "DON'T TOUCH ANYTHING."]),
      distractions: shuffle(rng, DISTRACTIONS).slice(0, Math.min(4, Math.floor(d / 2))),
      countdown: chance(rng, 0.5),
      difficulty: d,
      time: 3500 + d * 250,
    }),
  },
  {
    id: 'swipe',
    min: 1,
    weight: 2,
    make: (rng, d) => {
      const reversed = d >= 4 && chance(rng, 0.5);
      const forbidden = shuffle(rng, ALL_DIRECTIONS).slice(0, d >= 5 && chance(rng, 0.5) ? 2 : 1);
      const flick = reversed || chance(rng, 0.5);
      const words = forbidden.map((f) => DIR_WORD[f]).join(' OR ');
      return swipeLevel({
        instruction: reversed ? `DON'T SEND THE CARD ${words}.` : `DON'T SWIPE ${words}.`,
        hint: reversed ? 'Controls might be reversed...' : flick ? 'Flick it any other way.' : undefined,
        forbidden,
        mode: flick ? 'flick' : 'survive',
        reversed,
        judgeByCard: reversed,
        emoji: pick(rng, ['🃏', '💌', '🍕', '🙃', '🪃', '📦']),
        difficulty: d,
      });
    },
  },
  {
    id: 'hold',
    min: 1,
    weight: 2,
    make: (rng, d) => (chance(rng, 0.5)
      ? holdLevel({
        instruction: pick(rng, ["DON'T HOLD THE BUTTON.", "DON'T HOLD IT.", "DON'T PRESS AND HOLD."]),
        hint: 'Quick taps are fine.',
        mode: 'dontHold',
        holdMs: Math.max(300, 800 - d * 50),
        label: pick(rng, ['HOLD ME', 'HOLD 🍩', 'HUG ME', 'HOLD FOR PRIZE']),
        color: pick(rng, COLORS),
        difficulty: d,
      })
      : holdLevel({
        instruction: "DON'T LET GO.",
        hint: 'Hold until it fills up.',
        mode: 'dontRelease',
        holdMs: 1500 + d * 200,
        color: pick(rng, COLORS),
        difficulty: d,
      })),
  },
  {
    id: 'colors',
    min: 1,
    weight: 3,
    make: (rng, d) => {
      const bad = pick(rng, COLORS);
      const badCount = d >= 5 ? 2 : 1;
      const safe = colorsExcept(rng, [bad], Math.min(6, 3 + Math.floor(d / 2)));
      const memory = d >= 4 && chance(rng, 0.4);
      const motion = d >= 3 && chance(rng, 0.5) ? pick(rng, d >= 5 ? (['drift', 'shuffle'] as const) : (['drift'] as const)) : 'none';
      const pickOne = !memory && chance(rng, 0.3);
      return choiceLevel({
        instruction: `DON'T TOUCH ${COLOR_WORD[bad]}.`,
        hint: memory ? 'Memorize... then pop the rest.' : pickOne ? 'Tap any other color.' : 'Pop all the others!',
        items: dots(Array(badCount).fill(bad), safe),
        mode: pickOne ? 'pickOne' : 'clearSafe',
        memoryMs: memory ? Math.max(1100, 2000 - d * 80) : undefined,
        motion,
        speed: 0.5 + d * 0.1,
        difficulty: d,
      });
    },
  },
  {
    id: 'emoji',
    min: 2,
    weight: 3,
    make: (rng, d) => {
      const set = pick(rng, EMOJI_SETS);
      const badCount = Math.min(3, 1 + Math.floor(d / 3));
      const safeCount = Math.min(7, 3 + Math.floor(d / 2));
      const entries = shuffle(rng, [
        ...Array.from({ length: badCount }, () => [set.bad, 'gray', true] as [string, ColorName, boolean]),
        ...Array.from({ length: safeCount }, () => [set.safe, pick(rng, COLORS), false] as [string, ColorName, boolean]),
      ]);
      return choiceLevel({
        instruction: `DON'T TOUCH THE ${set.badName}.`,
        hint: `Grab all the ${set.safeName} ${set.safe}`,
        items: things(entries),
        mode: 'clearSafe',
        motion: d >= 4 && chance(rng, 0.6) ? pick(rng, ['drift', 'shuffle'] as const) : 'none',
        speed: 0.6 + d * 0.1,
        difficulty: d,
      });
    },
  },
  {
    id: 'stroop',
    min: 4,
    weight: 2,
    make: (rng, d) => {
      const words = shuffle(rng, COLORS).slice(0, 4);
      const target = pick(rng, words);
      const byWord = chance(rng, 0.5);
      // Ink = the next word's color, so a word is never printed in its own color.
      const entries = words.map((w, i) => {
        const ink = words[(i + 1) % words.length];
        const forbidden = byWord ? w === target : ink === target;
        return [COLOR_WORD[w], ink, forbidden] as [string, ColorName, boolean];
      });
      return choiceLevel({
        instruction: byWord ? `DON'T TOUCH THE WORD '${COLOR_WORD[target]}'.` : `DON'T TOUCH ANYTHING ${COLOR_WORD[target]}.`,
        hint: byWord ? 'The word, not the color.' : 'The color, not the word.',
        items: things(entries, false),
        mode: 'pickOne',
        difficulty: d,
      });
    },
  },
  {
    id: 'numbers',
    min: 2,
    weight: 2,
    make: (rng, d) => {
      const variant = pick(rng, ['biggest', 'smallest', 'odd', 'even'] as const);
      const n = Math.min(6, 3 + Math.floor(d / 3));
      // biggest/smallest: any distinct numbers. odd/even: all forbidden parity except one safe number.
      const parity = variant === 'odd' ? 1 : variant === 'even' ? 0 : -1;
      const values: number[] = [];
      while (values.length < n) {
        const v = randInt(rng, 1, 30);
        if (values.includes(v)) continue;
        if (parity >= 0 && v % 2 !== parity) continue;
        values.push(v);
      }
      // The single safe number has the opposite parity, so it can't collide with the others.
      if (parity >= 0) values[randInt(rng, 0, n - 1)] = randInt(rng, 1, 15) * 2 + (parity === 0 ? 1 : 0);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const isBad = (v: number) =>
        variant === 'biggest' ? v === max : variant === 'smallest' ? v === min : variant === 'odd' ? v % 2 === 1 : v % 2 === 0;
      return choiceLevel({
        instruction: variant === 'biggest' ? "DON'T PICK THE BIGGEST NUMBER."
          : variant === 'smallest' ? "DON'T PICK THE SMALLEST NUMBER."
            : variant === 'odd' ? "DON'T PICK AN ODD NUMBER." : "DON'T PICK AN EVEN NUMBER.",
        hint: 'Pick one.',
        items: things(values.map((v) => [String(v), pick(rng, COLORS), isBad(v)] as [string, ColorName, boolean]), false),
        mode: 'pickOne',
        difficulty: d,
      });
    },
  },
  {
    id: 'chase',
    min: 2,
    weight: 2,
    make: (rng, d) => {
      const c = pick(rng, CHASERS);
      return chaseLevel({
        instruction: `DON'T TOUCH THE ${c.chaserName}.`,
        hint: `Collect the ${c.collect}`,
        chaser: c.chaser,
        chaserName: c.chaserName.toLowerCase(),
        collect: c.collect,
        count: Math.min(5, 2 + Math.floor(d / 3)),
        speed: 0.8 + d * 0.17,
        difficulty: d,
      });
    },
  },
  {
    id: 'timing',
    min: 1,
    weight: 2,
    make: (rng, d) => {
      const mode = d < 2 ? 'dontWait' : pick(rng, ['dontWait', 'reaction', 'zone'] as const);
      if (mode === 'dontWait') {
        return timingLevel({ instruction: "DON'T WAIT!", hint: 'Tap it!', mode, label: pick(rng, ['TAP!', 'NOW!', 'GO!']), difficulty: d, time: Math.max(1600, 2800 - d * 100) });
      }
      if (mode === 'reaction') {
        return timingLevel({
          instruction: "DON'T TAP UNTIL IT'S GREEN.",
          mode,
          delayMs: [800, 2200],
          windowMs: Math.max(650, 1400 - d * 70),
          fakeOuts: d >= 4 ? Math.min(3, Math.floor((d - 2) / 2)) : 0,
          difficulty: d,
        });
      }
      return timingLevel({
        instruction: "DON'T MISS.",
        hint: 'Tap when the needle is in the zone.',
        mode,
        zoneSize: Math.max(0.13, 0.3 - d * 0.017),
        sweepMs: Math.max(950, 1800 - d * 90),
        difficulty: d,
      });
    },
  },
  {
    id: 'arrow',
    min: 3,
    weight: 2,
    make: (rng, d) => {
      const input = chance(rng, 0.5) ? 'tap' : 'swipe';
      return arrowLevel({
        instruction: input === 'tap' ? "DON'T FOLLOW THE ARROW." : "DON'T SWIPE WHERE IT POINTS.",
        input,
        rounds: Math.min(3, 1 + Math.floor(d / 4)),
        jitter: d >= 5,
        difficulty: d,
      });
    },
  },
  {
    id: 'switch',
    min: 3,
    weight: 2,
    make: (rng, d) => {
      const steps = Math.min(5, 2 + Math.floor(d / 3));
      const phases: SwitchPhase[] = [];
      const allowAt = randInt(rng, 1, steps - 1);
      for (let i = 0; i < steps; i++) {
        const allow = i === allowAt;
        phases.push({
          instruction: allow
            ? pick(rng, d >= 6 ? ['PRESS IT.', "DON'T NOT PRESS IT.", 'NOW!'] : ['PRESS IT.', 'NOW!', 'OK, PRESS.'])
            : pick(rng, ["DON'T PRESS IT.", "DON'T.", 'NOT YET.', 'WAIT...', "STILL DON'T."]),
          allow,
          ms: allow ? Math.max(800, 1600 - d * 70) : randInt(rng, 900, 1500),
        });
      }
      return switchLevel({
        instruction: phases[0].instruction,
        label: pick(rng, ['BUTTON', 'PRESS?', 'MAYBE', 'IT']),
        color: pick(rng, COLORS),
        phases,
        timeoutWins: false,
        difficulty: d,
      });
    },
  },
  {
    id: 'shake',
    min: 2,
    weight: 1,
    make: (rng, d) => {
      const o = pick(rng, [
        { object: '🥤', objectName: 'soda', instruction: "DON'T SHAKE THE SODA." },
        { object: '🧨', objectName: 'dynamite', instruction: "DON'T SHAKE THE DYNAMITE." },
        { object: '🔮', objectName: 'snow globe', instruction: "DON'T SHAKE THE SNOW GLOBE." },
        { object: '👶', objectName: 'baby', instruction: "DON'T WAKE THE BABY." },
      ]);
      return shakeLevel({ ...o, hint: 'Hold your phone still.', difficulty: d });
    },
  },
  {
    id: 'drag',
    min: 3,
    weight: 2,
    make: (rng, d) => {
      if (chance(rng, 0.3)) {
        return dragLevel({ instruction: "DON'T DRAG THE BOMB.", mode: 'dontDrag', token: pick(rng, ['💣', '🧨', '🐍']), difficulty: d });
      }
      const maze = MAZES[Math.min(MAZES.length - 1, randInt(rng, 0, Math.min(MAZES.length - 1, Math.floor(d / 3))))];
      return dragLevel({
        instruction: pick(rng, ["DON'T TOUCH THE WALLS.", "DON'T TOUCH THE LAVA.", "DON'T TOUCH THE LASERS."]),
        hint: 'Drag it to the flag 🏁',
        mode: 'maze',
        token: pick(rng, ['⚽', '🧊', '🐭', '🥷', '🐣']),
        ...maze,
        difficulty: d,
        time: 9000 + maze.walls.length * 800,
      });
    },
  },
  {
    id: 'count',
    min: 2,
    weight: 2,
    make: (rng, d) => {
      if (chance(rng, 0.5)) {
        const target = randInt(rng, 3, 4 + d);
        return countLevel({
          instruction: `DON'T TAP ${target + 1} TIMES.`,
          hint: `Exactly ${target}.`,
          mode: 'exact',
          target,
          emoji: pick(rng, ['🐸', '🐙', '🐞', '🍀', '🧘']),
          difficulty: d,
        });
      }
      return countLevel({
        instruction: "DON'T STOP TAPPING!",
        mode: 'mash',
        target: 12 + d * 2,
        maxGapMs: Math.max(420, 700 - d * 30),
        emoji: '🥁',
        difficulty: d,
      });
    },
  },
  {
    id: 'fake',
    min: 3,
    weight: 2,
    make: (rng, d) => {
      const skin = pick(rng, ['fakeSuccess', 'fakeAd', 'fakeUpdate', 'gift', 'cookie', 'eye'] as const);
      const presets = {
        fakeSuccess: { instruction: "DON'T TOUCH ANYTHING.", label: pick(rng, ['NEXT LEVEL ▶', 'CLAIM REWARD 🏆', 'YOU WIN! ▶']), backgroundForbidden: true },
        fakeAd: { instruction: "DON'T SKIP THE AD.", label: 'SKIP AD ✕', backgroundForbidden: false },
        fakeUpdate: { instruction: "DON'T INSTALL THE UPDATE.", label: 'INSTALL NOW', backgroundForbidden: false },
        gift: { instruction: "DON'T OPEN THE PRESENT.", label: 'OPEN ME', backgroundForbidden: false },
        cookie: { instruction: "DON'T EAT THE COOKIE.", label: 'EAT ME', backgroundForbidden: false },
        eye: { instruction: "DON'T LOOK AT THE BUTTON.", label: '👀', backgroundForbidden: false },
      }[skin];
      return buttonLevel({
        ...presets,
        skin,
        emoji: skin === 'gift' ? '🎁' : skin === 'cookie' ? '🍪' : undefined,
        motion: skin === 'cookie' ? 'grow' : skin === 'gift' ? 'wobble' : 'pulse',
        color: pick(rng, COLORS),
        difficulty: d,
        time: 4000 + randInt(rng, 0, 1000),
      });
    },
  },
];

export function eligibleTemplates(difficulty: number): Template[] {
  return TEMPLATES.filter((t) => t.min <= difficulty);
}

export function pickTemplate(rng: Rng, difficulty: number, avoidId?: string): Template {
  const pool = eligibleTemplates(difficulty).filter((t) => t.id !== avoidId);
  const total = pool.reduce((s, t) => s + t.weight, 0);
  let roll = rng() * total;
  for (const t of pool) {
    roll -= t.weight;
    if (roll < 0) return t;
  }
  return pool[pool.length - 1];
}
