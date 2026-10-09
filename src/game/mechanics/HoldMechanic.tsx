/**
 * dontHold:    quick taps are fine; holding past `holdMs` fails. The fill shows how close you are.
 * dontRelease: press and hold until the fill completes; letting go early fails.
 */
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { usePulse } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import type { HoldConfig } from '../types';
import { Blob } from './Blob';
import type { MechanicProps } from './types';

export function HoldMechanic({ config, area, api }: MechanicProps<HoldConfig>) {
  const { palette } = useTheme();
  const size = Math.min(area.width, area.height) * 0.56;
  const fill = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressing = useRef(false);
  const dontRelease = config.mode === 'dontRelease';
  const color = config.color ?? 'purple';
  const pulse = usePulse(true, 0.05);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onPressIn = () => {
    if (api.isDone()) return;
    pressing.current = true;
    feedback.tap();
    fill.set(0);
    fill.set(withTiming(1, { duration: config.holdMs, easing: Easing.linear }));
    timer.current = setTimeout(() => {
      if (!pressing.current) return;
      if (dontRelease) api.succeed('You held on. Loyal.');
      else api.fail();
    }, config.holdMs);
  };

  const onPressOut = () => {
    if (!pressing.current) return;
    pressing.current = false;
    if (timer.current) clearTimeout(timer.current);
    cancelAnimation(fill);
    if (api.isDone()) return;
    if (dontRelease) {
      api.fail();
    } else {
      fill.set(withTiming(0, { duration: 200 }));
      api.touch();
    }
  };

  const fillStyle = useAnimatedStyle(() => ({ height: `${fill.value * 100}%` }));
  const fillColor = dontRelease ? palette.success : palette.danger;

  return (
    <View style={styles.center}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={config.label ?? (dontRelease ? 'Hold' : 'Hold me')}
        accessibilityHint={dontRelease ? 'Press and hold until it fills up' : 'Do not hold this button'}
      >
        <Animated.View style={pulse}>
          <Blob size={size} color={color} label={config.label ?? (dontRelease ? 'HOLD' : 'HOLD ME')} />
          {/* Fill gauge overlaid on the button face. */}
          <View pointerEvents="none" style={[styles.gauge, { width: size, height: size, borderRadius: size / 2 }]}>
            <Animated.View style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
          </View>
        </Animated.View>
      </Pressable>
      <GText muted size={14} center style={styles.caption}>
        {dontRelease ? `Hold for ${(config.holdMs / 1000).toFixed(1)}s` : 'Taps: fine. Holds: not fine.'}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gauge: { position: 'absolute', top: 0, left: 0, overflow: 'hidden', justifyContent: 'flex-end', opacity: 0.45 },
  fill: { width: '100%' },
  caption: { marginTop: 14 },
});
