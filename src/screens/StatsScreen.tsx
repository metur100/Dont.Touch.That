import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (totalMin > 0) return `${m}m`;
  return `${Math.floor(ms / 1000)}s`;
}

export function StatsScreen() {
  const { palette, s } = useTheme();
  const p = useProgress((st) => st.progress);
  const unlocked = Object.keys(p.achievements).length;
  const accuracy = p.levelsPlayed ? Math.round((p.totalSuccesses / p.levelsPlayed) * 100) : 0;

  const tiles: { label: string; value: string; emoji: string; color?: string }[] = [
    { label: 'Games Played', value: p.totalGames.toLocaleString('en-US'), emoji: '🎮' },
    { label: 'Levels Completed', value: p.totalSuccesses.toLocaleString('en-US'), emoji: '✅', color: palette.success },
    { label: 'Highest Level', value: String(p.highestLevel), emoji: '🏔️' },
    { label: 'Best Score', value: p.bestScore.toLocaleString('en-US'), emoji: '⭐', color: palette.warning },
    { label: 'Longest Streak', value: `x${p.longestStreak}`, emoji: '🔥', color: palette.primary },
    { label: 'Successful', value: p.totalSuccesses.toLocaleString('en-US'), emoji: '😇' },
    { label: 'Failed', value: p.totalFailures.toLocaleString('en-US'), emoji: '💥', color: palette.danger },
    { label: 'Things Touched', value: p.totalTouches.toLocaleString('en-US'), emoji: '👆' },
    { label: 'Time Played', value: formatDuration(p.totalPlayMs), emoji: '⏱️' },
    { label: 'Endless Best', value: p.endlessBestScore.toLocaleString('en-US'), emoji: '♾️' },
    { label: 'Bosses Beaten', value: String(p.bossesBeaten), emoji: '👑' },
    { label: 'Willpower', value: `${accuracy}%`, emoji: '🧘', color: palette.accent },
  ];

  return (
    <Screen title="STATS" scroll>
      <View style={styles.grid}>
        {tiles.map((t, i) => (
          <Animated.View key={t.label} entering={FadeInDown.delay(i * 30)} style={styles.cell}>
            <View style={[styles.tile, { backgroundColor: palette.surface, borderColor: palette.border, padding: s(12) }]} accessible accessibilityLabel={`${t.label}: ${t.value}`}>
              <GText size={22}>{t.emoji}</GText>
              <GText variant="heading" size={24} color={t.color} numberOfLines={1} adjustsFontSizeToFit>{t.value}</GText>
              <GText muted size={12} numberOfLines={1}>{t.label}</GText>
            </View>
          </Animated.View>
        ))}
      </View>
      <GameButton
        label="ACHIEVEMENTS"
        emoji="🎖"
        trailing={`${unlocked}/${ACHIEVEMENTS.length}`}
        color={palette.accent}
        onPress={() => router.push('/achievements')}
        style={{ marginTop: s(14) }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 6 },
  cell: { width: '50%', padding: 5 },
  tile: { borderRadius: 20, borderWidth: 3, gap: 2 },
});
