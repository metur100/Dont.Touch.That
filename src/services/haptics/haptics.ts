/** Haptic feedback with a settings gate. Haptic failures (unsupported device, web) are ignored. */
import * as Haptics from 'expo-haptics';

import { getSettings } from '@/store/progressStore';

const safe = (fn: () => Promise<void>) => {
  if (!getSettings().haptics) return;
  fn().catch(() => undefined);
};

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  button: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  failure: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Two heavy thumps for boss moments. */
  boss: () =>
    safe(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise((r) => setTimeout(r, 90));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }),
};
