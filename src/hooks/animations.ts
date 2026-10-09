/**
 * Reusable Reanimated animations. All run on the UI thread; triggering one never re-renders React.
 */
import { useCallback, useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Gentle "press me" breathing. */
export function usePulse(active = true, amount = 0.06, duration = 650) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!active) {
      scale.set(withTiming(1, { duration: 150 }));
      return;
    }
    scale.set(withRepeat(
      withSequence(
        withTiming(1 + amount, { duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    ));
    return () => cancelAnimation(scale);
  }, [active, amount, duration, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

/** Rotational wiggle, like an excited present. */
export function useWobble(active = true, degrees = 6) {
  const rot = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    rot.set(withRepeat(
      withSequence(
        withTiming(degrees, { duration: 90 }),
        withTiming(-degrees, { duration: 180 }),
        withTiming(degrees / 2, { duration: 140 }),
        withTiming(0, { duration: 90 }),
        withDelay(700, withTiming(0, { duration: 1 })),
      ),
      -1,
    ));
    return () => cancelAnimation(rot);
  }, [active, degrees, rot]);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
}

/** Continuous bounce on the Y axis. */
export function useBounce(active = true, height = 8, duration = 380) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    y.set(withRepeat(
      withSequence(withTiming(-height, { duration, easing: Easing.out(Easing.quad) }), withTiming(0, { duration, easing: Easing.in(Easing.quad) })),
      -1,
    ));
    return () => cancelAnimation(y);
  }, [active, height, duration, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

/** Continuous spin. */
export function useSpin(active = true, duration = 2400) {
  const deg = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    deg.set(0);
    deg.set(withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1));
    return () => cancelAnimation(deg);
  }, [active, duration, deg]);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${deg.value}deg` }] }));
}

/** Imperative horizontal shake: `trigger()` from any event handler. */
export function useShake(intensity = 12) {
  const x = useSharedValue(0);
  const trigger = useCallback(
    (strength = 1) => {
      const d = intensity * strength;
      x.set(withSequence(
        withTiming(d, { duration: 40 }),
        withTiming(-d, { duration: 60 }),
        withTiming(d * 0.6, { duration: 55 }),
        withTiming(-d * 0.4, { duration: 50 }),
        withTiming(0, { duration: 45 }),
      ));
    },
    [intensity, x],
  );
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return { style, trigger };
}

/** Imperative squash-and-stretch "boing" (press feedback). */
export function usePop() {
  const scale = useSharedValue(1);
  const trigger = useCallback(() => {
    scale.set(withSequence(withTiming(0.86, { duration: 70 }), withSpring(1, { damping: 6, stiffness: 260 })));
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return { style, trigger };
}

/** Scale + fade in on mount (with optional delay). */
export function useEnter(delay = 0, from = 0.6) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withSpring(1, { damping: 11, stiffness: 160 })));
  }, [delay, p]);
  return useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.5),
    transform: [{ scale: from + (1 - from) * p.value }],
  }));
}
