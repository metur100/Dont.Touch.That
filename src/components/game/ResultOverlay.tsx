/** Short, punchy per-level result. Tapping skips ahead. */
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { BounceIn, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { pickMessage } from '@/data/messages';
import type { LevelOutcome } from '@/game/engine/runReducer';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  outcome: LevelOutcome;
  survive: boolean;
  livesLeft: number;
  onSkip: () => void;
}

const SUCCESS_EMOJI = ['🎉', '😇', '🙌', '✨', '🧘', '😎'];

export const ResultOverlay = memo(function ResultOverlay({ outcome, survive, livesLeft, onSkip }: Props) {
  const { palette, s } = useTheme();
  const emoji = SUCCESS_EMOJI[outcome.levelIndex % SUCCESS_EMOJI.length];
  const fakeReward = useMemo(() => pickMessage('fakeReward'), []);
  const [kidding, setKidding] = useState(false);

  useEffect(() => {
    if (outcome.success) return;
    const t = setTimeout(() => setKidding(true), 450);
    return () => clearTimeout(t);
  }, [outcome.success]);

  const b = outcome.breakdown;
  const title = outcome.success
    ? outcome.boss ? 'BOSS DEFEATED!' : survive ? 'YOU RESISTED!' : 'NAILED IT!'
    : outcome.boss ? 'THE BOSS WINS.' : 'I TOLD YOU NOT TO.';

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onSkip} accessibilityRole="button" accessibilityLabel={`${title}. ${outcome.message}. Tap to continue.`}>
      <Animated.View entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, styles.backdrop, { backgroundColor: palette.dark ? 'rgba(10,4,24,0.9)' : 'rgba(255,250,244,0.93)' }]} />
      <View style={styles.center}>
        <Animated.Text entering={BounceIn.duration(500)} style={{ fontSize: s(76) }}>
          {outcome.success ? emoji : '💥'}
        </Animated.Text>
        <Animated.View entering={ZoomIn.springify().damping(10).delay(40)}>
          <GText variant="title" size={34} outlined center color={outcome.success ? palette.success : palette.danger}>
            {title}
          </GText>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(120)} style={styles.message}>
          <GText variant="heading" size={20} center>{outcome.message}</GText>
        </Animated.View>

        {outcome.success && b ? (
          <>
            <Animated.View entering={ZoomIn.springify().damping(8).delay(160)}>
              <GText variant="display" size={54} outlined center color={palette.warning}>+{b.total}</GText>
            </Animated.View>
            <View style={styles.chips}>
              {b.speed > 0 ? <Chip text={`⚡ FAST +${b.speed}`} delay={240} color={palette.accent} /> : null}
              {b.streak > 0 ? <Chip text={`🔥 STREAK +${b.streak}`} delay={300} color={palette.primary} /> : null}
            </View>
            {outcome.streak >= 2 ? <StreakText streak={outcome.streak} /> : null}
            {outcome.milestone ? (
              <Animated.View entering={ZoomIn.springify().delay(380)} style={[styles.milestone, { backgroundColor: palette.accent, borderColor: palette.border }]}>
                <GText variant="heading" size={18} center color="#FFF">{outcome.milestone}</GText>
              </Animated.View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.fakeRow}>
              <GText variant="display" size={46} outlined center color={palette.warning} style={kidding ? styles.struck : undefined}>
                {fakeReward}
              </GText>
            </View>
            {kidding ? (
              <Animated.View entering={ZoomIn.springify()}>
                <GText variant="heading" size={20} center color={palette.danger}>JUST KIDDING. -1 ❤️</GText>
              </Animated.View>
            ) : null}
            <GText muted center size={14}>{livesLeft > 0 ? `${livesLeft} ${livesLeft === 1 ? 'life' : 'lives'} left` : 'no lives left...'}</GText>
          </>
        )}
        <GText muted size={12} center style={styles.skip}>tap to continue</GText>
      </View>
    </Pressable>
  );
});

function Chip({ text, delay, color }: { text: string; delay: number; color: string }) {
  return (
    <Animated.View entering={ZoomIn.springify().delay(delay)} style={[styles.chip, { backgroundColor: color }]}>
      <Text style={styles.chipText}>{text}</Text>
    </Animated.View>
  );
}

function StreakText({ streak }: { streak: number }) {
  const { palette } = useTheme();
  const scale = useSharedValue(0);
  useEffect(() => {
    // Bigger streak = bigger bounce.
    const peak = 1 + Math.min(0.6, streak * 0.04);
    scale.set(withDelay(220, withSequence(withTiming(peak, { duration: 160 }), withSpring(1, { damping: 5 }))));
  }, [scale, streak]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <GText variant="title" size={26} outlined center color={palette.primary}>STREAK x{streak}</GText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { borderRadius: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, gap: 4 },
  message: { marginBottom: 6 },
  chips: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  chipText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  milestone: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 3 },
  fakeRow: { marginVertical: 2 },
  struck: { textDecorationLine: 'line-through', opacity: 0.6 },
  skip: { marginTop: 10 },
});
