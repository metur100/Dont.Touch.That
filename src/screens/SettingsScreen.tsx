import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { GameButton } from '@/components/GameButton';
import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { STUDIO } from '@/data/studio';
import { feedback } from '@/services/feedback';
import type { ColorSchemePreference, Settings } from '@/services/storage/schema';
import { useProgress } from '@/store/progressStore';
import { isThemeUnlocked, THEMES, unlockHint } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

export function SettingsScreen() {
  const { palette, s, themeId } = useTheme();
  const progress = useProgress((st) => st.progress);
  const settings = progress.settings;
  const setSettings = useProgress((st) => st.setSettings);
  const resetProgress = useProgress((st) => st.resetProgress);

  const toggle = (key: keyof Pick<Settings, 'sound' | 'music' | 'haptics' | 'colorLabels' | 'reduceMotion'>) => (value: boolean) => {
    setSettings({ [key]: value });
    if (value) feedback.tap();
  };

  const confirmReset = () => {
    Alert.alert('Reset all progress?', 'Scores, levels, stats and achievements will be deleted. Settings are kept. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: "DON'T PRESS THIS", style: 'destructive', onPress: () => void resetProgress() },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title="SETTINGS" scroll>
      <Section title="Feedback">
        <Row label="Sound effects" emoji="🔊" value={settings.sound} onChange={toggle('sound')} />
        <Row label="Music" emoji="🎵" value={settings.music} onChange={toggle('music')} />
        <Row label="Haptics" emoji="📳" value={settings.haptics} onChange={toggle('haptics')} />
      </Section>

      <Section title="Look">
        <View style={styles.segment}>
          {(['system', 'light', 'dark'] as ColorSchemePreference[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => {
                feedback.tap();
                setSettings({ colorScheme: mode });
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: settings.colorScheme === mode }}
              style={[styles.segmentItem, { borderColor: palette.border, backgroundColor: settings.colorScheme === mode ? palette.primary : palette.surfaceAlt }]}
            >
              <GText variant="label" size={14} color={settings.colorScheme === mode ? palette.primaryText : palette.text}>
                {mode === 'system' ? 'AUTO' : mode === 'light' ? '☀️ LIGHT' : '🌙 DARK'}
              </GText>
            </Pressable>
          ))}
        </View>
        <GText muted size={13} style={styles.subhead}>Themes</GText>
        <View style={styles.themes}>
          {THEMES.map((t) => {
            const unlocked = isThemeUnlocked(t, progress);
            const active = themeId === t.id;
            return (
              <Pressable
                key={t.id}
                disabled={!unlocked}
                onPress={() => {
                  feedback.tap();
                  setSettings({ theme: t.id });
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled: !unlocked }}
                accessibilityLabel={`${t.name} theme. ${unlocked ? '' : unlockHint(t)}`}
                style={[styles.theme, { borderColor: active ? palette.primary : palette.border, backgroundColor: palette.surface, opacity: unlocked ? 1 : 0.5 }]}
              >
                <View style={[styles.swatch, { backgroundColor: t.light.bg[0] }]}>
                  <GText size={22}>{unlocked ? t.emoji : '🔒'}</GText>
                </View>
                <GText variant="label" size={13}>{t.name}</GText>
                {!unlocked ? <GText muted size={10} center>{unlockHint(t)}</GText> : null}
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Accessibility">
        <Row label="Color names on objects" emoji="🎨" value={settings.colorLabels} onChange={toggle('colorLabels')} />
        <Row label="Reduce screen shake" emoji="🫨" value={settings.reduceMotion} onChange={toggle('reduceMotion')} />
      </Section>

      <Section title="Game">
        <GameButton label="ABOUT & CREDITS" emoji="ℹ️" size="sm" color={palette.accent} onPress={() => router.push('/about')} />
        <GameButton label="RESET PROGRESS" emoji="🗑" size="sm" color={palette.danger} onPress={confirmReset} style={{ marginTop: s(10) }} />
      </Section>

      <GText muted center size={12} style={{ marginTop: s(8) }}>Version {version} · Made by {STUDIO.name}</GText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <GText variant="heading" size={18} style={styles.sectionTitle}>{title}</GText>
      {children}
    </View>
  );
}

function Row({ label, emoji, value, onChange }: { label: string; emoji: string; value: boolean; onChange: (v: boolean) => void }) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      <GText size={20}>{emoji}</GText>
      <GText style={styles.rowLabel}>{label}</GText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: palette.success, false: palette.surfaceAlt }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 22, borderWidth: 3, padding: 14, marginBottom: 12 },
  sectionTitle: { marginBottom: 6 },
  subhead: { marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowLabel: { flex: 1 },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 2 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  theme: { width: '31%', flexGrow: 1, alignItems: 'center', borderWidth: 3, borderRadius: 16, padding: 8, gap: 2 },
  swatch: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
