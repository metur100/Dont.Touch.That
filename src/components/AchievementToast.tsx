/** Global toast that pops up whenever an achievement unlocks (queue-driven, never blocks input). */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { feedback } from '@/services/feedback';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

import { GText } from './GText';

export function AchievementToast() {
  const current = useProgress((st) => st.achievementQueue[0]);
  const shift = useProgress((st) => st.shiftAchievement);
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) return;
    feedback.streak();
    const t = setTimeout(shift, 2600);
    return () => clearTimeout(t);
  }, [current, shift]);

  if (!current) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Animated.View
        key={current.id}
        entering={SlideInUp.springify().damping(14)}
        exiting={SlideOutUp.duration(200)}
        style={[styles.toast, { backgroundColor: palette.surface, borderColor: palette.warning }]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Achievement unlocked: ${current.title}`}
      >
        <GText size={30}>{current.emoji}</GText>
        <View style={styles.text}>
          <GText variant="label" size={12} color={palette.warning}>ACHIEVEMENT UNLOCKED</GText>
          <GText variant="heading" size={18}>{current.title}</GText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 3, maxWidth: 420, width: '100%' },
  text: { flex: 1 },
});
