/**
 * dontWait: tap immediately.
 * reaction: don't tap until the light turns GREEN (beware fake-out colors), then tap fast.
 * zone:     tap while the sweeping needle is inside the green zone.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { GAME_COLORS } from '@/constants/colors';
import { usePulse, useShake } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import { createRng } from '../generators/random';
import type { ColorName, TimingConfig } from '../types';
import { Blob } from './Blob';
import type { MechanicProps } from './types';

export function TimingMechanic(props: MechanicProps<TimingConfig>) {
  switch (props.config.mode) {
    case 'reaction':
      return <Reaction {...props} />;
    case 'zone':
      return <Zone {...props} />;
    default:
      return <DontWait {...props} />;
  }
}

function DontWait({ config, area, api }: MechanicProps<TimingConfig>) {
  const size = Math.min(area.width, area.height) * 0.55;
  const pulse = usePulse(true, 0.12, 220);
  return (
    <View style={styles.center}>
      <Pressable onPressIn={() => api.succeed()} accessibilityRole="button" accessibilityLabel={config.label ?? 'Tap'}>
        <Animated.View style={pulse}>
          <Blob size={size} color="green" label={config.label ?? 'TAP!'} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

type LightState = { color: ColorName; text: string; go: boolean };

function Reaction({ config, area, api, stage, seed }: MechanicProps<TimingConfig>) {
  const size = Math.min(area.width, area.height) * 0.62;
  const [light, setLight] = useState<LightState>({ color: 'red', text: 'WAIT...', go: false });
  const goAt = useRef(0);
  const shake = useShake(10);

  // Build the schedule once: [red ... fake ... red ... GREEN], scaled to fit the time limit.
  const schedule = useMemo(() => {
    const rnd = createRng(seed);
    const [minD, maxD] = config.delayMs ?? [1000, 2200];
    const fakes = config.fakeOuts ?? 0;
    const fakeColors: ColorName[] = ['yellow', 'blue', 'purple', 'orange'];
    const steps: { at: number; state: LightState }[] = [];
    let t = 0;
    for (let i = 0; i < fakes; i++) {
      t += minD + rnd() * (maxD - minD) * 0.6;
      steps.push({ at: t, state: { color: fakeColors[i % fakeColors.length], text: 'TAP?', go: false } });
      t += 650;
      steps.push({ at: t, state: { color: 'red', text: 'WAIT...', go: false } });
    }
    t += minD + rnd() * (maxD - minD);
    const windowMs = config.windowMs ?? 1200;
    const budget = stage.timeLimit - windowMs - 200;
    const factor = t > budget ? budget / t : 1;
    steps.forEach((s) => (s.at *= factor));
    steps.push({ at: t * factor, state: { color: 'green', text: 'TAP!', go: true } });
    return { steps, windowMs };
  }, [config.delayMs, config.fakeOuts, config.windowMs, stage.timeLimit, seed]);

  useEffect(() => {
    const timers = schedule.steps.map((s) =>
      setTimeout(() => {
        setLight(s.state);
        if (s.state.go) {
          goAt.current = Date.now();
          feedback.countdown();
          timers.push(setTimeout(() => api.fail('Too slow! It was green. GREEN.'), schedule.windowMs));
        } else if (s.state.color !== 'red') {
          shake.trigger(0.6);
        }
      }, s.at),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]);

  const onPressIn = () => {
    if (api.isDone()) return;
    if (!light.go) {
      api.fail(light.color === 'red' ? 'Too early! It was still red.' : `That was ${light.color}. Not green.`);
      return;
    }
    const ms = Date.now() - goAt.current;
    api.succeed(`${ms}ms. ${ms < 300 ? 'Lightning!' : ms < 450 ? 'Quick!' : 'Okay, grandpa.'}`);
  };

  return (
    <Pressable style={styles.center} onPressIn={onPressIn} accessibilityRole="button" accessibilityLabel={`Light is ${light.color}. ${light.text}`}>
      <Animated.View style={shake.style}>
        <Blob size={size} color={light.color} label={light.text} />
      </Animated.View>
      <GText muted size={14} center style={styles.caption}>tap anywhere — but only on GREEN</GText>
    </Pressable>
  );
}

function Zone({ config, area, api, seed }: MechanicProps<TimingConfig>) {
  const { palette, s } = useTheme();
  const trackW = area.width * 0.86;
  const zoneW = trackW * (config.zoneSize ?? 0.25);
  const zoneX = useMemo(() => trackW * 0.15 + createRng(seed)() * (trackW * 0.7 - zoneW), [trackW, zoneW, seed]);
  const needle = useSharedValue(0);

  useEffect(() => {
    needle.set(withRepeat(withTiming(1, { duration: config.sweepMs ?? 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [needle, config.sweepMs]);

  const needleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: needle.value * trackW - 4 }] }));

  const onPressIn = () => {
    if (api.isDone()) return;
    const x = needle.value * trackW;
    if (x >= zoneX - 4 && x <= zoneX + zoneW + 4) api.succeed('Bullseye.');
    else api.fail(x < zoneX ? 'Too early!' : 'Too late!');
  };

  return (
    <Pressable style={styles.center} onPressIn={onPressIn} accessibilityRole="button" accessibilityLabel="Tap when the needle is in the green zone">
      <Text allowFontScaling={false} style={{ fontSize: s(54), marginBottom: 12 }}>🎯</Text>
      <View style={[styles.track, { width: trackW, height: s(64), backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.zone, { left: zoneX, width: zoneW, backgroundColor: GAME_COLORS.green.fill }]} />
        <Animated.View style={[styles.needle, { backgroundColor: palette.text }, needleStyle]} />
      </View>
      <GText muted size={14} center style={styles.caption}>tap anywhere when the needle is in the zone</GText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  caption: { marginTop: 14 },
  track: { borderRadius: 18, borderWidth: 4, overflow: 'hidden', justifyContent: 'center' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  needle: { position: 'absolute', left: 0, top: 4, bottom: 4, width: 8, borderRadius: 4 },
});
