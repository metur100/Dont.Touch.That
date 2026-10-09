import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { createRng } from '@/game/generators/random';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

interface ParticleBurstProps {
  /** Change this value to fire a new burst. 0 = idle. */
  burstKey: number;
  colors: string[];
  emojis?: string[];
  count?: number;
  /** Max travel distance in px. */
  distance?: number;
  x: number;
  y: number;
}

interface ParticleSpec {
  angle: number;
  dist: number;
  size: number;
  color: string;
  emoji?: string;
  spin: number;
}

/** Radial burst of dots/emoji. One shared value drives all particles. */
export const ParticleBurst = memo(function ParticleBurst({ burstKey, colors, emojis, count = 16, distance = 140, x, y }: ParticleBurstProps) {
  const t = useSharedValue(0);

  const particles = useMemo<ParticleSpec[]>(() => {
    // Seeded per burst: a new look every time, but rendering stays pure.
    const rnd = createRng(burstKey * 7919 + Math.round(x * 31 + y));
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + rnd() * 0.4,
      dist: distance * (0.55 + rnd() * 0.45),
      size: 8 + rnd() * 10,
      color: colors[i % colors.length],
      emoji: emojis && i % 3 === 0 ? emojis[i % emojis.length] : undefined,
      spin: (rnd() - 0.5) * 540,
    }));
    // colors/emojis are style inputs; a burst keeps its look until the next burstKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey, count, distance]);

  useEffect(() => {
    if (!burstKey) return;
    t.set(0);
    t.set(withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }));
  }, [burstKey, t]);

  if (!burstKey) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
      {particles.map((p, i) => (
        <Particle key={`${burstKey}-${i}`} spec={p} t={t} x={x} y={y} />
      ))}
    </View>
  );
});

function Particle({ spec, t, x, y }: { spec: ParticleSpec; t: SharedValue<number>; x: number; y: number }) {
  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [
        { translateX: Math.cos(spec.angle) * spec.dist * p },
        // A little gravity at the end.
        { translateY: Math.sin(spec.angle) * spec.dist * p + 60 * p * p },
        { rotate: `${spec.spin * p}deg` },
        { scale: 1 - p * 0.4 },
      ],
    };
  });
  if (spec.emoji) {
    return (
      <Animated.Text style={[styles.emoji, { left: x - 12, top: y - 14 }, style]}>{spec.emoji}</Animated.Text>
    );
  }
  return (
    <Animated.View
      style={[
        styles.dot,
        { left: x - spec.size / 2, top: y - spec.size / 2, width: spec.size, height: spec.size, borderRadius: spec.size / 2, backgroundColor: spec.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute' },
  emoji: { position: 'absolute', fontSize: 22 },
});
