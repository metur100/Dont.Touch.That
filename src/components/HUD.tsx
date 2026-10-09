/** In-game heads-up display pieces: hearts, animated score, timer bar. */
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

import { GText } from './GText';

export const Hearts = memo(function Hearts({ lives, max }: { lives: number; max: number }) {
  const { s } = useTheme();
  return (
    <View style={styles.row} accessible accessibilityLabel={`${lives} of ${max} lives left`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart key={i} full={i < lives} size={s(22)} />
      ))}
    </View>
  );
});

function Heart({ full, size }: { full: boolean; size: number }) {
  const scale = useSharedValue(1);
  const prev = useRef(full);
  useEffect(() => {
    if (prev.current && !full) {
      scale.set(withSequence(withTiming(1.6, { duration: 120 }), withSpring(1, { damping: 7 })));
    }
    prev.current = full;
  }, [full, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.Text style={[{ fontSize: size, opacity: full ? 1 : 0.3, marginHorizontal: 1 }, style]}>
      {full ? '❤️' : '🖤'}
    </Animated.Text>
  );
}

/** Counts up to the new value over ~450ms; only this component re-renders. */
export const ScoreCounter = memo(function ScoreCounter({ value, size = 20, color }: { value: number; size?: number; color?: string }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const bump = useSharedValue(1);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (value > from) bump.set(withSequence(withTiming(1.25, { duration: 100 }), withSpring(1, { damping: 8 })));
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const k = Math.min(1, (Date.now() - start) / 450);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)));
      shownRef.current = v;
      setShown(v);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, bump]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  return (
    <Animated.View style={style}>
      <GText variant="heading" size={size} color={color} accessibilityLabel={`Score ${value}`}>
        {shown.toLocaleString('en-US')}
      </GText>
    </Animated.View>
  );
});

/** Shrinking time bar. `runKey` restarts it; `paused` freezes it. */
export const TimerBar = memo(function TimerBar({ duration, runKey, paused, color }: { duration: number; runKey: string; paused: boolean; color: string }) {
  const { palette, s } = useTheme();
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.set(1);
    progress.set(withTiming(0, { duration, easing: Easing.linear }));
    return () => cancelAnimation(progress);
  }, [runKey, duration, progress]);

  useEffect(() => {
    if (paused) cancelAnimation(progress);
  }, [paused, progress]);

  const style = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: progress.value < 0.25 ? palette.danger : color,
  }));

  return (
    <View style={[styles.track, { height: s(10), backgroundColor: palette.surfaceAlt, borderColor: palette.border }]} accessibilityElementsHidden importantForAccessibility="no">
      <Animated.View style={[styles.fill, style]} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  track: { width: '100%', borderRadius: 99, borderWidth: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
});
