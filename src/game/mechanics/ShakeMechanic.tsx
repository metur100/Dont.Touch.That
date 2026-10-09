/** "DON'T SHAKE THE SODA." Uses the accelerometer; the object sloshes as you tilt. */
import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { useTheme } from '@/theme/ThemeProvider';

import type { ShakeConfig } from '../types';
import type { MechanicProps } from './types';

const DEFAULT_THRESHOLD = 1.1;

export function ShakeMechanic({ config, api }: MechanicProps<ShakeConfig>) {
  const { s, palette } = useTheme();
  const tilt = useSharedValue(0);
  const jiggle = useSharedValue(1);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [nervous, setNervous] = useState(0);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    const threshold = config.threshold ?? DEFAULT_THRESHOLD;
    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (cancelled) return;
        setAvailable(ok);
        if (!ok) return;
        Accelerometer.setUpdateInterval(50);
        let last: { x: number; y: number; z: number } | null = null;
        sub = Accelerometer.addListener((a) => {
          tilt.set(withSpring(Math.max(-30, Math.min(30, a.x * 40))));
          if (last) {
            // Change in acceleration between samples ("jerk") is what a shake looks like.
            const jerk = Math.hypot(a.x - last.x, a.y - last.y, a.z - last.z);
            if (jerk > threshold * 0.5) setNervous((n) => Math.min(3, n + 1));
            if (jerk > threshold) api.fail();
            jiggle.set(withSpring(1 + Math.min(0.3, jerk * 0.2)));
          }
          last = a;
        });
      })
      .catch(() => setAvailable(false));
    return () => {
      cancelled = true;
      sub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }, { scale: jiggle.value }] }));

  return (
    <Pressable style={styles.center} onPressIn={() => api.touch()} accessibilityLabel={`A ${config.objectName}. Keep your phone still.`}>
      <Animated.View style={style}>
        <Text allowFontScaling={false} style={{ fontSize: s(130) }}>{config.object}</Text>
      </Animated.View>
      <GText muted center size={14}>
        {available === false
          ? 'No motion sensor found. Free win. Enjoy it.'
          : ['steady...', 'easy...', 'careful!', 'IT IS GOING TO BLOW'][nervous]}
      </GText>
      <GText muted center size={12} color={palette.textMuted}>(tapping is allowed — tapping isn&apos;t shaking)</GText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
