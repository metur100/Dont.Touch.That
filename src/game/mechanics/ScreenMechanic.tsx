/** Touching ANYTHING fails. Meanwhile the screen does its best to make you touch it. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { FONTS } from '@/constants/colors';
import { useBounce, usePulse } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import { createRng } from '../generators/random';
import type { DistractionKind, ScreenConfig } from '../types';
import type { MechanicProps, PlayArea } from './types';
import { useAreaGesture } from './useAreaGesture';

const FAIL_LINES: Record<DistractionKind, string> = {
  fly: 'The fly wins.',
  notification: "It wasn't even a real notification.",
  fakeContinue: 'That CONTINUE button was a lie.',
  freeGems: 'Free gems are never free.',
  stillThere: 'You were still there. We know now.',
  lowBattery: 'Your battery is fine. Your willpower is not.',
  fakeCrash: 'The app did not crash. You did.',
  confetti: 'The confetti was a trap.',
};

export function ScreenMechanic({ config, area, api, stage, seed }: MechanicProps<ScreenConfig>) {
  const { palette, s } = useTheme();
  const distractions = useMemo(() => config.distractions ?? [], [config.distractions]);
  const [visible, setVisible] = useState<DistractionKind[]>([]);
  const lastShown = useRef<DistractionKind | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(stage.timeLimit / 1000));

  // Stagger distractions across the first ~70% of the level.
  useEffect(() => {
    const step = (stage.timeLimit * 0.7) / Math.max(1, distractions.length);
    const timers = distractions.map((d, i) =>
      setTimeout(() => {
        lastShown.current = d;
        setVisible((v) => [...v, d]);
        if (d === 'notification' || d === 'stillThere' || d === 'lowBattery' || d === 'fakeCrash') feedback.warning();
      }, 500 + i * step),
    );
    return () => timers.forEach(clearTimeout);
  }, [distractions, stage.timeLimit]);

  useEffect(() => {
    if (!config.countdown) return;
    const started = Date.now();
    let shown = Math.ceil(stage.timeLimit / 1000);
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((stage.timeLimit - (Date.now() - started)) / 1000));
      if (left === shown) return;
      shown = left;
      if (left > 0 && left <= 3) feedback.countdown();
      setSecondsLeft(left);
    }, 200);
    return () => clearInterval(id);
  }, [config.countdown, stage.timeLimit]);

  const gesture = useAreaGesture({
    onDown: (x, y) => api.fail(lastShown.current ? FAIL_LINES[lastShown.current] : undefined, { x, y }),
  });

  const breathe = usePulse(true, 0.05, 900);

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityLabel="Do not touch the screen" accessibilityHint="Wait until the timer runs out">
        <View style={styles.center}>
          {config.countdown ? (
            <Animated.View style={breathe}>
              <GText variant="display" size={96} outlined center color={secondsLeft <= 2 ? palette.danger : palette.text}>
                {secondsLeft}
              </GText>
            </Animated.View>
          ) : (
            <Animated.View style={breathe}>
              <Text allowFontScaling={false} style={{ fontSize: s(84) }}>{config.emoji ?? '✋'}</Text>
            </Animated.View>
          )}
          <GText muted center size={15}>{config.message ?? 'hands off. completely.'}</GText>
        </View>
        {visible.map((d) => (
          <Distraction key={d} kind={d} area={area} seed={seed} />
        ))}
      </View>
    </GestureDetector>
  );
}

function Distraction({ kind, area, seed }: { kind: DistractionKind; area: PlayArea; seed: number }) {
  const { palette, s } = useTheme();
  const bounce = useBounce(true, 6, 300);
  const pulse = usePulse(true, 0.08, 400);

  switch (kind) {
    case 'fly':
      return <Fly area={area} />;
    case 'notification':
      return (
        <Animated.View entering={SlideInUp.springify().damping(14)} style={[styles.banner, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={styles.bannerIcon}>📩</Text>
          <View style={styles.flex}>
            <GText variant="label" size={14}>New message</GText>
            <GText size={13} muted numberOfLines={1}>&quot;tap here for a surprise 😉&quot;</GText>
          </View>
        </Animated.View>
      );
    case 'fakeContinue':
      return (
        <Animated.View entering={ZoomIn.springify()} style={styles.bottomButton}>
          <Animated.View style={[styles.fakeBtn, { backgroundColor: palette.success, borderColor: palette.border }, pulse]}>
            <Text style={styles.fakeBtnText}>CONTINUE ▶</Text>
          </Animated.View>
        </Animated.View>
      );
    case 'freeGems':
      return (
        <Animated.View entering={ZoomIn.springify()} style={styles.gems}>
          <Animated.View style={[styles.fakeBtn, { backgroundColor: '#9B5CFF', borderColor: palette.border }, bounce]}>
            <Text style={styles.fakeBtnText}>💎 FREE GEMS! TAP!</Text>
          </Animated.View>
        </Animated.View>
      );
    case 'stillThere':
      return (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.dialog, { backgroundColor: palette.surface, borderColor: palette.border, top: area.height * 0.32 }]}>
          <GText variant="heading" size={20} center>Are you still there?</GText>
          <View style={[styles.fakeBtn, styles.dialogBtn, { backgroundColor: palette.accent, borderColor: palette.border }]}>
            <Text style={styles.fakeBtnText}>YES, I&apos;M HERE</Text>
          </View>
        </Animated.View>
      );
    case 'lowBattery':
      return (
        <Animated.View entering={SlideInDown.springify().damping(14)} style={[styles.banner, styles.bannerBottom, { backgroundColor: '#FFF3C4', borderColor: palette.border }]}>
          <Text style={styles.bannerIcon}>🪫</Text>
          <View style={styles.flex}>
            <GText variant="label" size={14} color="#2B1B4A">Battery 2%</GText>
            <GText size={13} color="#6B5A2A">Tap to dismiss</GText>
          </View>
        </Animated.View>
      );
    case 'fakeCrash':
      return (
        <Animated.View entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, styles.crash]}>
          <View style={[styles.dialog, styles.crashDialog]}>
            <GText variant="label" size={17} color="#111">&quot;Don&apos;t Touch That!&quot; isn&apos;t responding</GText>
            <View style={styles.crashRow}>
              <Text style={styles.crashBtn}>CLOSE APP</Text>
              <Text style={styles.crashBtn}>WAIT</Text>
            </View>
          </View>
        </Animated.View>
      );
    case 'confetti':
      return <Confetti area={area} s={s} seed={seed} />;
    default:
      return null;
  }
}

function Fly({ area }: { area: PlayArea }) {
  const x = useSharedValue(area.width * 0.2);
  const y = useSharedValue(area.height * 0.7);
  const rot = useSharedValue(0);
  useEffect(() => {
    const path = Array.from({ length: 6 }, () => ({ x: Math.random() * (area.width - 40), y: Math.random() * (area.height - 40) }));
    x.set(withRepeat(withSequence(...path.map((p) => withTiming(p.x, { duration: 700, easing: Easing.inOut(Easing.sin) }))), -1, true));
    y.set(withRepeat(withSequence(...path.map((p) => withTiming(p.y, { duration: 700, easing: Easing.inOut(Easing.sin) }))), -1, true));
    rot.set(withRepeat(withSequence(withTiming(25, { duration: 120 }), withTiming(-25, { duration: 120 })), -1, true));
  }, [area, x, y, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${rot.value}deg` }] }));
  return <Animated.Text style={[styles.fly, style]}>🪰</Animated.Text>;
}

function Confetti({ area, s, seed }: { area: PlayArea; s: (n: number) => number; seed: number }) {
  const pieces = useMemo(() => {
    const rnd = createRng(seed);
    return Array.from({ length: 14 }, (_, i) => ({ i, x: rnd() * area.width, delay: rnd() * 600 }));
  }, [area.width, seed]);
  return (
    <>
      <Animated.View entering={ZoomIn.springify()} style={styles.youWin}>
        <GText variant="title" size={30} outlined>🎉 YOU WIN! 🎉</GText>
        <GText muted size={13}>(tap to collect your prize)</GText>
      </Animated.View>
      {pieces.map((p) => (
        <ConfettiPiece key={p.i} x={p.x} delay={p.delay} height={area.height} size={s(22)} />
      ))}
    </>
  );
}

function ConfettiPiece({ x, delay, height, size }: { x: number; delay: number; height: number; size: number }) {
  const y = useSharedValue(-30);
  useEffect(() => {
    const t = setTimeout(() => {
      y.set(withRepeat(withTiming(height + 30, { duration: 1800, easing: Easing.linear }), -1));
    }, delay);
    return () => clearTimeout(t);
  }, [delay, height, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${y.value * 2}deg` }] }));
  return <Animated.Text style={[styles.confetti, { left: x, fontSize: size }, style]}>{['🎊', '✨', '🎉'][Math.floor(x) % 3]}</Animated.Text>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  flex: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 18,
    borderWidth: 3,
  },
  bannerBottom: { top: undefined, bottom: 8 },
  bannerIcon: { fontSize: 26 },
  bottomButton: { position: 'absolute', bottom: 16, alignSelf: 'center' },
  gems: { position: 'absolute', top: '22%', right: 12 },
  fakeBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 3 },
  fakeBtnText: { fontFamily: FONTS.display, fontSize: 20, color: '#FFFFFF' },
  dialog: { position: 'absolute', left: 24, right: 24, padding: 18, borderRadius: 22, borderWidth: 3, alignItems: 'center', gap: 12 },
  dialogBtn: { alignSelf: 'stretch', alignItems: 'center' },
  crash: { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  crashDialog: { position: 'relative', left: 0, right: 0, marginHorizontal: 24, backgroundColor: '#F2F2F2', borderColor: '#999', borderRadius: 8, alignItems: 'flex-start' },
  crashRow: { flexDirection: 'row', alignSelf: 'flex-end', gap: 22 },
  crashBtn: { fontFamily: FONTS.bodyHeavy, color: '#1A73E8', fontSize: 15 },
  fly: { position: 'absolute', left: 0, top: 0, fontSize: 30 },
  youWin: { position: 'absolute', top: '12%', alignSelf: 'center', alignItems: 'center' },
  confetti: { position: 'absolute', top: 0 },
});
