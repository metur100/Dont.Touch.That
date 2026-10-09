/** Game over / run complete panel. */
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { pickMessage } from '@/data/messages';
import { useTheme } from '@/theme/ThemeProvider';

interface EndPanelProps {
  complete: boolean;
  title?: string;
  score: number;
  bestScore: number;
  newBest: boolean;
  reachedLabel: string;
  bestStreak: number;
  canRevive: boolean;
  reviving: boolean;
  onRevive: () => void;
  onRestart: () => void;
  onMenu: () => void;
  restartLabel?: string;
}

export const EndPanel = memo(function EndPanel(p: EndPanelProps) {
  const { palette, s } = useTheme();
  const overTitle = useMemo(() => pickMessage('gameOver'), []);
  const title = p.title ?? (p.complete ? 'YOU MADE IT!' : overTitle);

  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: palette.dark ? 'rgba(10,4,24,0.86)' : 'rgba(255,244,224,0.92)' }]}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border, padding: s(22) }]}>
        <GText size={64} center>{p.complete ? '🏆' : '🙈'}</GText>
        <GText variant="title" size={30} outlined center color={p.complete ? palette.success : palette.danger}>{title}</GText>
        <View style={styles.stats}>
          <Stat label="SCORE" value={p.score.toLocaleString('en-US')} highlight />
          <Stat label="BEST" value={p.bestScore.toLocaleString('en-US')} />
          <Stat label="REACHED" value={p.reachedLabel} />
          <Stat label="BEST STREAK" value={`x${p.bestStreak}`} />
        </View>
        {p.newBest ? (
          <Animated.View entering={FadeIn.delay(300)} style={[styles.newBest, { backgroundColor: palette.warning }]}>
            <GText variant="label" size={14} color="#2B1B4A">⭐ NEW BEST SCORE ⭐</GText>
          </Animated.View>
        ) : null}
        <View style={styles.buttons}>
          {p.canRevive ? (
            <GameButton label={p.reviving ? 'LOADING AD…' : 'REVIVE'} emoji="📺" color={palette.accent} onPress={p.onRevive} disabled={p.reviving} accessibilityHint="Watch an ad to continue with one life" />
          ) : null}
          <GameButton label={p.restartLabel ?? 'PLAY AGAIN'} emoji="🔁" onPress={p.onRestart} />
          <GameButton label="MAIN MENU" emoji="🏠" size="sm" color={palette.surfaceAlt} textColor={palette.text} onPress={p.onMenu} />
        </View>
      </Animated.View>
    </View>
  );
});

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={styles.stat}>
      <GText muted size={12} center>{label}</GText>
      <GText variant="heading" size={highlight ? 26 : 20} center color={highlight ? palette.primary : palette.text}>{value}</GText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, borderRadius: 30, borderWidth: 4, gap: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  stat: { width: '50%', paddingVertical: 6 },
  newBest: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 99, marginBottom: 6 },
  buttons: { gap: 10, marginTop: 6 },
});
