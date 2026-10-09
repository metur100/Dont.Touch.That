import Constants from 'expo-constants';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { OTHER_GAMES, STUDIO } from '@/data/studio';
import { useTheme } from '@/theme/ThemeProvider';

export function AboutScreen() {
  const { palette, s } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const card = [styles.card, { backgroundColor: palette.surface, borderColor: palette.border }];

  return (
    <Screen title="ABOUT" scroll>
      <View style={[card, styles.center]}>
        <GText size={56}>✋</GText>
        <GText variant="title" size={28} outlined center>DON&apos;T TOUCH THAT!</GText>
        <GText muted center>Version {version}</GText>
        <GText center style={{ marginTop: s(8) }}>
          A game about the one thing humans are worst at: not touching the thing.
        </GText>
      </View>

      <View style={card}>
        <GText variant="heading" size={18}>Made by {STUDIO.name}</GText>
        <GText muted>{STUDIO.tagline}</GText>
        {STUDIO.website ? <ExternalLink url={STUDIO.website} label={STUDIO.website.replace('https://', '')} /> : null}
      </View>

      <View style={card}>
        <GText variant="heading" size={18}>More games by {STUDIO.name}</GText>
        {OTHER_GAMES.map((g) => (
          <Pressable
            key={g.id}
            disabled={!g.url}
            onPress={() => g.url && void Linking.openURL(g.url).catch(() => undefined)}
            style={styles.game}
            accessibilityRole={g.url ? 'link' : 'text'}
          >
            <GText size={28}>{g.emoji}</GText>
            <View style={styles.flex}>
              <GText variant="label">{g.title}</GText>
              <GText muted size={13}>{g.description}</GText>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={card}>
        <GText variant="heading" size={18}>Privacy</GText>
        <GText muted>
          This game works fully offline. There are no accounts, no tracking and no ads in this version. Your progress is stored only on
          this device and is deleted when you uninstall the app or reset progress in Settings.
        </GText>
        {STUDIO.privacyUrl ? <ExternalLink url={STUDIO.privacyUrl} label="Full privacy policy" /> : null}
      </View>

      <View style={card}>
        <GText variant="heading" size={18}>Credits</GText>
        <GText muted>Game design, code & questionable humor: {STUDIO.name}</GText>
        <GText muted>Fonts: Lilita One & Nunito (SIL Open Font License)</GText>
        <GText muted>Sounds & music: synthesized in-house</GText>
        <GText muted>Built with React Native & Expo</GText>
        <GText muted>Special thanks: every button that was never pressed.</GText>
      </View>
    </Screen>
  );
}

function ExternalLink({ url, label }: { url: string; label: string }) {
  const { palette } = useTheme();
  return (
    <Pressable onPress={() => void Linking.openURL(url).catch(() => undefined)} accessibilityRole="link">
      <GText color={palette.accent} style={styles.link}>{label}</GText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 3, padding: 16, marginBottom: 12, gap: 4 },
  center: { alignItems: 'center' },
  link: { textDecorationLine: 'underline', marginTop: 4 },
  game: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  flex: { flex: 1 },
});
