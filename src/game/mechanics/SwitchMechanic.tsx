/**
 * "EVERYTHING IS WRONG." The instruction changes while you play. Pressing is only allowed during
 * phases that say so. The button itself never gives it away — read the instruction.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GText } from '@/components/GText';
import { usePulse, useShake } from '@/hooks/animations';
import { feedback } from '@/services/feedback';

import type { SwitchConfig } from '../types';
import { Blob } from './Blob';
import type { MechanicProps } from './types';

export function SwitchMechanic({ config, area, api }: MechanicProps<SwitchConfig>) {
  const size = Math.min(area.width, area.height) * 0.58;
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const pulse = usePulse(true, 0.06);
  const shake = useShake(8);

  useEffect(() => {
    let elapsed = 0;
    const first = config.phases[0];
    api.setInstruction(first.instruction, first.hint);
    const timers = config.phases.slice(1).map((p, i) => {
      elapsed += config.phases[i].ms;
      return setTimeout(() => {
        phaseRef.current = i + 1;
        setPhase(i + 1);
        api.setInstruction(p.instruction, p.hint);
        feedback.whoosh();
        shake.trigger(0.5);
      }, elapsed);
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.phases]);

  const onPressIn = () => {
    if (api.isDone()) return;
    const p = config.phases[phaseRef.current];
    if (p.allow) api.succeed('You read it right. Rare.');
    else api.fail(phaseRef.current === 0 ? 'It said DON\'T. At first, anyway.' : 'Wrong moment. Read the instruction!');
  };

  return (
    <View style={styles.center}>
      <Pressable onPressIn={onPressIn} accessibilityRole="button" accessibilityLabel={config.label} accessibilityHint="Only press when the instruction allows it">
        <Animated.View style={[pulse, shake.style]}>
          <Blob size={size} color={config.color ?? 'red'} label={config.label} />
        </Animated.View>
      </Pressable>
      <GText muted size={13} center style={styles.caption}>
        instruction {phase + 1}/{config.phases.length} — read carefully
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  caption: { marginTop: 14 },
});
