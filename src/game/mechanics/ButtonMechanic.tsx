/**
 * One extremely tempting button. Variants: pulsing, wobbling, moving, teleporting, running away,
 * growing — and "skins" that disguise it as a fake success screen, a fake ad, or a fake update.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { FONTS, GAME_COLORS } from '@/constants/colors';
import { usePulse, useWobble } from '@/hooks/animations';
import { useTheme } from '@/theme/ThemeProvider';

import type { ButtonConfig, Rect } from '../types';
import { Blob } from './Blob';
import { distance, pointInRect, randomPointAwayFrom } from './logic';
import type { MechanicProps } from './types';
import { useAreaGesture } from './useAreaGesture';

type CardSkin = 'fakeSuccess' | 'fakeAd' | 'fakeUpdate';
const isCardSkin = (skin: ButtonConfig['skin']): skin is CardSkin =>
  skin === 'fakeSuccess' || skin === 'fakeAd' || skin === 'fakeUpdate';

export function ButtonMechanic(props: MechanicProps<ButtonConfig>) {
  return isCardSkin(props.config.skin) ? <CardButton {...props} skin={props.config.skin} /> : <RoundButton {...props} />;
}

// ---------- Round button (default, gift, cookie, eye) ----------

function RoundButton({ config, area, api, stage }: MechanicProps<ButtonConfig>) {
  const { palette } = useTheme();
  const motion = config.motion ?? 'pulse';
  const radius = (Math.min(area.width, area.height) * (config.size ?? 0.5)) / 2;
  const speed = (config.speed ?? 1) * Math.min(area.width, area.height) * 0.45;

  const bx = useSharedValue(area.width / 2);
  const by = useSharedValue(area.height / 2);
  const vx = useSharedValue(speed * 0.8);
  const vy = useSharedValue(speed * 0.6);
  const scale = useSharedValue(motion === 'grow' ? 0.65 : 1);
  const fingerX = useSharedValue(-1000);
  const fingerY = useSharedValue(-1000);
  const fingerDown = useSharedValue(false);

  const [tauntIndex, setTauntIndex] = useState(0);
  const [override, setOverride] = useState<string | null>(null);
  const taunts = config.taunts?.length ? config.taunts : [config.label];

  useEffect(() => {
    if (taunts.length < 2) return;
    const id = setInterval(() => setTauntIndex((i) => (i + 1) % taunts.length), 1100);
    return () => clearInterval(id);
  }, [taunts.length]);

  useEffect(() => {
    if (motion === 'grow') {
      scale.set(withTiming(1.45, { duration: stage.timeLimit, easing: Easing.in(Easing.quad) }));
    }
    if (motion !== 'teleport') return;
    const id = setInterval(() => {
      const p = randomPointAwayFrom(area, radius + 6, { x: bx.value, y: by.value }, radius * 2);
      bx.set(withSpring(p.x, { damping: 14, stiffness: 220 }));
      by.set(withSpring(p.y, { damping: 14, stiffness: 220 }));
    }, 950 / (config.speed ?? 1));
    return () => clearInterval(id);
  }, [motion, area, radius, config.speed, stage.timeLimit, bx, by, scale]);

  // Physics for moving / fleeing buttons, on the UI thread.
  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    if (motion === 'move') {
      let x = bx.value + vx.value * dt;
      let y = by.value + vy.value * dt;
      if (x < radius || x > area.width - radius) {
        vx.set(-vx.value);
        x = Math.min(area.width - radius, Math.max(radius, x));
      }
      if (y < radius || y > area.height - radius) {
        vy.set(-vy.value);
        y = Math.min(area.height - radius, Math.max(radius, y));
      }
      bx.set(x);
      by.set(y);
    } else if (motion === 'runAway' && fingerDown.value) {
      const dx = bx.value - fingerX.value;
      const dy = by.value - fingerY.value;
      const d = Math.max(1, Math.hypot(dx, dy));
      if (d < radius * 2.6) {
        const push = (speed * 2.4 * dt * (radius * 2.6 - d)) / (radius * 2.6) + speed * 0.6 * dt;
        bx.set(Math.min(area.width - radius, Math.max(radius, bx.value + (dx / d) * push)));
        by.set(Math.min(area.height - radius, Math.max(radius, by.value + (dy / d) * push)));
      }
    }
  }, motion === 'move' || motion === 'runAway');

  const flee = (x: number, y: number) => {
    const p = randomPointAwayFrom(area, radius + 6, { x, y }, radius * 3);
    bx.set(withSpring(p.x, { damping: 12, stiffness: 400 }));
    by.set(withSpring(p.y, { damping: 12, stiffness: 400 }));
    setOverride('nope!');
    setTimeout(() => setOverride(null), 600);
  };

  const gesture = useAreaGesture({
    onDown: (x, y) => {
      fingerX.set(x);
      fingerY.set(y);
      fingerDown.set(true);
      const d = distance({ x, y }, { x: bx.value, y: by.value });
      const r = radius * scale.value;
      if (d <= r) {
        // Running buttons dodge sloppy taps; only a dead-center hit catches them.
        if (motion === 'runAway' && d > r * 0.5) {
          api.touch({ x, y });
          flee(x, y);
          return;
        }
        api.fail(undefined, { x, y });
        return;
      }
      if (config.backgroundForbidden) {
        api.fail('You touched the screen. That counts.', { x, y });
        return;
      }
      api.touch({ x, y });
    },
    onMove: (x, y) => {
      fingerX.set(x);
      fingerY.set(y);
      if (motion === 'runAway' && !api.isDone()) {
        if (distance({ x, y }, { x: bx.value, y: by.value }) < radius * scale.value * 0.5) api.fail(undefined, { x, y });
      }
    },
    onUp: () => {
      fingerDown.set(false);
    },
  });

  const posStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bx.value - radius }, { translateY: by.value - radius }, { scale: scale.value }],
  }));
  const pulse = usePulse(motion === 'pulse' || motion === 'grow', 0.07);
  const wobble = useWobble(motion === 'wobble', 8);

  const label = override ?? taunts[tauntIndex];
  const skin = config.skin ?? 'round';
  const color = config.color ?? 'red';

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={`Button labeled ${label}`} accessibilityHint="Touching it probably fails the level">
        <Animated.View style={[styles.abs, { width: radius * 2, height: radius * 2 }, posStyle]}>
          <Animated.View style={[styles.center, motion === 'wobble' ? wobble : pulse]}>
            {skin === 'gift' || skin === 'cookie' ? (
              <View style={styles.center}>
                <Text allowFontScaling={false} style={{ fontSize: radius * 1.3 }}>{config.emoji ?? (skin === 'gift' ? '🎁' : '🍪')}</Text>
                <View style={[styles.pill, { backgroundColor: GAME_COLORS[color].fill, borderColor: palette.border }]}>
                  <Text allowFontScaling={false} style={[styles.pillText, { color: GAME_COLORS[color].text }]}>{label}</Text>
                </View>
              </View>
            ) : skin === 'eye' ? (
              <View style={styles.center}>
                <Blob size={radius * 2} color={color} emoji="👀" />
                <View style={[styles.bubble, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <GText variant="label" size={15}>{label}</GText>
                </View>
              </View>
            ) : (
              <Blob size={radius * 2} color={color} label={label} />
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// ---------- Card skins: fake success, fake ad, fake update ----------

function CardButton({ config, area, api, skin }: MechanicProps<ButtonConfig> & { skin: CardSkin }) {
  const { palette, s } = useTheme();
  const cardW = Math.min(area.width * 0.88, 340);
  const cardH = Math.min(area.height * 0.82, s(330));
  const cardX = (area.width - cardW) / 2;
  const cardY = (area.height - cardH) / 2;
  const btnH = s(54);
  const [adSeconds, setAdSeconds] = useState(4);
  const pulse = usePulse(true, 0.05);

  useEffect(() => {
    if (skin !== 'fakeAd') return;
    const id = setInterval(() => setAdSeconds((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [skin]);

  // Hit rects in play-area coordinates.
  const rects = useMemo(() => {
    const forbidden: Rect =
      skin === 'fakeAd'
        ? { x: cardX + cardW - s(126), y: cardY + s(10), w: s(116), h: s(36) }
        : skin === 'fakeUpdate'
          ? { x: cardX + cardW / 2 + 6, y: cardY + cardH - btnH - s(18), w: cardW / 2 - s(22), h: btnH }
          : { x: cardX + s(24), y: cardY + cardH - btnH - s(22), w: cardW - s(48), h: btnH };
    const safe: Rect | null =
      skin === 'fakeUpdate' ? { x: cardX + s(16), y: cardY + cardH - btnH - s(18), w: cardW / 2 - s(22), h: btnH } : null;
    return { forbidden, safe };
  }, [skin, cardX, cardY, cardW, cardH, btnH, s]);

  const gesture = useAreaGesture({
    onDown: (x, y) => {
      const p = { x, y };
      // Generous 8px slop around the forbidden button: near-misses count.
      const f = rects.forbidden;
      if (pointInRect(p, { x: f.x - 8, y: f.y - 8, w: f.w + 16, h: f.h + 16 })) {
        api.fail(undefined, p);
        return;
      }
      if (rects.safe && pointInRect(p, rects.safe)) {
        api.succeed('Good. Nobody likes updates.', p);
        return;
      }
      if (config.backgroundForbidden) {
        api.fail('You touched it. ANYTHING counts.', p);
        return;
      }
      api.touch(p);
    },
  });

  const forbiddenColor = GAME_COLORS[config.color ?? (skin === 'fakeSuccess' ? 'green' : 'blue')];
  const btn = (r: Rect, text: string, bg: string, fg: string) => (
    <View style={[styles.rectBtn, { left: r.x - cardX, top: r.y - cardY, width: r.w, height: r.h, backgroundColor: bg, borderColor: palette.border }]}>
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[styles.rectBtnText, { color: fg }]}>{text}</Text>
    </View>
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[styles.card, { left: cardX, top: cardY, width: cardW, height: cardH, backgroundColor: palette.surface, borderColor: palette.border }, skin === 'fakeSuccess' ? pulse : null]}
          accessible
          accessibilityLabel={skin === 'fakeAd' ? 'An advertisement with a skip button' : skin === 'fakeUpdate' ? 'An update dialog' : 'A level complete screen'}
        >
          {skin === 'fakeSuccess' ? (
            <View style={styles.cardBody}>
              <Text allowFontScaling={false} style={{ fontSize: s(56) }}>🎉</Text>
              <GText variant="title" size={28} center>LEVEL COMPLETE!</GText>
              <Text allowFontScaling={false} style={{ fontSize: s(30), marginTop: 6 }}>⭐⭐⭐</Text>
              <GText muted center size={14}>+500 bonus · totally real</GText>
            </View>
          ) : skin === 'fakeAd' ? (
            <View style={styles.cardBody}>
              <View style={[styles.adTag, { borderColor: palette.textMuted }]}>
                <GText size={11} muted>AD · {adSeconds}s</GText>
              </View>
              <Text allowFontScaling={false} style={{ fontSize: s(64) }}>🍔</Text>
              <GText variant="title" size={26} center>BURGER KINGDOM</GText>
              <GText muted center>Eat like royalty. Or don&apos;t. Up to you.</GText>
            </View>
          ) : (
            <View style={styles.cardBody}>
              <Text allowFontScaling={false} style={{ fontSize: s(52) }}>⬇️</Text>
              <GText variant="heading" size={24} center>Update available</GText>
              <GText muted center>Version 9.9.9 adds 400 new buttons and removes your free will.</GText>
            </View>
          )}
          {btn(rects.forbidden, config.label, skin === 'fakeAd' ? 'rgba(0,0,0,0.65)' : forbiddenColor.fill, skin === 'fakeAd' ? '#FFFFFF' : forbiddenColor.text)}
          {rects.safe ? btn(rects.safe, 'LATER', palette.surfaceAlt, palette.text) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  pill: { marginTop: -8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 3 },
  pillText: { fontFamily: FONTS.display, fontSize: 18 },
  bubble: { position: 'absolute', bottom: -34, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 2 },
  card: { position: 'absolute', borderRadius: 26, borderWidth: 4, overflow: 'hidden' },
  cardBody: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 34, paddingHorizontal: 18, gap: 4 },
  adTag: { position: 'absolute', top: 14, left: 14, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6 },
  rectBtn: { position: 'absolute', borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  rectBtnText: { fontFamily: FONTS.display, fontSize: 20 },
});
