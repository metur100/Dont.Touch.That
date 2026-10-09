import type { ColorName } from '@/game/types';

/** In-game object colors: fixed across themes so "red" always means red. */
export const GAME_COLORS: Record<ColorName, { fill: string; dark: string; text: string; name: string }> = {
  red: { fill: '#FF3B4E', dark: '#B3122A', text: '#FFFFFF', name: 'RED' },
  blue: { fill: '#2F80FF', dark: '#1550B8', text: '#FFFFFF', name: 'BLUE' },
  green: { fill: '#22C55E', dark: '#127A3A', text: '#FFFFFF', name: 'GREEN' },
  yellow: { fill: '#FFD233', dark: '#B8900A', text: '#2B1B4A', name: 'YELLOW' },
  purple: { fill: '#9B5CFF', dark: '#5E2DB8', text: '#FFFFFF', name: 'PURPLE' },
  orange: { fill: '#FF8A1F', dark: '#B85600', text: '#FFFFFF', name: 'ORANGE' },
  pink: { fill: '#FF6FB5', dark: '#B83279', text: '#FFFFFF', name: 'PINK' },
  gray: { fill: '#8E8AA3', dark: '#55516A', text: '#FFFFFF', name: 'GRAY' },
};

export const FONTS = {
  display: 'LilitaOne_400Regular',
  body: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_900Black',
} as const;
