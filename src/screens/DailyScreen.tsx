/** Daily Challenge hub: one official attempt per day, unlimited practice. */
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { dateKey, DAILY_LENGTH } from '@/game/generators/endless';
import { usePulse } from '@/hooks/animations';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

function msUntilMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function DailyScreen() {
  const { palette, s } = useTheme();
  const today = useMemo(() => dateKey(), []);
  const result = useProgress((st) => st.progress.dailyChallenges[today]);
  const history = useProgress((st) => st.progress.dailyChallenges);
  const pulse = usePulse(!result, 0.04);
  const [left, setLeft] = useState(msUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setLeft(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const label = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const hh = String(Math.floor(left / 3_600_000)).padStart(2, '0');
  const mm = String(Math.floor((left % 3_600_000) / 60_000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0');
  const recent = Object.values(history)
    .filter((d) => d.completedAt > 0 && d.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <Screen title="DAILY" scroll>
      <Animated.View entering={ZoomIn.springify()}>
      <Animated.View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border, padding: s(20) }, pulse]}>
        <GText variant="label" muted center>DAILY CHALLENGE</GText>
        <GText variant="title" size={36} outlined center>{label}</GText>
        <GText center muted>{DAILY_LENGTH} levels · 3 lives · same for everyone today</GText>
        {result ? (
          <View style={styles.result}>
            <GText variant="label" muted center>{result.completedAt > 0 ? "TODAY'S SCORE" : 'ATTEMPT ABANDONED'}</GText>
            <GText variant="display" size={52} outlined center color={palette.primary}>{result.score.toLocaleString('en-US')}</GText>
            <GText center muted>{result.levelsCleared}/{result.totalLevels} levels cleared</GText>
          </View>
        ) : (
          <GText variant="heading" center size={20} style={styles.result}>One official attempt. Make it count.</GText>
        )}
      </Animated.View>
      </Animated.View>

      <View style={{ gap: s(10), marginTop: s(16) }}>
        {!result ? (
          <GameButton size="lg" label="START OFFICIAL" emoji="📅" onPress={() => router.push({ pathname: '/play', params: { mode: 'daily' } })} accessibilityHint="You only get one try per day" />
        ) : null}
        <GameButton label="PRACTICE" emoji="🎯" color={palette.accent} onPress={() => router.push({ pathname: '/play', params: { mode: 'practice' } })} accessibilityHint="Practice runs don't affect your official score" />
      </View>

      <GText muted center size={13} style={{ marginTop: s(14) }}>
        Next challenge in {hh}:{mm}:{ss}
      </GText>

      {recent.length ? (
        <View style={[styles.history, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <GText variant="heading" size={18}>Recent days</GText>
          {recent.map((d) => (
            <View key={d.date} style={styles.historyRow}>
              <GText muted>{d.date}</GText>
              <GText variant="label">{d.score.toLocaleString('en-US')}</GText>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: 4, gap: 4, marginTop: 8 },
  result: { marginTop: 14 },
  history: { marginTop: 18, borderRadius: 20, borderWidth: 3, padding: 14, gap: 6 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
