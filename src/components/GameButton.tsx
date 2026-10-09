import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { feedback } from '@/services/feedback';
import { useTheme } from '@/theme/ThemeProvider';

import { GText } from './GText';

export interface GameButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  emoji?: string;
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Right-aligned secondary text (e.g. a score). */
  trailing?: string;
}

const DEPTH = 6;

/** Chunky "3D" game button that squishes when pressed. */
export const GameButton = memo(function GameButton({
  label,
  onPress,
  color,
  textColor,
  emoji,
  size = 'md',
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
  trailing,
}: GameButtonProps) {
  const { palette, s } = useTheme();
  const press = useSharedValue(0);
  const bg = color ?? palette.primary;
  const height = s(size === 'lg' ? 68 : size === 'md' ? 56 : 44);

  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * (DEPTH - 1) }] }));

  const onPressIn = useCallback(() => {
    press.set(withTiming(1, { duration: 60 }));
  }, [press]);
  const onPressOut = useCallback(() => {
    press.set(withSpring(0, { damping: 10, stiffness: 300 }));
  }, [press]);
  const handlePress = useCallback(() => {
    feedback.button();
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[{ height: height + DEPTH, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={[styles.base, { height, top: DEPTH, backgroundColor: palette.border, borderRadius: height / 2.4 }]} />
      <Animated.View
        style={[
          styles.face,
          { height, backgroundColor: bg, borderColor: palette.border, borderRadius: height / 2.4, paddingHorizontal: s(18) },
          faceStyle,
        ]}
      >
        <View style={styles.shine} />
        {emoji ? <GText size={size === 'sm' ? 18 : 24} style={styles.emoji}>{emoji}</GText> : null}
        <GText variant="heading" size={size === 'lg' ? 26 : size === 'md' ? 21 : 16} color={textColor ?? palette.primaryText} outlined style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </GText>
        {trailing ? (
          <GText variant="label" size={14} color={textColor ?? palette.primaryText} style={styles.trailing}>
            {trailing}
          </GText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: { position: 'absolute', left: 0, right: 0 },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 4,
    left: 14,
    right: 14,
    height: '32%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  emoji: { marginRight: 10 },
  label: { flexShrink: 1 },
  trailing: { marginLeft: 'auto', opacity: 0.9 },
});
