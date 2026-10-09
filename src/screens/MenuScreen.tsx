import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { MESSAGES } from '@/data/messages';
import { STUDIO } from '@/data/studio';
import { dateKey } from '@/game/generators/endless';
import { createRng } from '@/game/generators/random';
import { useShake } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

export function MenuScreen() {
  const { palette, s, compact, height, width } = useTheme();
  const seenIntro = useProgress((st) => st.progress.seenIntro);
  const bestScore = useProgress((st) => st.progress.bestScore);
  const currentStreak = useProgress((st) => st.progress.currentStreak);
  const levelsCompleted = useProgress((st) => st.progress.totalSuccesses);
  const highestLevel = useProgress((st) => st.progress.highestLevel);
  const dailyDone = useProgress((st) => !!st.progress.dailyChallenges[dateKey()]);
  const [quip, setQuip] = useState<string | null>(null);
  const quipIndex = useRef(0);
  const quipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake = useShake(10);

  useEffect(() => () => {
    if (quipTimer.current) clearTimeout(quipTimer.current);
  }, []);

  if (!seenIntro) return <Redirect href="/intro" />;

  const say = (text: string) => {
    setQuip(text);
    if (quipTimer.current) clearTimeout(quipTimer.current);
    quipTimer.current = setTimeout(() => setQuip(null), 1600);
  };

  const onTitleTap = () => {
    feedback.tap();
    shake.trigger(0.8);
    say(MESSAGES.menuTitleTap[quipIndex.current % MESSAGES.menuTitleTap.length]);
    quipIndex.current += 1;
  };

  const btn = compact ? 'md' : 'lg';
  const titleScale = compact ? 0.82 : 1;

  return (
    // Scrolls only if a very short screen still cannot fit everything; the footer never overlaps.
    <Screen padded scroll>
      <FloatingDecor emojis={palette.decor} width={width} height={height} />
      <View style={[styles.top, { marginTop: s(compact ? 8 : 24) }]}>
        <Pressable onPress={onTitleTap} accessibilityRole="header" accessibilityLabel="Don't Touch That!" accessibilityHint="It's not a button. Mostly.">
          <Animated.View style={shake.style}>
            <Title scale={titleScale} />
          </Animated.View>
        </Pressable>
        <View style={styles.quipSlot}>
          {quip ? (
            <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(150)} style={[styles.quip, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <GText variant="label" size={14}>{quip}</GText>
            </Animated.View>
          ) : null}
        </View>
      </View>

      <View style={[styles.stats, { backgroundColor: palette.surface, borderColor: palette.border, marginVertical: s(compact ? 6 : 14) }]}>
        <MiniStat label="BEST" value={bestScore.toLocaleString('en-US')} />
        <View style={[styles.divider, { backgroundColor: palette.border }]} />
        <MiniStat label="STREAK" value={`🔥 ${currentStreak}`} />
        <View style={[styles.divider, { backgroundColor: palette.border }]} />
        <MiniStat label="CLEARED" value={levelsCompleted.toLocaleString('en-US')} />
      </View>

      <View style={[styles.buttons, { gap: s(compact ? 6 : 10) }]}>
        <GameButton
          size={btn}
          label="PLAY"
          emoji="▶"
          color={palette.menu[0]}
          trailing={highestLevel > 1 ? `Lv ${highestLevel}` : undefined}
          onPress={() => (highestLevel > 1 ? router.push('/chapters') : router.push({ pathname: '/play', params: { mode: 'classic', start: '0' } }))}
          accessibilityHint="Play the 100 classic levels"
        />
        <GameButton size={btn} label="ENDLESS" emoji="♾" color={palette.menu[1]} onPress={() => router.push({ pathname: '/play', params: { mode: 'endless' } })} />
        <GameButton size={btn} label="DAILY" emoji="📅" color={palette.menu[2]} trailing={dailyDone ? '✓' : 'NEW'} onPress={() => router.push('/daily')} />
        <View style={styles.row}>
          <GameButton style={styles.flex} size="md" label="STATS" emoji="🏆" color={palette.menu[3]} onPress={() => router.push('/stats')} />
          <GameButton style={styles.flex} size="md" label="SETTINGS" emoji="⚙" color={palette.menu[4]} onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={styles.footer}>
        <ForbiddenButton onPress={(n) => say(n === 1 ? "...don't." : n < 5 ? 'Seriously.' : n < 10 ? 'I can do this all day.' : 'Okay you win. Nothing happens.')} />
        <GText muted size={12} center>Made by {STUDIO.name}</GText>
      </View>
    </Screen>
  );
}

/** Each word drops in, then the whole title gently wobbles forever. */
function Title({ scale }: { scale: number }) {
  const { palette, s } = useTheme();
  const words = ["DON'T", 'TOUCH', 'THAT!'];
  const wobble = useSharedValue(0);
  useEffect(() => {
    wobble.set(withDelay(900, withRepeat(withSequence(withTiming(2.5, { duration: 1300, easing: Easing.inOut(Easing.sin) }), withTiming(-2.5, { duration: 1300, easing: Easing.inOut(Easing.sin) })), -1, true)));
  }, [wobble]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  return (
    <Animated.View style={[styles.title, style]}>
      {words.map((w, i) => (
        <DropWord key={w} word={w} index={i} color={i === 2 ? palette.primary : palette.text} size={s((i === 2 ? 66 : 54) * scale)} />
      ))}
    </Animated.View>
  );
}

function DropWord({ word, index, color, size }: { word: string; index: number; color: string; size: number }) {
  const { palette } = useTheme();
  const y = useSharedValue(-260);
  const rot = useSharedValue(index % 2 ? 8 : -8);
  useEffect(() => {
    y.set(withDelay(index * 140, withSpring(0, { damping: 9, stiffness: 140 })));
    rot.set(withDelay(index * 140, withSpring(index === 1 ? 2 : index === 2 ? -3 : -1, { damping: 6 })));
  }, [index, y, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }] }));
  return (
    <Animated.Text
      allowFontScaling={false}
      style={[styles.word, { fontSize: size, lineHeight: size * 1.02, color, textShadowColor: palette.border }, style]}
    >
      {word}
    </Animated.Text>
  );
}

