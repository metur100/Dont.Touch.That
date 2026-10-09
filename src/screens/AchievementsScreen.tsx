import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

export function AchievementsScreen() {
  const { palette, s } = useTheme();
  const progress = useProgress((st) => st.progress);
  const unlockedCount = Object.keys(progress.achievements).length;

  return (
    <Screen title="ACHIEVEMENTS" scroll>
      <GText muted center style={{ marginBottom: s(10) }}>
        {unlockedCount}/{ACHIEVEMENTS.length} unlocked
      </GText>
      {ACHIEVEMENTS.map((a, i) => {
        const unlockedAt = progress.achievements[a.id];
        const pct = Math.round(a.progress(progress) * 100);
        return (
          <Animated.View key={a.id} entering={FadeInDown.delay(i * 35)}>
            <View
              style={[styles.row, { backgroundColor: palette.surface, borderColor: unlockedAt ? palette.warning : palette.border, opacity: unlockedAt ? 1 : 0.8 }]}
              accessible
              accessibilityLabel={`${a.title}. ${a.description}. ${unlockedAt ? 'Unlocked' : `${pct} percent`}`}
            >
              <View style={[styles.badge, { backgroundColor: unlockedAt ? palette.warning : palette.surfaceAlt }]}>
                <GText size={26}>{unlockedAt ? a.emoji : '🔒'}</GText>
              </View>
              <View style={styles.body}>
                <GText variant="heading" size={17}>{a.title}</GText>
                <GText muted size={13}>{a.description}</GText>
                {!unlockedAt ? (
                  <View style={[styles.track, { backgroundColor: palette.surfaceAlt }]}>
                    <View style={[styles.fill, { width: `${pct}%`, backgroundColor: palette.accent }]} />
                  </View>
                ) : (
                  <GText size={12} color={palette.success}>✓ {new Date(unlockedAt).toLocaleDateString()}</GText>
                )}
              </View>
            </View>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 3, marginBottom: 10 },
  badge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  track: { height: 8, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 99 },
});
