/**
 * A card that follows your finger. Forbidden directions are marked on the screen edges.
 * Reversed variant: the card moves OPPOSITE to your finger (and the game only explains after you fail).
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import type { Direction, SwipeConfig } from '../types';
import { classifySwipe, directionVector, invertDirection } from './logic';
import type { MechanicProps } from './types';
import { useAreaGesture } from './useAreaGesture';

const ARROW: Record<Direction, string> = { left: '⬅', right: '➡', up: '⬆', down: '⬇' };

export function SwipeMechanic({ config, area, api }: MechanicProps<SwipeConfig>) {
  const { palette, s } = useTheme();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const [cardKey, setCardKey] = useState(0);
  const sign = config.reversed ? -1 : 1;
  const cardSize = Math.min(area.width * 0.5, area.height * 0.42);

  const flyOff = (dir: Direction, then: () => void) => {
    const v = directionVector(dir);
    const far = Math.max(area.width, area.height);
    tx.set(withTiming(v.x * far, { duration: 220 }));
    ty.set(withTiming(v.y * far, { duration: 220 }));
    setTimeout(then, 230);
  };

  const gesture = useAreaGesture({
    onDown: () => {
      if (!api.isDone()) feedback.tap();
    },
    onMove: (_x, _y, dx, dy) => {
      if (api.isDone()) return;
      tx.set(dx * sign);
      ty.set(dy * sign);
      rot.set((dx * sign) / 12);
    },
    onUp: (x, y, info) => {
      if (api.isDone()) return;
      const fingerDir = classifySwipe(info.dx, info.dy, info.vx, info.vy);
      if (!fingerDir) {
        tx.set(withSpring(0));
        ty.set(withSpring(0));
        rot.set(withSpring(0));
        api.touch({ x, y });
        return;
      }
      const cardDir = config.reversed ? invertDirection(fingerDir) : fingerDir;
      const judged = config.judgeByCard ? cardDir : fingerDir;
      if (config.forbidden.includes(judged)) {
        // "Don't swipe left" -> everything goes RIGHT. Out of spite.
        const spite = config.reversed ? cardDir : invertDirection(judged);
        flyOff(spite, () => undefined);
        api.fail(undefined, { x, y });
        return;
      }
      feedback.whoosh();
      if (config.mode === 'flick') {
        flyOff(cardDir, () => api.succeed());
      } else {
        // Survive mode: allowed swipes are fine; a fresh card appears.
        flyOff(cardDir, () => {
          tx.set(0);
          ty.set(0);
          rot.set(0);
          setCardKey((k) => k + 1);
        });
        api.touch({ x, y });
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  const edge = (dir: Direction) => {
    const bad = config.forbidden.includes(dir);
    if (!bad && config.mode !== 'flick') return null;
    const horizontal = dir === 'left' || dir === 'right';
    return (
      <View
        key={dir}
        pointerEvents="none"
        style={[
          styles.edge,
          horizontal ? styles.edgeV : styles.edgeH,
          { [dir === 'right' ? 'right' : dir === 'down' ? 'bottom' : dir === 'left' ? 'left' : 'top']: 0 },
          { backgroundColor: bad ? 'rgba(232,40,60,0.18)' : 'rgba(31,170,89,0.14)', borderColor: bad ? palette.danger : palette.success },
        ]}
      >
        <Text allowFontScaling={false} style={styles.edgeText}>{bad ? '⛔' : ARROW[dir]}</Text>
      </View>
    );
  };

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={`Swipe card. Forbidden: ${config.forbidden.join(', ')}`}>
        {(['left', 'right', 'up', 'down'] as Direction[]).map(edge)}
        <View style={styles.center} pointerEvents="none">
          <Animated.View key={cardKey} style={[styles.card, { width: cardSize, height: cardSize * 1.25, backgroundColor: palette.surface, borderColor: palette.border }, cardStyle]}>
            <Text allowFontScaling={false} style={{ fontSize: cardSize * 0.42 }}>{config.emoji ?? '🃏'}</Text>
            <GText muted size={13} center>{config.mode === 'flick' ? 'flick me' : 'swipe me?'}</GText>
          </Animated.View>
        </View>
        {config.reversed ? null : <GText muted size={12} center style={[styles.footer, { bottom: s(6) }]}>⛔ = forbidden</GText>}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 24, borderWidth: 4, alignItems: 'center', justifyContent: 'center', gap: 4 },
  edge: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  edgeV: { top: 0, bottom: 0, width: 46, borderWidth: 2, borderRadius: 16 },
  edgeH: { left: 0, right: 0, height: 46, borderWidth: 2, borderRadius: 16 },
  edgeText: { fontSize: 22 },
  footer: { position: 'absolute', alignSelf: 'center' },
});
