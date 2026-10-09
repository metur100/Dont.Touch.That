/**
 * exact: tap exactly N times, then stop. One more tap fails.
 * mash:  don't stop tapping until the drum is full — pausing too long fails.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { usePop } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import type { CountConfig } from '../types';
import type { MechanicProps } from './types';

const EXACT_SETTLE_MS = 900;

export function CountMechanic({ config, area, api }: MechanicProps<CountConfig>) {
  const { palette, s } = useTheme();
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pop = usePop();
  const progress = useSharedValue(0);
  const size = Math.min(area.width, area.height) * 0.42;
  const mash = config.mode === 'mash';

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onPressIn = () => {
    if (api.isDone()) return;
    const n = countRef.current + 1;
    countRef.current = n;
    setCount(n);
    pop.trigger();
    feedback.tap();
    api.touch();
    progress.set(withTiming(Math.min(1, n / config.target), { duration: 90 }));
    if (timer.current) clearTimeout(timer.current);

    if (mash) {
      if (n >= config.target) {
        api.succeed('Drum solo complete. 🥁');
        return;
      }
      timer.current = setTimeout(() => api.fail('You stopped. The band is disappointed.'), config.maxGapMs ?? 650);
      return;
    }
    if (n > config.target) {
      api.fail(`${n}. You tapped ${n} times.`);
      return;
    }
    if (n === config.target) {
      // Time running out right after the last tap still counts as a win.
      api.setTimeoutResult('success');
      timer.current = setTimeout(() => api.succeed(`Exactly ${config.target}. Precise.`), EXACT_SETTLE_MS);
    }
  };

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const shownCount = useSharedValue(1);
  useEffect(() => {
    shownCount.set(1.3);
    shownCount.set(withSpring(1));
  }, [count, shownCount]);
  const countStyle = useAnimatedStyle(() => ({ transform: [{ scale: shownCount.value }] }));

  return (
    <View style={styles.center}>
      <Animated.View style={countStyle}>
        <GText variant="display" size={64} outlined center>{count}</GText>
      </Animated.View>
      <Pressable onPressIn={onPressIn} accessibilityRole="button" accessibilityLabel={`Tap. Count ${count}`}>
        <Animated.View style={[styles.pad, { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.surface, borderColor: palette.border }, pop.style]}>
          <Text allowFontScaling={false} style={{ fontSize: size * 0.5 }}>{config.emoji ?? '👆'}</Text>
        </Animated.View>
      </Pressable>
      {mash ? (
        <View style={[styles.track, { width: area.width * 0.7, height: s(16), borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}>
          <Animated.View style={[styles.bar, { backgroundColor: palette.success }, barStyle]} />
        </View>
      ) : (
        <GText muted size={14} center>target: {config.target} · then hands off</GText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  pad: { borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  track: { borderRadius: 99, borderWidth: 3, overflow: 'hidden' },
  bar: { height: '100%' },
});
