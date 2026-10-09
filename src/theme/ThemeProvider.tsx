import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';

import { useProgress } from '@/store/progressStore';

import { getTheme, isThemeUnlocked, THEMES, type Palette } from './themes';

export interface Theme {
  palette: Palette;
  themeId: string;
  /** Scales a size designed for a 390pt-wide phone to the current screen (clamped). */
  s: (size: number) => number;
  width: number;
  height: number;
  /** True on short screens (iPhone SE, 16:9 Androids) to tighten layouts. */
  compact: boolean;
  reduceMotion: boolean;
  colorLabels: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { width, height } = useWindowDimensions();
  const settings = useProgress((st) => st.progress.settings);
  const progress = useProgress((st) => st.progress);

  const themeDef = useMemo(() => {
    const t = getTheme(settings.theme);
    return isThemeUnlocked(t, progress) ? t : THEMES[0];
    // Only re-evaluate when the selected theme or unlock-relevant progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.theme, progress.highestLevel, progress.longestStreak, progress.bossesBeaten, progress.entitlements]);

  const value = useMemo<Theme>(() => {
    const wantDark = settings.colorScheme === 'system' ? system === 'dark' : settings.colorScheme === 'dark';
    const palette = wantDark && themeDef.dark ? themeDef.dark : themeDef.light;
    const factor = Math.min(1.25, Math.max(0.82, Math.min(width / 390, height / 780)));
    return {
      palette,
      themeId: themeDef.id,
      s: (size: number) => Math.round(size * factor),
      width,
      height,
      // Short or 16:9 phones (e.g. iPhone SE, 1080x1920 Androids) get tighter layouts.
      compact: height < 800,
      reduceMotion: settings.reduceMotion,
      colorLabels: settings.colorLabels,
    };
  }, [settings.colorScheme, settings.reduceMotion, settings.colorLabels, system, themeDef, width, height]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
