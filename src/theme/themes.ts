/**
 * Theme definitions. A theme is just a palette + decoration, so new themes are pure data.
 * Themes unlock through play, seasons, or (future) purchases.
 */
import type { ProgressState } from '@/services/storage/schema';
import { hasEntitlement } from '@/services/purchases/PurchaseService';

export interface Palette {
  dark: boolean;
  /** Background gradient, top to bottom. */
  bg: [string, string];
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  warning: string;
  accent: string;
  /** Colors cycled for the main menu buttons. */
  menu: string[];
  /** Emoji floating in the menu background. */
  decor: string[];
}

export type ThemeUnlock =
  | { type: 'free' }
  | { type: 'level'; level: number }
  | { type: 'streak'; streak: number }
  | { type: 'boss' }
  | { type: 'season'; months: number[] }
  | { type: 'purchase'; entitlement: string };

export interface ThemeDef {
  id: string;
  name: string;
  emoji: string;
  light: Palette;
  dark?: Palette;
  unlock: ThemeUnlock;
}

const PLAYFUL_LIGHT: Palette = {
  dark: false,
  bg: ['#FFF4E0', '#FFD9E8'],
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0F5',
  border: '#2B1B4A',
  text: '#2B1B4A',
  textMuted: '#6E5C8F',
  primary: '#FF4D5E',
  primaryText: '#FFFFFF',
  danger: '#E8283C',
  success: '#1FAA59',
  warning: '#FFB300',
  accent: '#7B5CFF',
  menu: ['#FF4D5E', '#7B5CFF', '#FFB300', '#1FB5A6', '#3D8BFF'],
  decor: ['🔴', '⭐', '✋', '🐔', '💥'],
};

const PLAYFUL_DARK: Palette = {
  dark: true,
  bg: ['#1B1033', '#3A1747'],
  surface: '#2A1C4A',
  surfaceAlt: '#352659',
  border: '#0D0620',
  text: '#FFF4E0',
  textMuted: '#BFAEE0',
  primary: '#FF5C6C',
  primaryText: '#FFFFFF',
  danger: '#FF4D5E',
  success: '#3DDC84',
  warning: '#FFC53D',
  accent: '#A48BFF',
  menu: ['#FF5C6C', '#8B6CFF', '#F5A623', '#1FB5A6', '#4C9AFF'],
  decor: ['🔴', '⭐', '✋', '🐔', '💥'],
};

const darkBase = (o: Partial<Palette> & Pick<Palette, 'bg' | 'surface' | 'surfaceAlt' | 'primary' | 'accent' | 'menu' | 'decor'>): Palette => ({
  dark: true,
  border: '#05030C',
  text: '#FFFFFF',
  textMuted: '#C8C3D9',
  primaryText: '#FFFFFF',
  danger: '#FF4D5E',
  success: '#3DDC84',
  warning: '#FFC53D',
  ...o,
});

export const THEMES: ThemeDef[] = [
  { id: 'playful', name: 'Playful', emoji: '🎈', light: PLAYFUL_LIGHT, dark: PLAYFUL_DARK, unlock: { type: 'free' } },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '🌈',
    light: darkBase({
      bg: ['#090014', '#1A0033'],
      surface: '#16052B',
      surfaceAlt: '#230A40',
      border: '#FF2BD6',
      primary: '#FF2BD6',
      accent: '#00F0FF',
      menu: ['#FF2BD6', '#00F0FF', '#B6FF00', '#FFE600', '#8A5CFF'],
      decor: ['✨', '💜', '⚡', '🔮', '💿'],
    }),
    unlock: { type: 'level', level: 30 },
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    light: darkBase({
      bg: ['#050B24', '#1B2A5C'],
      surface: '#121B42',
      surfaceAlt: '#1C2858',
      primary: '#FF6B3D',
      accent: '#7FD1FF',
      menu: ['#FF6B3D', '#7FD1FF', '#B78CFF', '#FFD23F', '#3DDC97'],
      decor: ['🪐', '⭐', '🚀', '🌙', '☄️'],
    }),
    unlock: { type: 'boss' },
  },
  {
    id: 'underwater',
    name: 'Underwater',
    emoji: '🐠',
    light: darkBase({
      bg: ['#03455E', '#012437'],
      surface: '#0B5873',
      surfaceAlt: '#0F6A88',
      primary: '#FF7F50',
      accent: '#5EF2D6',
      menu: ['#FF7F50', '#5EF2D6', '#FFD166', '#9B8CFF', '#FF6FA8'],
      decor: ['🐠', '🫧', '🐙', '🐚', '🦀'],
    }),
    unlock: { type: 'streak', streak: 20 },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    light: darkBase({
      bg: ['#1A0F24', '#3B1A0B'],
      surface: '#2A1630',
      surfaceAlt: '#38203D',
      primary: '#FF7A00',
      accent: '#9CFF4D',
      menu: ['#FF7A00', '#9B4DFF', '#9CFF4D', '#FF3D5A', '#FFC300'],
      decor: ['🎃', '👻', '🦇', '🕸️', '🍬'],
    }),
    unlock: { type: 'season', months: [9, 10] },
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    light: {
      ...PLAYFUL_LIGHT,
      bg: ['#F4FFF6', '#FFE3E3'],
      primary: '#D62839',
      accent: '#1E7F4F',
      menu: ['#D62839', '#1E7F4F', '#E8A317', '#2F6FDE', '#B5179E'],
      decor: ['🎄', '🎁', '❄️', '⛄', '🔔'],
    },
    unlock: { type: 'season', months: [11, 0] },
  },
  {
    id: 'medieval',
    name: 'Medieval',
    emoji: '🏰',
    light: {
      ...PLAYFUL_LIGHT,
      bg: ['#F3E3C3', '#D9BE8C'],
      surface: '#FFF6E3',
      surfaceAlt: '#F1E1BF',
      border: '#3B2A14',
      text: '#3B2A14',
      textMuted: '#7A6040',
      primary: '#8C1C13',
      accent: '#2E4A7D',
      menu: ['#8C1C13', '#2E4A7D', '#BF8B2E', '#3E6B35', '#5B2C6F'],
      decor: ['🏰', '⚔️', '🛡️', '👑', '🐉'],
    },
    unlock: { type: 'purchase', entitlement: 'theme:medieval' },
  },
];

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isThemeUnlocked(theme: ThemeDef, p: ProgressState, now = new Date()): boolean {
  const u = theme.unlock;
  switch (u.type) {
    case 'free':
      return true;
    case 'level':
      return p.highestLevel >= u.level;
    case 'streak':
      return p.longestStreak >= u.streak;
    case 'boss':
      return p.bossesBeaten > 0;
    case 'season':
      return u.months.includes(now.getMonth()) || hasEntitlement(p.entitlements, `theme:${theme.id}`);
    case 'purchase':
      return hasEntitlement(p.entitlements, u.entitlement);
  }
}

export function unlockHint(theme: ThemeDef): string {
  const u = theme.unlock;
  switch (u.type) {
    case 'free':
      return 'Unlocked';
    case 'level':
      return `Reach level ${u.level}`;
    case 'streak':
      return `Reach a ${u.streak} streak`;
    case 'boss':
      return 'Beat a boss level';
    case 'season':
      return u.months.includes(9) ? 'Available in Oct & Nov' : 'Available in Dec & Jan';
    case 'purchase':
      return 'Premium (coming soon)';
  }
}
