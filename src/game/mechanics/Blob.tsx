import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONTS, GAME_COLORS } from '@/constants/colors';
import type { ColorName } from '../types';

interface BlobProps {
  size: number;
  color: ColorName;
  label?: string;
  emoji?: string;
  /** Text color override (e.g. Stroop words). */
  labelColor?: string;
  /** Show the color name under the content (color-blind support). */
  colorLabel?: boolean;
  hidden?: boolean;
}

/** Glossy round "candy" object: the basic visual of everything touchable. */
export const Blob = memo(function Blob({ size, color, label, emoji, labelColor, colorLabel, hidden }: BlobProps) {
  const c = hidden ? GAME_COLORS.gray : GAME_COLORS[color];
  const depth = Math.max(4, size * 0.07);
  const content = hidden ? '?' : emoji ?? label;
  const fontSize = emoji ? size * 0.5 : Math.min(size * 0.34, (size * 1.5) / Math.max(1, (label ?? '').length));
  return (
    <View style={{ width: size, height: size + depth }}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.dark, top: depth }]} />
      <View style={[styles.circle, styles.face, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.fill }]}>
        <View style={[styles.shine, { width: size * 0.5, height: size * 0.22, borderRadius: size, top: size * 0.1, left: size * 0.16 }]} />
        {content ? (
          <Text
            allowFontScaling={false}
            style={{
              fontSize,
              fontFamily: emoji ? undefined : FONTS.display,
              color: labelColor ?? c.text,
              textAlign: 'center',
            }}
          >
            {content}
          </Text>
        ) : null}
        {colorLabel && !hidden && !emoji && !label ? (
          <Text allowFontScaling={false} style={[styles.colorName, { fontSize: Math.max(10, size * 0.16), color: c.text }]}>
            {c.name}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  circle: { position: 'absolute', left: 0 },
  face: { top: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(0,0,0,0.25)', overflow: 'hidden' },
  shine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.35)' },
  colorName: { fontFamily: FONTS.bodyHeavy },
});
