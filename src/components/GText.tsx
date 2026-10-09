import { memo } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { FONTS } from '@/constants/colors';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

const SIZES: Record<Variant, number> = { display: 44, title: 30, heading: 22, body: 16, caption: 13, label: 15 };

export interface GTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
  size?: number;
  /** Heavy outline-like drop shadow for big game titles. */
  outlined?: boolean;
}

/** Themed text. Allows dynamic type, capped so layouts don't explode. */
export const GText = memo(function GText({
  variant = 'body',
  color,
  muted,
  center,
  size,
  outlined,
  style,
  ...rest
}: GTextProps) {
  const { palette, s } = useTheme();
  const fontSize = s(size ?? SIZES[variant]);
  const display = variant === 'display' || variant === 'title' || variant === 'heading';
  const base: TextStyle = {
    fontFamily: display ? FONTS.display : variant === 'label' ? FONTS.bodyHeavy : FONTS.body,
    fontSize,
    lineHeight: Math.round(fontSize * (display ? 1.12 : 1.35)),
    color: color ?? (muted ? palette.textMuted : palette.text),
    textAlign: center ? 'center' : undefined,
  };
  return (
    <Text
      maxFontSizeMultiplier={display ? 1.15 : 1.4}
      style={[base, outlined && styles.outlined, outlined && { textShadowColor: palette.border }, style]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  outlined: {
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
});
