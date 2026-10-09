/**
 * Several objects; some are forbidden. Covers "don't touch red", bombs vs balloons, numbers,
 * Stroop color words, memory (colors hide), invisible objects, drifting and shuffling objects.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { GAME_COLORS } from '@/constants/colors';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import { createRng, hashString, shuffle } from '../generators/random';
import type { ChoiceConfig, ChoiceItem } from '../types';
import { Blob } from './Blob';
import { gridSlots, type Slot } from './logic';
import type { MechanicProps, PlayArea, Point } from './types';

export function ChoiceMechanic({ config, area, api, seed }: MechanicProps<ChoiceConfig>) {
  const { colorLabels } = useTheme();
  const items = config.items;
  const slots = useMemo(() => gridSlots(items.length, area, config.columns), [items.length, area, config.columns]);
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  const [popped, setPopped] = useState<Set<string>>(() => new Set());
  const [hidden, setHidden] = useState(false);
  const poppedRef = useRef(popped);
  const safeTotal = useMemo(() => items.filter((i) => !i.forbidden).length, [items]);

  useEffect(() => {
    if (!config.memoryMs) return;
    const t = setTimeout(() => {
      setHidden(true);
      feedback.whoosh();
    }, config.memoryMs);
    return () => clearTimeout(t);
  }, [config.memoryMs]);

  useEffect(() => {
    if (config.motion !== 'shuffle') return;
    const id = setInterval(() => setOrder((o) => shuffle(Math.random, o)), 1300);
    return () => clearInterval(id);
  }, [config.motion]);

  const onPress = useCallback(
    (item: ChoiceItem, at: Point) => {
      if (api.isDone() || poppedRef.current.has(item.id)) return;
      if (item.forbidden) {
        api.fail(undefined, at);
        return;
      }
      const next = new Set(poppedRef.current).add(item.id);
      poppedRef.current = next;
      setPopped(next);
      feedback.pop();
      api.touch();
      if (config.mode === 'pickOne') api.succeed(undefined, at);
      else if (config.mode === 'clearSafe' && next.size >= safeTotal) api.succeed(undefined, at);
    },
    [api, config.mode, safeTotal],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      {items.map((item, i) => (
        <Item
          key={item.id}
          item={item}
          slot={slots[order[i]] ?? slots[i]}
          drift={config.motion === 'drift'}
          speed={config.speed ?? 1}
          area={area}
          hidden={hidden}
          popped={popped.has(item.id)}
          colorLabel={colorLabels}
          seed={seed}
          onPress={onPress}
        />
      ))}
      {config.mode === 'clearSafe' ? (
        <GText muted size={13} center style={styles.counter} accessibilityLiveRegion="polite">
          {popped.size}/{safeTotal}
        </GText>
      ) : null}
    </View>
  );
}

interface ItemProps {
  item: ChoiceItem;
  slot: Slot;
  drift: boolean;
  speed: number;
  area: PlayArea;
  hidden: boolean;
  popped: boolean;
  colorLabel: boolean;
  seed: number;
  onPress: (item: ChoiceItem, at: Point) => void;
}

const Item = memo(function Item({ item, slot, drift, speed, area, hidden, popped, colorLabel, seed, onPress }: ItemProps) {
  const r = slot.r;
  const x = useSharedValue(slot.x);
  const y = useSharedValue(slot.y);
  const [v0] = useState(() => {
    const rnd = createRng(hashString(item.id) ^ seed);
    const dir = () => (rnd() < 0.5 ? -1 : 1) * (40 + rnd() * 50) * speed;
    return { x: dir(), y: dir() };
  });
  const vx = useSharedValue(v0.x);
  const vy = useSharedValue(v0.y);
  const scale = useSharedValue(0);
  const glow = useSharedValue(item.invisible ? 0.05 : 1);

  useEffect(() => {
    scale.set(withSpring(1, { damping: 10, stiffness: 180 }));
    if (item.invisible) {
      glow.set(withRepeat(withSequence(withTiming(0.16, { duration: 700 }), withTiming(0.05, { duration: 700 })), -1));
    }
  }, [scale, glow, item.invisible]);

  // Shuffle: glide to the new slot.
  useEffect(() => {
    if (drift) return;
    x.set(withTiming(slot.x, { duration: 380 }));
    y.set(withTiming(slot.y, { duration: 380 }));
  }, [slot.x, slot.y, drift, x, y]);

  useEffect(() => {
    if (popped) scale.set(withSequence(withTiming(1.3, { duration: 80 }), withTiming(0, { duration: 160 })));
  }, [popped, scale]);

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    let nx = x.value + vx.value * dt;
    let ny = y.value + vy.value * dt;
    if (nx < r || nx > area.width - r) {
      vx.set(-vx.value);
      nx = Math.min(area.width - r, Math.max(r, nx));
    }
    if (ny < r || ny > area.height - r) {
      vy.set(-vy.value);
      ny = Math.min(area.height - r, Math.max(r, ny));
    }
    x.set(nx);
    y.set(ny);
  }, drift);

  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ translateX: x.value - r }, { translateY: y.value - r }, { scale: scale.value }],
  }));

  const textColor = item.label && !item.emoji ? GAME_COLORS[item.color].fill : undefined;
  const isWord = !!item.label && /^[A-Z]+$/.test(item.label);

  return (
    <Animated.View style={[styles.item, { width: r * 2, height: r * 2 }, style]} pointerEvents={popped ? 'none' : 'auto'}>
      <Pressable
        onPressIn={() => onPress(item, { x: x.value, y: y.value })}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={item.invisible ? 'Invisible object' : `${hidden ? 'Hidden' : GAME_COLORS[item.color].name.toLowerCase()} ${item.emoji ?? item.label ?? 'circle'}`}
      >
        {item.invisible ? (
          <View style={[styles.ghost, { width: r * 2, height: r * 2, borderRadius: r }]} />
        ) : isWord ? (
          // Stroop words: plain bold word on a neutral chip, ink color is the item's color.
          <View style={[styles.word, { width: r * 2, height: r * 2, borderRadius: r * 0.5 }]}>
            <GText variant="heading" size={Math.min(28, (r * 2.2) / Math.max(3, item.label!.length))} color={hidden ? '#8E8AA3' : textColor}>
              {hidden ? '?' : item.label}
            </GText>
          </View>
        ) : (
          <Blob size={r * 2} color={item.color} emoji={item.emoji} label={item.label} hidden={hidden} colorLabel={colorLabel} />
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  item: { position: 'absolute', left: 0, top: 0 },
  ghost: { backgroundColor: '#B9B4CC', borderWidth: 2, borderColor: '#FFFFFF' },
  word: { backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#2B1B4A', alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', bottom: 2, alignSelf: 'center' },
});
