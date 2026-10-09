/**
 * "DON'T TOUCH THE CHICKEN." Collect items while a creature hunts your finger. When you lift your
 * finger, it guards the next collectible instead. Contact = fail.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GText } from '@/components/GText';
import { feedback } from '@/services/feedback';

import type { ChaseConfig } from '../types';
import { distance, randomPointAwayFrom } from './logic';
import type { MechanicProps, Point } from './types';
import { useAreaGesture } from './useAreaGesture';

export function ChaseMechanic({ config, area, api }: MechanicProps<ChaseConfig>) {
  const size = Math.min(area.width, area.height) * 0.17;
  const r = size * 0.42;
  const pickupR = size * 0.55;
  const pxPerSec = (60 + config.speed * 70) * (Math.min(area.width, area.height) / 340);

  const cx = useSharedValue(area.width / 2);
  const cy = useSharedValue(area.height * 0.25);
  const fx = useSharedValue(-1000);
  const fy = useSharedValue(-1000);
  const down = useSharedValue(false);
  const gx = useSharedValue(area.width / 2);
  const gy = useSharedValue(area.height / 2);
  const flip = useSharedValue(1);
  const hop = useSharedValue(0);

  const [collected, setCollected] = useState(0);
  const [target, setTarget] = useState<Point>(() => randomPointAwayFrom(area, size, { x: area.width / 2, y: area.height * 0.25 }, area.height * 0.4));
  const targetRef = useRef(target);
  const collectedRef = useRef(0);

  useEffect(() => {
    targetRef.current = target;
    gx.set(target.x);
    gy.set(target.y);
  }, [target, gx, gy]);

  useEffect(() => {
    hop.set(withRepeat(withSequence(withTiming(-6, { duration: 140 }), withTiming(0, { duration: 140 })), -1));
  }, [hop]);

  const caught = () => api.fail(undefined, { x: cx.value, y: cy.value });

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    // Hunt the finger; otherwise guard the collectible at half speed.
    const tx = down.value ? fx.value : gx.value;
    const ty = down.value ? fy.value : gy.value;
    const sp = down.value ? pxPerSec : pxPerSec * 0.5;
    const dx = tx - cx.value;
    const dy = ty - cy.value;
    const d = Math.hypot(dx, dy);
    const stopAt = down.value ? 0 : size * 0.9;
    if (d > stopAt + 1) {
      const step = Math.min(d - stopAt, sp * dt);
      cx.set(cx.get() + ((dx / d) * step));
      cy.set(cy.get() + ((dy / d) * step));
      if (Math.abs(dx) > 2) flip.set(dx > 0 ? -1 : 1);
    }
    if (down.value && Math.hypot(fx.value - cx.value, fy.value - cy.value) < r + 10) {
      down.set(false);
      scheduleOnRN(caught);
    }
  });

  const tryCollect = (x: number, y: number) => {
    if (api.isDone()) return;
    if (distance({ x, y }, targetRef.current) > pickupR) return;
    collectedRef.current += 1;
    setCollected(collectedRef.current);
    feedback.pop();
    if (collectedRef.current >= config.count) {
      api.succeed(undefined, { x, y });
      return;
    }
    setTarget(randomPointAwayFrom(area, size * 0.7, { x: cx.value, y: cy.value }, Math.min(area.width, area.height) * 0.45));
  };

  const gesture = useAreaGesture({
    onDown: (x, y) => {
      if (distance({ x, y }, { x: cx.value, y: cy.value }) < r + 6) {
        api.fail(undefined, { x, y });
        return;
      }
      fx.set(x);
      fy.set(y);
      down.set(true);
      api.touch();
      tryCollect(x, y);
    },
    onMove: (x, y) => {
      fx.set(x);
      fy.set(y);
      tryCollect(x, y);
    },
    onUp: () => {
      down.set(false);
    },
  });

  const chaserStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - size / 2 },
      { translateY: cy.value - size / 2 + hop.value },
      { scaleX: withSpring(flip.value) },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={`Avoid the ${config.chaserName}. Collect ${config.count} items.`}>
        <Animated.View key={`${target.x}-${target.y}`} entering={ZoomIn.springify()} style={[styles.abs, { left: target.x - size / 2, top: target.y - size / 2, width: size, height: size }]}>
          <Text allowFontScaling={false} style={{ fontSize: size * 0.7 }}>{config.collect}</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.abs, styles.chaser, { width: size, height: size }, chaserStyle]}>
          <Text allowFontScaling={false} style={{ fontSize: size * 0.85 }}>{config.chaser}</Text>
        </Animated.View>
        <GText variant="heading" size={18} center style={styles.counter}>
          {config.collect} {collected}/{config.count}
        </GText>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  chaser: { left: 0, top: 0 },
  counter: { position: 'absolute', bottom: 4, alignSelf: 'center' },
});