function ForbiddenButton({ onPress }: { onPress: (count: number) => void }) {
  const count = useRef(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.set(withRepeat(withSequence(withTiming(1.12, { duration: 500 }), withTiming(1, { duration: 500 })), -1));
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={() => {
        count.current += 1;
        feedback.failure();
        onPress(count.current);
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="A small red button you should not press"
    >
      <Animated.View style={[styles.redButton, style]}>
        <Text allowFontScaling={false} style={styles.redButtonText}>DON&apos;T</Text>
      </Animated.View>
    </Pressable>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <GText muted size={11} variant="label" center>{label}</GText>
      <GText variant="heading" size={20} center numberOfLines={1} adjustsFontSizeToFit>{value}</GText>
    </View>
  );
}

function FloatingDecor({ emojis, width, height }: { emojis: string[]; width: number; height: number }) {
  const items = useMemo(() => {
    const rnd = createRng(7);
    return Array.from({ length: 7 }, (_, i) => ({ i, emoji: emojis[i % emojis.length], x: rnd() * (width - 40), y: rnd() * height, d: 5000 + rnd() * 4000 }));
  }, [emojis, width, height]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((it) => (
        <Floater key={it.i} {...it} />
      ))}
    </View>
  );
}

function Floater({ emoji, x, y, d }: { emoji: string; x: number; y: number; d: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: d, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t, d]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -30 * t.value }, { rotate: `${t.value * 30 - 15}deg` }] }));
  return <Animated.Text style={[styles.floater, { left: x, top: y }, style]}>{emoji}</Animated.Text>;
}

const styles = StyleSheet.create({
  top: { alignItems: 'center' },
  title: { alignItems: 'center' },
  word: { fontFamily: 'LilitaOne_400Regular', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 0, textAlign: 'center' },
  quipSlot: { height: 36, justifyContent: 'center' },
  quip: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, borderWidth: 2 },
  stats: { flexDirection: 'row', borderRadius: 22, borderWidth: 3, paddingVertical: 10 },
  miniStat: { flex: 1, paddingHorizontal: 4 },
  divider: { width: 2, opacity: 0.15 },
  buttons: {},
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  footer: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 4 },
  redButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FF3B4E', borderWidth: 3, borderColor: '#8A0F20', alignItems: 'center', justifyContent: 'center' },
  redButtonText: { color: '#FFF', fontFamily: 'LilitaOne_400Regular', fontSize: 13 },
  floater: { position: 'absolute', fontSize: 28, opacity: 0.18 },
});
