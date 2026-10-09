/** Classic chapter select: 10 chapters of 10 levels, unlocked by reaching them. */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { CHAPTERS, LEVELS_PER_CHAPTER } from '@/game/levels';
import { feedback } from '@/services/feedback';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

export function ChaptersScreen() {
  const { palette, s } = useTheme();
  const highestLevel = useProgress((st) => st.progress.highestLevel);
  const currentChapter = Math.floor((highestLevel - 1) / LEVELS_PER_CHAPTER);

  const play = (start: number) => router.push({ pathname: '/play', params: { mode: 'classic', start: String(start) } });

  return (
    <Screen title="CLASSIC" scroll>
      <GameButton
        size="lg"
        label={`CONTINUE · LV ${CHAPTERS[currentChapter].firstLevel + 1}`}
        emoji="▶"
        onPress={() => play(CHAPTERS[currentChapter].firstLevel)}
        style={{ marginVertical: s(12) }}
        accessibilityHint="Start from the beginning of your current chapter"
      />
      <GText muted center size={13} style={styles.note}>Each run starts at the beginning of a chapter. 3 lives. Good luck.</GText>
      <View style={styles.grid}>
        {CHAPTERS.map((c, i) => {
          const unlocked = i <= currentChapter;
          const cleared = highestLevel > c.firstLevel + LEVELS_PER_CHAPTER;
          return (
            <Animated.View key={c.title} entering={FadeInDown.delay(i * 40)} style={styles.cell}>
              <Pressable
                disabled={!unlocked}
                onPress={() => {
                  feedback.button();
                  play(c.firstLevel);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Chapter ${i + 1}: ${c.title}. ${unlocked ? (cleared ? 'Cleared' : 'Unlocked') : 'Locked'}`}
                style={[
                  styles.card,
                  { backgroundColor: unlocked ? palette.surface : palette.surfaceAlt, borderColor: i === currentChapter ? palette.primary : palette.border, opacity: unlocked ? 1 : 0.55 },
                ]}
              >
                <GText size={30}>{unlocked ? c.emoji : '🔒'}</GText>
                <GText variant="heading" size={17} center numberOfLines={1} adjustsFontSizeToFit>{c.title}</GText>
                <GText muted size={12}>
                  Levels {c.firstLevel + 1}–{c.firstLevel + LEVELS_PER_CHAPTER} {cleared ? '✓' : ''}
                </GText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  card: { borderRadius: 22, borderWidth: 3, padding: 12, alignItems: 'center', gap: 2 },
});
