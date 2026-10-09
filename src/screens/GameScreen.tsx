/**
 * The game screen for every mode. Owns the run state machine, picks levels from the mode's level
 * source, and wires results into persistent progress.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EndPanel } from '@/components/game/EndPanel';
import { LevelRunner, type StageResult } from '@/components/game/LevelRunner';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { Hearts, ScoreCounter } from '@/components/HUD';
import { failureMessage, pickMessage } from '@/data/messages';
import { createLevelSource } from '@/game/engine/levelSource';
import { MODE_RULES } from '@/game/engine/modes';
import { createRun, runReducer } from '@/game/engine/runReducer';
import { stagesOf } from '@/game/engine/validation';
import { dateKey, endlessRoundKind } from '@/game/generators/endless';
import { hashString } from '@/game/generators/random';
import { LEVELS_PER_CHAPTER } from '@/game/levels';
import type { GameMode } from '@/game/types';
import { ads, interstitialPolicy } from '@/services/ads/AdService';
import { feedback } from '@/services/feedback';
import { hasEntitlement } from '@/services/purchases/PurchaseService';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

const MODES: GameMode[] = ['classic', 'endless', 'daily', 'practice'];
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export function GameScreen() {
  const params = useLocalSearchParams<{ mode?: string; start?: string }>();
  const mode: GameMode = MODES.includes(params.mode as GameMode) ? (params.mode as GameMode) : 'classic';
  const initialStart = mode === 'classic' ? Math.max(0, Math.min(99, parseInt(params.start ?? '0', 10) || 0)) : 0;
  const { palette, s, compact } = useTheme();
  const insets = useSafeAreaInsets();

  const today = useMemo(() => dateKey(), []);
  const [seed, setSeed] = useState(newSeed);
  const source = useMemo(() => createLevelSource(mode, { seed, dateKey: today }), [mode, seed, today]);
  const [run, dispatch] = useReducer(runReducer, undefined, () => createRun(mode, initialStart));
  const [stagePos, setStagePos] = useState({ attempt: 0, stage: 0 });
  const [paused, setPaused] = useState(false);
  const [resumeNonce, setResumeNonce] = useState(0);
  const [reviving, setReviving] = useState(false);

  const recordLevel = useProgress((st) => st.recordLevel);
  const recordRun = useProgress((st) => st.recordRun);
  const recordDaily = useProgress((st) => st.recordDaily);
  const startDaily = useProgress((st) => st.startDaily);
  const bestScore = useProgress((st) => st.progress.bestScore);
  const entitlements = useProgress((st) => st.progress.entitlements);

  const touches = useRef(0);
  const runStartedAt = useRef(0);
  const runRecorded = useRef(false);
  const [bestBefore, setBestBefore] = useState(bestScore);
  const resultShownAt = useRef(0);

  const level = source.get(run.index);
  const stages = useMemo(() => (level ? stagesOf(level) : []), [level]);
  const stageIndex = stagePos.attempt === run.attempt ? Math.min(stagePos.stage, stages.length - 1) : 0;
  const stage = stages[stageIndex];
  const isBoss = level?.tag === 'boss';

  useEffect(() => {
    runStartedAt.current = Date.now();
  }, []);

  // The official daily attempt is consumed as soon as it starts.
  useEffect(() => {
    if (mode === 'daily') startDaily(today, source.total ?? 10);
  }, [mode, startDaily, today, source.total]);

  const onTouch = useCallback(() => {
    touches.current += 1;
  }, []);

  const onResolved = useCallback(
    (r: StageResult) => {
      if (!level || !stage) return;
      if (r.success && stageIndex < stages.length - 1) {
        feedback.streak();
        setTimeout(() => setStagePos({ attempt: run.attempt, stage: stageIndex + 1 }), 450);
        return;
      }
      const message = r.success
        ? r.message ?? stage.successMessage ?? level.successMessage ?? pickMessage(stage.goal === 'act' ? 'actSuccess' : 'success')
        : r.timedOut
          ? stage.timeoutMessage ?? pickMessage('timeout')
          : r.message ?? stage.failureMessage ?? failureMessage(level.type, level.failureMessage);
      if (r.success) {
        feedback.success();
        if (run.streak + 1 >= 2) setTimeout(() => feedback.streak(), 280);
      } else {
        feedback.failure();
      }
      resultShownAt.current = Date.now();
      dispatch({
        type: 'resolve',
        success: r.success,
        level: { points: level.points, goal: stage.goal, timeLimit: stage.timeLimit, boss: isBoss },
        reactionMs: r.reactionMs,
        message,
      });
      const ignoredForbidden = stage.goal === 'survive' || stage.mechanic.kind === 'choice' || stage.mechanic.kind === 'chase';
      recordLevel({ mode, levelIndex: run.index, success: r.success, boss: isBoss, ignoredForbidden, touches: touches.current });
      touches.current = 0;
    },
    [level, stage, stageIndex, stages.length, run.attempt, run.streak, run.index, isBoss, mode, recordLevel],
  );

  // Auto-advance after the result has had its moment.
  useEffect(() => {
    if (run.status !== 'result' || !run.last) return;
    const ms = run.last.success ? (run.last.milestone ? 2100 : 1350) : 1800;
    const t = setTimeout(() => dispatch({ type: 'advance' }), ms);
    return () => clearTimeout(t);
  }, [run.status, run.last]);

  const skipResult = useCallback(() => {
    if (Date.now() - resultShownAt.current > 400) dispatch({ type: 'advance' });
  }, []);

  const finishRun = useCallback(() => {
    if (runRecorded.current) return;
    runRecorded.current = true;
    recordRun({ mode, score: run.score, durationMs: Date.now() - runStartedAt.current, reachedIndex: run.index });
    if (mode === 'daily') {
      recordDaily({ date: today, score: run.score, levelsCleared: run.successes, totalLevels: source.total ?? 10, completedAt: Date.now() });
    }
  }, [mode, run.score, run.index, run.successes, recordRun, recordDaily, today, source.total]);

  // Record the run when it ends.
  useEffect(() => {
    if (run.status === 'over' || run.status === 'complete') finishRun();
  }, [run.status, finishRun]);

  // Pause when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && run.status === 'playing') setPaused(true);
    });
    return () => sub.remove();
  }, [run.status]);

  // Android back button opens the pause menu instead of leaving mid-level.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (run.status === 'playing' || run.status === 'result') {
        setPaused((p) => !p);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [run.status]);

  const leave = useCallback(async () => {
    if (run.status === 'playing' || run.status === 'result') {
      // Quitting mid-run still counts (and consumes the daily attempt).
      if (run.successes + run.failures > 0 || mode === 'daily') finishRun();
    }
    if (interstitialPolicy.shouldShow(hasEntitlement(entitlements, 'remove_ads'))) await ads.showInterstitial();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [run.status, run.successes, run.failures, mode, finishRun, entitlements]);

  const restart = useCallback(async () => {
    if (mode === 'daily') {
      // The official attempt is used up; continue in practice mode.
      router.replace({ pathname: '/play', params: { mode: 'practice' } });
      return;
    }
    if (interstitialPolicy.shouldShow(hasEntitlement(entitlements, 'remove_ads'))) await ads.showInterstitial();
    runRecorded.current = false;
    runStartedAt.current = Date.now();
    setBestBefore((b) => Math.max(b, run.score));
    touches.current = 0;
    setStagePos({ attempt: -1, stage: 0 });
    if (mode === 'endless') setSeed(newSeed());
    const startIndex = mode === 'classic' ? Math.floor(Math.min(run.index, 99) / LEVELS_PER_CHAPTER) * LEVELS_PER_CHAPTER : 0;
    dispatch({ type: 'restart', startIndex: run.status === 'complete' && mode === 'classic' ? 0 : startIndex });
  }, [mode, run.index, run.score, run.status, entitlements]);

  const revive = useCallback(async () => {
    setReviving(true);
    const ok = await ads.showRewarded('revive');
    setReviving(false);
    if (ok) {
      runRecorded.current = false;
      dispatch({ type: 'revive' });
    }
  }, []);

  const levelLabel = mode === 'daily' || mode === 'practice' ? `${run.index + 1}/${source.total}` : `${run.index + 1}`;
  const roundKind = mode === 'endless' ? endlessRoundKind(run.index) : isBoss ? 'boss' : level?.tag === 'special' ? 'special' : 'normal';
  const over = run.status === 'over' || run.status === 'complete';

  return (
    <LinearGradient colors={palette.bg} style={styles.fill}>
      <View style={[styles.fill, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 6, paddingHorizontal: s(14) }]}>
        {/* HUD */}
        <View style={styles.hudRow}>
          <Pressable
            onPress={() => {
              feedback.tap();
              setPaused(true);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Pause"
            style={[styles.pause, { backgroundColor: palette.surface, borderColor: palette.border, width: s(42), height: s(42) }]}
          >
            <GText variant="heading" size={18}>❚❚</GText>
          </Pressable>
          <View style={styles.levelBlock}>
            <GText muted size={11} variant="label">{MODE_RULES[mode].label}</GText>
            <GText variant="heading" size={20} accessibilityLabel={`Level ${levelLabel}`}>LEVEL {levelLabel}</GText>
          </View>
          <View style={styles.scoreBlock}>
            <GText muted size={11} variant="label">SCORE</GText>
            <ScoreCounter value={run.score} size={22} />
          </View>
        </View>
        <View style={[styles.hudRow, styles.hudRow2]}>
          <Hearts lives={run.lives} max={run.maxLives} />
          {roundKind !== 'normal' ? (
            <View style={[styles.tag, { backgroundColor: roundKind === 'boss' ? palette.danger : palette.accent }]}>
              <GText variant="label" size={12} color="#FFF">{roundKind === 'boss' ? '👑 BOSS ROUND' : '⭐ SPECIAL ROUND'}</GText>
            </View>
          ) : null}
          <StreakChip streak={run.streak} />
        </View>

        {/* Level */}
        <View style={[styles.fill, { marginTop: s(compact ? 2 : 6) }]}>
          {stage && level && !paused && run.status !== 'over' && run.status !== 'complete' ? (
            <LevelRunner
              key={`${run.attempt}-${stageIndex}-${resumeNonce}`}
              stage={stage}
              type={level.type}
              boss={isBoss}
              seed={hashString(`${seed}:${run.index}:${run.attempt}:${stageIndex}:${resumeNonce}`)}
              stageLabel={stages.length > 1 ? `STAGE ${stageIndex + 1}/${stages.length}` : undefined}
              onResolved={onResolved}
              onTouch={onTouch}
            />
          ) : null}
          {run.status === 'result' && run.last ? (
            <View style={[StyleSheet.absoluteFill, styles.resultWrap]}>
              <ResultOverlay outcome={run.last} survive={stage?.goal === 'survive'} livesLeft={run.lives} onSkip={skipResult} />
            </View>
          ) : null}
        </View>

        <ProgressDots mode={mode} index={run.index} total={source.total} />
      </View>

      {paused && !over ? (
        <Animated.View entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, styles.pauseWrap, { backgroundColor: palette.dark ? 'rgba(10,4,24,0.85)' : 'rgba(255,244,224,0.92)' }]}>
          <Animated.View entering={ZoomIn.springify()} style={[styles.pauseCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <GText variant="title" size={34} outlined center>PAUSED</GText>
            <GText muted center>Don&apos;t touch anything. Except these.</GText>
            <GameButton
              label="RESUME"
              emoji="▶"
              onPress={() => {
                setPaused(false);
                // The interrupted stage restarts fresh: no free peeking.
                setResumeNonce((n) => n + 1);
              }}
            />
            <GameButton label="QUIT" emoji="🏠" color={palette.surfaceAlt} textColor={palette.text} onPress={leave} accessibilityHint={mode === 'daily' ? 'Quitting uses up today\'s official attempt' : undefined} />
            {mode === 'daily' ? <GText muted size={12} center>Quitting ends today&apos;s official attempt.</GText> : null}
          </Animated.View>
        </Animated.View>
      ) : null}

      {over ? (
        <EndPanel
          complete={run.status === 'complete'}
          title={
            run.status === 'complete'
              ? mode === 'classic' ? 'ALL 100 LEVELS. UNTOUCHED.' : mode === 'daily' ? `TODAY'S SCORE: ${run.score.toLocaleString('en-US')}` : 'PRACTICE COMPLETE'
              : mode === 'daily' ? `TODAY'S SCORE: ${run.score.toLocaleString('en-US')}` : undefined
          }
          score={run.score}
          bestScore={Math.max(bestScore, run.score)}
          newBest={MODE_RULES[mode].recordsStats && run.score > bestBefore && run.score > 0}
          reachedLabel={mode === 'daily' || mode === 'practice' ? `${run.successes}/${source.total} cleared` : `Level ${Math.min(run.index + 1, source.total ?? Infinity)}`}
          bestStreak={run.bestStreak}
          canRevive={run.status === 'over' && !run.revived && mode !== 'daily'}
          reviving={reviving}
          onRevive={revive}
          onRestart={restart}
          onMenu={leave}
          restartLabel={mode === 'daily' ? 'PRACTICE' : mode === 'classic' && run.status !== 'complete' ? 'RETRY CHAPTER' : 'PLAY AGAIN'}
        />
      ) : null}
    </LinearGradient>
  );
}

