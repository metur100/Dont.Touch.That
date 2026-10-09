import { LilitaOne_400Regular, useFonts } from '@expo-google-fonts/lilita-one';
import { Nunito_700Bold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AchievementToast } from '@/components/AchievementToast';
import { audio } from '@/services/audio/audio';
import { flushProgress, useProgress } from '@/store/progressStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ LilitaOne_400Regular, Nunito_700Bold, Nunito_900Black });
  const hydrated = useProgress((st) => st.hydrated);
  const music = useProgress((st) => st.progress.settings.music);
  const ready = hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    void useProgress.getState().hydrate();
    // Never lose progress to the save debounce when the app is backgrounded or killed.
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && useProgress.getState().hydrated) void flushProgress();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => undefined);
    void audio.init().then(() => audio.syncMusic(true));
  }, [ready]);

  useEffect(() => {
    if (ready) audio.syncMusic(true);
  }, [music, ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: true }}>
            <Stack.Screen name="play" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
            <Stack.Screen name="intro" options={{ gestureEnabled: false, animation: 'fade' }} />
          </Stack>
          <AchievementToast />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { palette } = useTheme();
  return <StatusBar style={palette.dark ? 'light' : 'dark'} />;
}

/** Last-resort crash screen: the game should never just die. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorEmoji}>🙈</Text>
      <Text style={styles.errorTitle}>Something touched something it shouldn&apos;t have.</Text>
      <Text style={styles.errorBody}>{error.message}</Text>
      <Pressable onPress={retry} style={styles.errorButton} accessibilityRole="button">
        <Text style={styles.errorButtonText}>TRY AGAIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF4E0', gap: 12 },
  errorEmoji: { fontSize: 64 },
  errorTitle: { fontSize: 22, fontWeight: '900', color: '#2B1B4A', textAlign: 'center' },
  errorBody: { fontSize: 14, color: '#6E5C8F', textAlign: 'center' },
  errorButton: { backgroundColor: '#FF4D5E', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18 },
  errorButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
});
