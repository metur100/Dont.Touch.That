/** The humor system: categorized message pools. Picked at random, never the same twice in a row. */
import type { LevelType } from '@/game/types';

export const MESSAGES = {
  success: [
    'Good job.',
    'You resisted.',
    'Impressive.',
    'Self-control detected.',
    'Okay, you actually listened.',
    "I didn't expect that.",
    'Fine. You win.',
    'Suspiciously obedient.',
    'Your thumb behaved.',
    'Willpower: unlocked.',
    'The button weeps.',
    'Calm. Collected. Untouched.',
  ],
  actSuccess: [
    'Nailed it.',
    'Smooth.',
    'Fast AND correct? Rude.',
    'Okay, show-off.',
    'Clean.',
    'Textbook.',
  ],
  failure: [
    "I SAID DON'T.",
    'Why?',
    'You had ONE job.',
    'Seriously?',
    'You touched it.',
    'I literally warned you.',
    'That was the forbidden one.',
    "You couldn't resist.",
    'The button was RIGHT THERE.',
    "I knew you'd do it.",
    'Congratulations. You failed successfully.',
    'Bold. Wrong, but bold.',
    'Curiosity: 1. You: 0.',
  ],
  timeout: [
    'Too slow!',
    'You waited. Interesting choice.',
    'Time is up. So is my patience.',
    'Hello? Anyone there?',
    'That was the moment. It passed.',
  ],
  /** Shown on failure with a fake "+100", then the joke lands. */
  fakeReward: ['+100', '+100?', '+1000'],
  gameOver: [
    'YOU TOUCHED TOO MANY THINGS.',
    'HANDS. OFF. NEXT TIME.',
    'THE BUTTONS HAVE WON.',
  ],
  introTap: [
    "I haven't even started.",
    'Already?!',
    'Patience.',
    'Not yet!',
  ],
  menuTitleTap: [
    "Don't touch the title.",
    'Hey!',
    'That tickles.',
    'Stop that.',
    "It's not a button.",
    '...okay, it is a little bit a button.',
  ],
} as const;

const TYPE_FAILURE: Partial<Record<LevelType, string[]>> = {
  dontSwipeLeft: ['Left. You went LEFT.', 'Everything moves right now. Happy?'],
  dontSwipeRight: ['Swiped right. On a forbidden card.', 'Wrong way!'],
  dontHold: ['That was a hold. I felt it.', 'Short taps. SHORT.'],
  dontRelease: ['You let go!', 'Commitment issues?'],
  memory: ['Memory of a goldfish 🐟', 'It WAS there. Trust me.'],
  reverse: ['Controls were reversed. Sorry. Not sorry.', 'Your left is my right.'],
  chase: ['It caught you.', 'Too close!'],
  reaction: ['Too early!', 'Jumpy, are we?'],
  fakeSuccess: ['YOU THOUGHT.', 'Nothing is real.'],
  fakeButton: ['It was fake. Like my enthusiasm.', 'Lies everywhere.'],
  invisible: ["You can't see it, but it can see you.", 'Invisible ≠ absent.'],
  boss: ['The boss laughs at you.', 'So close. So far.'],
};

let lastPicked = '';

function pickFrom(pool: readonly string[]): string {
  if (pool.length === 0) return '';
  let choice = pool[Math.floor(Math.random() * pool.length)];
  if (choice === lastPicked && pool.length > 1) choice = pool[(pool.indexOf(choice) + 1) % pool.length];
  lastPicked = choice;
  return choice;
}

export type MessageCategory = keyof typeof MESSAGES;

export function pickMessage(category: MessageCategory): string {
  return pickFrom(MESSAGES[category]);
}

/** Failure message: level override > type-specific joke (sometimes) > generic. */
export function failureMessage(type: LevelType, override?: string): string {
  if (override) return override;
  const typed = TYPE_FAILURE[type];
  if (typed && Math.random() < 0.6) return pickFrom(typed);
  return pickFrom(MESSAGES.failure);
}