function StreakChip({ streak }: { streak: number }) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (streak >= 2) scale.set(withSequence(withTiming(1.4, { duration: 110 }), withSpring(1, { damping: 6 })));
  }, [streak, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.streak, { backgroundColor: streak >= 2 ? palette.primary : 'transparent' }, style]} accessible accessibilityLabel={`Streak ${streak}`}>
      {streak >= 2 ? <GText variant="label" size={14} color="#FFF">🔥 x{streak}</GText> : null}
    </Animated.View>
  );
}

function ProgressDots({ mode, index, total }: { mode: GameMode; index: number; total: number | null }) {
  const { palette, s } = useTheme();
  if (mode === 'endless') {
    const n = index + 1;
    const toSpecial = 10 - (n % 10 === 0 ? 10 : n % 10);
    const toBoss = 25 - (n % 25 === 0 ? 25 : n % 25);
    return (
      <GText muted size={12} center style={styles.progressText}>
        {toBoss <= toSpecial ? `👑 boss in ${toBoss || 25}` : `⭐ special in ${toSpecial || 10}`} · difficulty climbs every 5
      </GText>
    );
  }
  const count = mode === 'classic' ? LEVELS_PER_CHAPTER : total ?? 10;
  const pos = mode === 'classic' ? index % LEVELS_PER_CHAPTER : index;
  return (
    <View style={styles.dots} accessible accessibilityLabel={`Progress ${pos + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: s(i === pos ? 18 : 8),
            height: s(8),
            borderRadius: 99,
            backgroundColor: i < pos ? palette.success : i === pos ? palette.primary : palette.textMuted,
            opacity: i > pos ? 0.35 : 1,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hudRow2: { justifyContent: 'space-between', marginTop: 6 },
  pause: { borderRadius: 14, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  levelBlock: { flex: 1 },
  scoreBlock: { alignItems: 'flex-end' },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  streak: { minWidth: 60, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, alignItems: 'center' },
  resultWrap: { top: 0 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingTop: 10 },
  progressText: { paddingTop: 8 },
  pauseWrap: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  pauseCard: { width: '100%', maxWidth: 400, borderRadius: 28, borderWidth: 4, padding: 22, gap: 12 },
});
