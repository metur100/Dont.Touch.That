/** "DON'T FOLLOW THE ARROW." Tap (or swipe) anywhere EXCEPT where the arrow points. */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { createRng } from '../generators/random';
import type { ArrowConfig, ColorName, Direction } from '../types';
import { Blob } from './Blob';
import { classifySwipe } from './logic';
import type { MechanicProps } from './types';
import { useAreaGesture } from './useAreaGesture';

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const ANGLE: Record<Direction, number> = { up: -90, right: 0, down: 90, left: 180 };
const COLORS: Record<Direction, ColorName> = { up: 'blue', right: 'yellow', down: 'green', left: 'purple' };

export function ArrowMechanic({ config, area, api, seed }: MechanicProps<ArrowConfig>) {
  const [round, setRound] = useState(0);
  const [dir, setDir] = useState<Direction>(() => DIRS[Math.floor(createRng(seed)() * 4)]);
  // With jitter the arrow spins first; input only counts once it settles on this round.
  const [settledRound, setSettledRound] = useState(-1);
  const settled = !config.jitter || settledRound === round;
  const rot = useSharedValue(ANGLE[dir]);
  const dirRef = useRef(dir);
  const btn = Math.min(area.width, area.height) * 0.22;

  useEffect(() => {
    dirRef.current = dir;
    const target = ANGLE[dir];
    if (config.jitter) {
      rot.set(withSequence(
        withTiming(target + 360 + 40, { duration: 380, easing: Easing.out(Easing.quad) }),
        withTiming(target + 360 - 25, { duration: 120 }),
        withSpring(target + 360, { damping: 9 }),
      ));
      const t = setTimeout(() => {
        rot.set(target);
        setSettledRound(round);
      }, 520);
      return () => clearTimeout(t);
    }
    rot.set(withSpring(target, { damping: 10 }));
  }, [dir, round, config.jitter, rot]);

  const choose = (picked: Direction) => {
    if (api.isDone()) return;
    if (!settled) {
      api.touch();
      return;
    }
    if (picked === dirRef.current) {
      api.fail('The arrow said jump. You jumped.');
      return;
    }
    api.touch();
    if (round + 1 >= config.rounds) {
      api.succeed();
      return;
    }
    setRound((r) => r + 1);
    setDir((d) => {
      const options = DIRS.filter((x) => x !== d);
      return options[Math.floor(Math.random() * options.length)];
    });
  };

  const gesture = useAreaGesture({
    onUp: (_x, _y, info) => {
      if (config.input !== 'swipe') return;
      const d = classifySwipe(info.dx, info.dy, info.vx, info.vy);
      if (d) choose(d);
    },
  });

  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const pos: Record<Direction, object> = {
    up: { top: 0, left: area.width / 2 - btn / 2 },
    down: { bottom: 0, left: area.width / 2 - btn / 2 },
    left: { left: 0, top: area.height / 2 - btn / 2 },
    right: { right: 0, top: area.height / 2 - btn / 2 },
  };

  const content = (
    <View style={StyleSheet.absoluteFill}>
      {DIRS.map((d) => (
        <Pressable
          key={d}
          disabled={config.input === 'swipe'}
          onPressIn={() => choose(d)}
          style={[styles.abs, pos[d]]}
          accessibilityRole="button"
          accessibilityLabel={`${d} button`}
        >
          <Blob size={btn} color={COLORS[d]} label={config.input === 'swipe' ? { up: '↑', down: '↓', left: '←', right: '→' }[d] : '•'} />
        </Pressable>
      ))}
      <View pointerEvents="none" style={styles.center}>
        <Animated.View style={arrowStyle}>
          <GText variant="display" size={92} outlined>➜</GText>
        </Animated.View>
        <GText muted size={13} center>
          {config.input === 'swipe' ? 'swipe any OTHER way' : 'tap any OTHER button'} · {round + 1}/{config.rounds}
        </GText>
      </View>
    </View>
  );

  return config.input === 'swipe' ? <GestureDetector gesture={gesture}>{content}</GestureDetector> : content;
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
