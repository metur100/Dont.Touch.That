/** Single source for every store text. Run `node store/_tools/docs.mjs` after editing. */

/** Fill these in once (they are used in every document). */
export const CONTACT = {
  name: 'Medin Turkes',
  /** Required by both stores (support contact, shown publicly on Google Play). */
  email: 'YOUR-SUPPORT-EMAIL@example.com',
  /** Where you host store/site/ (e.g. GitHub Pages). Privacy policy = `${site}/privacy.html`. */
  site: 'https://YOUR-GITHUB-USER.github.io/dont-touch-that',
};

export const APP = {
  name: "Don't Touch That!",
  androidPackage: 'com.medinturkes.donttouchthat',
  iosBundleId: 'com.medinturkes.donttouchthat',
  sku: 'DONTTOUCHTHAT001',
  version: '1.0.0',
  copyright: `2026 ${CONTACT.name}`,
};

export const PLAY = {
  title: "Don't Touch That!",
  short: '100 levels of buttons you must NOT press. Can you resist? Probably not.',
  full: `Don't touch the button.
...You're going to touch the button, aren't you?

DON'T TOUCH THAT! is a funny reaction and puzzle game about the one thing humans are worst at: NOT doing the thing they were just told not to do.

Every level gives you one simple instruction. Don't tap. Don't swipe left. Don't hold the button. Don't touch the red one. Easy, right? Then the game starts cheating. Buttons pulse, beg and run away. A chicken chases your finger. Fake "LEVEL COMPLETE" screens appear. Instructions change while you read them. Controls reverse. And sometimes you actually have to touch something – fast.

100 HAND-MADE LEVELS
• Big tempting buttons, moving buttons, buttons that run away
• Don't touch the chicken (it knows)
• Memory, reaction, timing and swipe challenges
• Fake buttons, fake ads, fake success screens – trust nothing
• Reversed controls and instructions that lie
• 10 chapters, ending in multi-stage boss levels

3 GAME MODES
• Classic – 100 levels, 3 lives, chapter by chapter
• Endless – random challenges that keep getting harder, with special rounds every 10 levels and boss rounds every 25
• Daily Challenge – the same 10 levels for everyone each day, one official attempt (practice as often as you like)

RESIST AND SCORE
• Streaks, fast-reaction bonuses and streak milestones
• 13 achievements, including "Curiosity Killed the Button"
• Detailed stats – how many things have you touched?
• Unlockable themes: Neon, Space, Underwater, Halloween and Christmas

MADE FOR ONE THUMB
• Levels take 3–15 seconds – perfect for quick breaks
• Satisfying animations, sounds and haptic feedback
• Light and dark mode, colour-name labels for colour-blind players, reduced screen shake

FAIR AND PRIVATE
• Free – no ads, no in-app purchases
• No account, no tracking, no data collection
• Fully offline – play anywhere

Whatever you do... DON'T TOUCH THAT.`,
  releaseNotes: 'First release. Try not to touch anything.',
};

export const IOS = {
  name: "Don't Touch That!",
  subtitle: 'Resist the big red button',
  promo: '100 levels that tell you what NOT to touch – then do everything to make you touch it. Classic, Endless and a Daily Challenge. Free, no ads, offline.',
  keywords: 'button,reaction,funny,puzzle,brain,tap,resist,trick,prank,casual,daily,challenge,reflex,troll',
  // The App Store description: same text as Google Play.
  description: PLAY.full,
  releaseNotes: PLAY.releaseNotes,
  reviewNotes: `No account or login is needed; everything works offline. The app has no ads, no in-app purchases, no analytics and no tracking.

How to play: each level tells you what NOT to do. Breaking the rule costs one of three lives – that is the joke of the game, not a bug. Some levels require an action (e.g. "Pop all the others!"); the hint under the instruction says so.

One optional level type ("Don't shake the soda") reads the accelerometer on the device only to detect shaking; no motion data is stored or sent.`,
};

/** Screenshot captions (title, subtitle) in screenshot order. */
export const CAPTIONS = [
  ['Whatever you do…', "DON'T TOUCH THAT!"],
  ['It is RIGHT there.', "Don't press the big button"],
  ['You will fail.', 'And it will be hilarious'],
  ['The chicken knows.', 'Grab the corn. Avoid the chicken'],
  ['Pop. Don’t boom.', 'Read carefully. Then tap'],
  ['Trust nothing.', 'Fake buttons. Fake wins'],
  ['Memory. Reflexes.', 'Lies. 100 levels of it'],
  ['A new challenge daily', 'Same levels for everyone'],
];
