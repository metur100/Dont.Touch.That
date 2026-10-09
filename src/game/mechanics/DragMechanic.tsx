/**
 * maze:     drag the token to the goal without touching walls (lava/lasers).
 * dontDrag: a token that begs to be dragged. Tapping is fine; dragging fails.
 */
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { useBounce } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import type { DragConfig } from '../types';
import { circleIntersectsRect, clamp, distance, pointInRect, toPixels } from './logic';
import type { MechanicProps } from './types';
import { useAreaGesture } from './useAreaGesture';

const DRAG_FAIL_DISTANCE = 28;

export function DragMechanic({ config, area, api }: MechanicProps<DragConfig>) {
  const { palette, s } = useTheme();
  const tokenR = Math.max(18, Math.min(area.width, area.height) * 0.065);
  const maze = config.mode === 'maze';
  const start = maze
    ? { x: (config.start?.x ?? 0.15) * area.width, y: (config.start?.y ?? 0.15) * area.height }
    : { x: area.width / 2, y: area.height / 2 };
  const walls = (config.walls ?? []).map((w) => toPixels(w, area));
  const goal = config.goal ? toPixels(config.goal, area) : null;

  const tx = useSharedValue(start.x);
  const ty = useSharedValue(start.y);
  const dragging = useRef(false);
  const grab = useRef({ dx: 0, dy: 0, sx: 0, sy: 0 });
  const bounce = useBounce(!maze, 5, 260);

  const gesture = useAreaGesture({
    onDown: (x, y) => {
      if (api.isDone()) return;
      const near = distance({ x, y }, { x: tx.value, y: ty.value }) <= tokenR + 22;
      if (!near) {
        api.touch({ x, y });
        return;
      }
      dragging.current = true;
      grab.current = { dx: tx.value - x, dy: ty.value - y, sx: x, sy: y };
      feedback.tap();
    },
    onMove: (x, y) => {
      if (!dragging.current || api.isDone()) return;
      const nx = clamp(x + grab.current.dx, tokenR, area.width - tokenR);
      const ny = clamp(y + grab.current.dy, tokenR, area.height - tokenR);
      tx.set(nx);
      ty.set(ny);
      if (!maze) {
        if (distance({ x, y }, { x: grab.current.sx, y: grab.current.sy }) > DRAG_FAIL_DISTANCE) {
          dragging.current = false;
          api.fail(undefined, { x: nx, y: ny });
        }
        return;
      }
      const c = { x: nx, y: ny };
      if (walls.some((w) => circleIntersectsRect(c, tokenR * 0.85, w))) {
        dragging.current = false;
        api.fail(undefined, c);
        return;
      }
      if (goal && pointInRect(c, goal)) {
        dragging.current = false;
        api.succeed(undefined, c);
      }
    },
    onUp: () => {
      if (!maze && !api.isDone()) {
        tx.set(withSpring(start.x));
        ty.set(withSpring(start.y));
      }
      dragging.current = false;
    },
  });

  const tokenStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value - tokenR }, { translateY: ty.value - tokenR }] }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={maze ? 'Maze. Drag the token to the flag without touching walls.' : 'Do not drag the token.'}>
        {maze ? (
          <View style={[StyleSheet.absoluteFill, styles.board, { borderColor: palette.border, backgroundColor: palette.surfaceAlt }]} />
        ) : null}
        {walls.map((w, i) => (
          <View key={i} style={[styles.wall, { left: w.x, top: w.y, width: w.w, height: w.h }]} />
        ))}
        {goal ? (
          <View style={[styles.goal, { left: goal.x, top: goal.y, width: goal.w, height: goal.h, borderColor: palette.success }]}>
            <Text allowFontScaling={false} style={{ fontSize: s(30) }}>🏁</Text>
          </View>
        ) : null}
        <Animated.View style={[styles.token, { width: tokenR * 2, height: tokenR * 2 }, tokenStyle]}>
          <Animated.View style={bounce}>
            <Text allowFontScaling={false} style={{ fontSize: tokenR * 1.6 }}>{config.token}</Text>
          </Animated.View>
        </Animated.View>
        {!maze ? (
          <GText muted center size={14} style={styles.caption}>
            drag me 👉 (please don&apos;t)
          </GText>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  board: { borderRadius: 18, borderWidth: 3, opacity: 0.6 },
  wall: { position: 'absolute', backgroundColor: '#FF4D2E', borderRadius: 6, borderWidth: 2, borderColor: '#9E1B00' },
  goal: { position: 'absolute', borderWidth: 3, borderStyle: 'dashed', borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(31,170,89,0.15)' },
  token: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  caption: { position: 'absolute', bottom: '22%', alignSelf: 'center' },
});
