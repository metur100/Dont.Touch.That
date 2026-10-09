/** First launch: "Welcome." → "Whatever you do..." → "DON'T TOUCH THAT." → straight into level 1. */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { Screen } from '@/components/Screen';
import { MESSAGES } from '@/data/messages';
import { useShake } from '@/hooks/animations';
import { feedback } from '@/services/feedback';
import { useProgress } from '@/store/progressStore';
import { useTheme } from '@/theme/ThemeProvider';

const STEPS = [
  { text: 'Welcome.', at: 300 },
  { text: 'Whatever you do...', at: 1700 },
  { text: "DON'T TOUCH THAT.", at: 3600 },
];
const FINISH_AT = 5200;

export function IntroScreen() {
  const { palette } = useTheme();
  const markIntroSeen = useProgress((st) => st.markIntroSeen);
  const [step, setStep] = useState(-1);
  const [heckle, setHeckle] = useState<{ text: string; n: number } | null>(null);
  const taps = useRef(0);
  const shake = useShake(16);

  useEffect(() => {
    const timers = STEPS.map((s, i) =>
      setTimeout(() => {
        setStep(i);
        if (i === STEPS.length - 1) {
          feedback.levelStart(true);
          shake.trigger(1);
        } else {
          feedback.whoosh();
        }
      }, s.at),
    );
    timers.push(
      setTimeout(() => {
        markIntroSeen();
        router.replace({ pathname: '/play', params: { mode: 'classic', start: '0' } });
      }, FINISH_AT),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTap = () => {
    feedback.tap();
    setHeckle({ text: MESSAGES.introTap[taps.current % MESSAGES.introTap.length], n: taps.current });
    taps.current += 1;
  };

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Screen>
      <Pressable style={styles.fill} onPress={onTap} accessibilityLabel="Intro" accessibilityHint="Just watch">
        <View style={styles.center}>
          {current ? (
            <Animated.View key={step} entering={last ? ZoomIn.springify().damping(8) : FadeIn.duration(500)} exiting={FadeOut.duration(250)}>
              <Animated.View style={last ? shake.style : undefined}>
              <GText
                variant={last ? 'display' : 'title'}
                size={last ? 52 : 34}
                outlined={last}
                center
                color={last ? palette.primary : palette.text}
                accessibilityLiveRegion="assertive"
              >
                {current.text}
              </GText>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>
        <View style={styles.heckle}>
          {heckle ? (
            <Animated.View key={heckle.n} entering={FadeIn.duration(150)}>
              <GText muted center>{heckle.text}</GText>
            </Animated.View>
          ) : null}
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  heckle: { height: 60, alignItems: 'center', justifyContent: 'center' },
});
