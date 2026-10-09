import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import { GText } from './GText';

interface ScreenProps {
  children: ReactNode;
  title?: string;
  /** Show a back button (defaults to true when a title is set). */
  back?: boolean;
  scroll?: boolean;
  padded?: boolean;
}

/** Gradient background + safe areas + optional header. Used by every screen. */
export function Screen({ children, title, back = !!title, scroll, padded = true }: ScreenProps) {
  const { palette, s } = useTheme();
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.content, padded && { paddingHorizontal: s(20) }]}>{children}</View>
  );
  return (
    <LinearGradient colors={palette.bg} style={styles.fill}>
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: scroll ? 0 : insets.bottom }]}>
        {title ? (
          <View style={[styles.header, { paddingHorizontal: s(16) }]}>
            {back ? (
              <Pressable
                onPress={() => {
                  feedback.tap();
                  if (router.canGoBack()) router.back();
                  else router.replace('/');
                }}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={12}
                style={[styles.backButton, { backgroundColor: palette.surface, borderColor: palette.border, width: s(44), height: s(44) }]}
              >
                <GText variant="heading" size={22}>‹</GText>
              </Pressable>
            ) : null}
            <GText variant="title" size={28} outlined style={styles.title} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">
              {title}
            </GText>
            {back ? <View style={{ width: s(44) }} /> : null}
          </View>
        ) : null}
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + s(24) }} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  backButton: { borderRadius: 14, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
});
