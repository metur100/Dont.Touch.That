/** One call per game event = sound + haptic, so every interaction feels consistent. */
import { audio } from './audio/audio';
import { haptics } from './haptics/haptics';

export const feedback = {
  /** Neutral touch on the play area. */
  tap: () => {
    audio.play('tap');
    haptics.tap();
  },
  /** Collecting/popping a safe item. */
  pop: () => {
    audio.play('pop');
    haptics.tap();
  },
  button: () => {
    audio.play('button');
    haptics.button();
  },
  success: () => {
    audio.play('success');
    haptics.success();
  },
  failure: () => {
    audio.play('failure');
    haptics.failure();
  },
  streak: () => {
    audio.play('streak');
    haptics.success();
  },
  levelStart: (boss: boolean) => {
    audio.play(boss ? 'boss' : 'levelStart');
    if (boss) haptics.boss();
  },
  countdown: () => {
    audio.play('countdown');
    haptics.selection();
  },
  whoosh: () => {
    audio.play('whoosh');
    haptics.selection();
  },
  warning: () => {
    audio.play('countdown');
    haptics.warning();
  },
};
