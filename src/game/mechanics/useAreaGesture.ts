import { useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

export interface ReleaseInfo {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  durationMs: number;
}

export interface AreaHandlers {
  onDown?: (x: number, y: number) => void;
  onMove?: (x: number, y: number, dx: number, dy: number) => void;
  onUp?: (x: number, y: number, info: ReleaseInfo) => void;
}

/**
 * A single-finger pan that reports down/move/up on the JS thread, for mechanics that need raw
 * finger tracking (swipes, drags, chasers). Handlers can change every render without rebuilding
 * the gesture.
 */
export function useAreaGesture(handlers: AreaHandlers) {
  /* eslint-disable react-hooks/refs, react-hooks/purity, react-hooks/immutability --
     The closures below are gesture callbacks invoked on touch events, never during render;
     building them inside useMemo is the pattern recommended by react-native-gesture-handler. */
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  return useMemo(() => {
    let downAt = 0;
    return Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .maxPointers(1)
      .onBegin((e) => {
        downAt = Date.now();
        ref.current.onDown?.(e.x, e.y);
      })
      .onUpdate((e) => {
        ref.current.onMove?.(e.x, e.y, e.translationX, e.translationY);
      })
      .onFinalize((e) => {
        ref.current.onUp?.(e.x, e.y, {
          dx: e.translationX,
          dy: e.translationY,
          vx: e.velocityX,
          vy: e.velocityY,
          durationMs: Date.now() - downAt,
        });
      });
  }, []);
  /* eslint-enable react-hooks/refs, react-hooks/purity, react-hooks/immutability */
}
