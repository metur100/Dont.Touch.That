/**
 * Runs ONE stage: shows the instruction, briefly locks input ("ready"), mounts the mechanic,
 * runs the timer and reports exactly one outcome. Remount (via key) to restart a stage.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { TimerBar } from '@/components/HUD';
import { ParticleBurst } from '@/components/ParticleBurst';
import { useShake } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import { MechanicView } from '@/game/mechanics';
import type { MechanicApi, PlayArea, Point } from '@/game/mechanics/types';
import type { LevelStage, LevelType } from '@/game/types';

export interface StageResult {
  success: boolean;
  /** Explicit message from the mechanic, if any. */
  message?: string;
  timedOut: boolean;
  reactionMs: number;
}

interface LevelRunnerProps {
  stage: LevelStage;
  type: LevelType;
  /** e.g. "STAGE 2/3" for boss levels. */
  stageLabel?: string;
  boss: boolean;
  /** Seed for all randomness inside the mechanic. */
  seed: number;
  onResolved: (result: StageResult) => void;
  onTouch: () => void;
}

type Phase = 'ready' | 'play' | 'done';

export const LevelRunner = memo(function LevelRunner({ stage, type, stageLabel, boss, seed, onResolved, onTouch }: LevelRunnerProps) {
  const { palette, s, reduceMotion, compact } = useTheme();
  const [area, setArea] = useState<PlayArea | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [instruction, setInstructionState] = useState({ text: stage.instruction, hint: stage.hint });
  const [burst, setBurst] = useState({ key: 0, x: 0, y: 0, success: true });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [flash, setFlash] = useState<null | 'success' | 'fail'>(null);

  const done = useRef(false);
  const startedAt = useRef(0);
  const timeoutResult = useRef<'success' | 'fail' | null>(null);
  const onResolvedRef = useRef(onResolved);
  const onTouchRef = useRef(onTouch);
  useEffect(() => {
    onResolvedRef.current = onResolved;
    onTouchRef.current = onTouch;
  });

  const { style: shakeStyle, trigger: triggerShake } = useShake(reduceMotion ? 0 : 14);
  const instrScale = useSharedValue(1);
  const instrStyle = useAnimatedStyle(() => ({ transform: [{ scale: instrScale.get() }] }));

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((prev) => (prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1 ? prev : { width, height }));
  }, []);

  const resolve = useCallback(
    (success: boolean, message: string | undefined, at: Point | undefined, timedOut: boolean) => {
      if (done.current) return;
      done.current = true;
      setPhase('done');
      setFlash(success ? 'success' : 'fail');
      if (at) setBurst((b) => ({ key: b.key + 1, x: at.x, y: at.y, success }));
      if (!success) triggerShake(1);
      onResolvedRef.current({ success, message, timedOut, reactionMs: Date.now() - startedAt.current });
    },
    [triggerShake],
  );

  const api = useMemo<MechanicApi>(
    () => ({
      succeed: (message, at) => resolve(true, message, at, false),
      fail: (message, at) => resolve(false, message, at, false),
      touch: (at) => {
        if (done.current) return;
        onTouchRef.current();
        if (at) {
          feedback.tap();
          const id = Date.now() + Math.random();
          setRipples((r) => [...r.slice(-4), { id, x: at.x, y: at.y }]);
        }
      },
      setInstruction: (text, hint) => {
        setInstructionState({ text, hint });
        instrScale.set(withSequence(withTiming(1.15, { duration: 90 }), withSpring(1, { damping: 8 })));
      },
      setTimeoutResult: (result) => {
        timeoutResult.current = result;
      },
      isDone: () => done.current,
    }),
    [resolve, instrScale],
  );

  // Ready phase: read the instruction, input locked, then play.
  useEffect(() => {
    feedback.levelStart(boss);
    instrScale.set(0.6);
    instrScale.set(withSpring(1, { damping: 9, stiffness: 180 }));
    const readyMs = Math.min(1100, 520 + stage.instruction.length * 12 + (stageLabel ? 150 : 0));
    const t = setTimeout(() => {
      startedAt.current = Date.now();
      setPhase('play');
    }, readyMs);
    return () => clearTimeout(t);
    // Runs once per mount (the parent remounts for each stage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stage timer.
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setTimeout(() => {
      const override = timeoutResult.current;
      const success = override ? override === 'success' : stage.goal === 'survive';
      resolve(success, undefined, undefined, !success);
    }, stage.timeLimit);
    return () => clearTimeout(t);
  }, [phase, stage.timeLimit, stage.goal, resolve]);

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.instruction, { paddingVertical: s(compact ? 6 : 10) }, instrStyle]}>
        {stageLabel ? (
          <View style={[styles.stageTag, { backgroundColor: palette.danger }]}>
            <GText variant="label" size={12} color="#FFF">{stageLabel}</GText>
          </View>
        ) : null}
        <GText variant="title" size={compact ? 26 : 30} center outlined accessibilityRole="header" accessibilityLiveRegion="assertive">
          {instruction.text}
        </GText>
        {instruction.hint ? (
          <GText muted center size={15}>{instruction.hint}</GText>
        ) : null}
      </Animated.View>

      <View style={[styles.timer, { paddingHorizontal: s(4) }]}>
        <TimerBar duration={stage.timeLimit} runKey={phase === 'ready' ? 'ready' : 'play'} paused={phase !== 'play'} color={stage.goal === 'act' ? palette.accent : palette.success} />
      </View>

      <Animated.View style={[styles.playArea, { backgroundColor: palette.surface + 'AA', borderColor: palette.border }, shakeStyle]} onLayout={onLayout}>
        {area && phase !== 'ready' ? (
          <View style={StyleSheet.absoluteFill} pointerEvents={phase === 'done' ? 'none' : 'auto'}>
            <MechanicView config={stage.mechanic} stage={stage} type={type} area={area} api={api} seed={seed} />
          </View>
        ) : null}
        {phase === 'ready' ? (
          <Animated.View entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(120)} style={styles.ready} pointerEvents="none">
            <GText variant="display" size={46} outlined center color={boss ? palette.danger : palette.text}>
              {boss ? '⚠️ BOSS ⚠️' : 'READY?'}
            </GText>
            <GText muted center>{stage.goal === 'act' ? 'You will have to act.' : 'Hands off...'}</GText>
          </Animated.View>
        ) : null}
        {ripples.map((r) => (
          <Ripple key={r.id} x={r.x} y={r.y} color={palette.textMuted} />
        ))}
        {flash ? (
          <Animated.View entering={FadeIn.duration(80)} pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Static opacity lives on an inner view so it doesn't fight the FadeIn layout animation. */}
            <View style={[StyleSheet.absoluteFill, styles.flash, { backgroundColor: flash === 'success' ? palette.success : palette.danger }]} />
          </Animated.View>
        ) : null}
        <ParticleBurst
          burstKey={burst.key}
          x={burst.x}
          y={burst.y}
          colors={burst.success ? ['#22C55E', '#FFD233', '#2F80FF', '#FF6FB5'] : ['#FF3B4E', '#FF8A1F', '#2B1B4A']}
          emojis={burst.success ? ['⭐', '✨'] : ['💥', '💢']}
        />
      </Animated.View>
    </View>
  );
});

function Ripple({ x, y, color }: { x: number; y: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: 380 }));
  }, [p]);
  const style = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - p.value), transform: [{ scale: 0.3 + p.value * 1.4 }] }));
  return <Animated.View pointerEvents="none" style={[styles.ripple, { left: x - 30, top: y - 30, borderColor: color }, style]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  instruction: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, minHeight: 84, gap: 2 },
  stageTag: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99, marginBottom: 4 },
  timer: { marginBottom: 8 },
  playArea: { flex: 1, borderRadius: 28, borderWidth: 3, overflow: 'hidden' },
  ready: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 6 },
  flash: { opacity: 0.18 },
  ripple: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3 },
});
