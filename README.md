# Don't Touch That!

A funny reaction/puzzle game for iOS and Android: the game tells you what **not** to do, and then
does everything it can to make you do it.

Built with Expo SDK 57, React Native 0.86, TypeScript, Expo Router, Reanimated 4, Gesture Handler,
expo-audio, expo-haptics, expo-sensors and AsyncStorage. Fully offline, no backend, no accounts.

## Run it

```bash
npm install
npm start            # Metro dev server (needs a development build, see below)
npm run android      # build + install a dev build on an emulator/device (expo run:android)
npm run ios          # macOS only (expo run:ios)
```

All native modules come from the Expo SDK, so `npm start` + Expo Go (SDK 57) should work for quick
iteration. A development build (`npm run android` / `npm run ios`, or `eas build --profile development`)
is the production-like way to run it and is what was verified.

Quality checks:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (expo config, React Compiler rules)
npm test             # jest (62 tests: levels, scoring, streaks, daily seed, generators, storage)
npm run verify       # all three
```

Assets are generated, so they can be regenerated or swapped for produced assets with the same names:

```bash
npm run generate:sounds   # assets/sounds/*.wav (SFX + music loop, synthesized)
npm run generate:icons    # assets/icon.png, adaptive icon layers, splash, favicon
```

## Game

| Mode | Rules |
| --- | --- |
| **Classic** | 100 hand-made levels in 10 chapters. 3 lives; a failed level is retried. Runs start at a chapter. |
| **Endless** | Procedurally generated; difficulty rises every 5 levels; SPECIAL round every 10, BOSS round every 25. |
| **Daily** | 10 levels generated from the date (`YYYY-MM-DD` seed) — identical for everyone. One official attempt (consumed on start), unlimited practice. |

Scoring: level points (100 + 10 × difficulty) · **+50** fast bonus on action levels · **+25 per streak step** (capped at +250).
Streak milestones at x10 / x20 / x50. Boss and special levels chain several stages.

## Architecture

```
src/
  app/                   Expo Router routes (thin wrappers around screens)
  screens/               Menu, Intro, Game, Chapters, Daily, Stats, Achievements, Settings, About
  components/            UI kit (GameButton, GText, Screen, HUD, ParticleBurst, AchievementToast)
    game/                LevelRunner (runs one stage), ResultOverlay, EndPanel
  game/
    types/               LevelDefinition, LevelStage, MechanicConfig (discriminated union)
    levels/              factories.ts (createXLevel helpers) + 100 classic levels as data
    mechanics/           12 reusable mechanic components + pure logic.ts + gesture hook
    generators/          seeded RNG, level templates, endless + daily generation
    engine/              runReducer (lives/streak/score state machine), scoring, modes, validation
  services/              storage, audio, haptics, feedback, ads (mock), purchases (stub)
  store/                 zustand progress store (persisted, debounced, achievement unlocking)
  data/                  humor messages, achievements, studio info
  theme/                 themes (7, unlockable), ThemeProvider (light/dark, responsive scale)
  hooks/                 reusable Reanimated animations
```

**Adding a level** is one entry in a level file:

```ts
choiceLevel({
  instruction: "DON'T TOUCH THE GHOSTS.",
  hint: 'Grab all the candy 🍬',
  items: things([['🍬', 'pink', false], ['👻', 'gray', true], ['🍬', 'green', false]]),
  mode: 'clearSafe',
  difficulty: 5,
});
```

**Adding a mechanic**: add a config type to `MechanicConfig`, a sanitizer branch in
`engine/validation.ts`, a component in `game/mechanics/`, and a case in `mechanics/index.tsx`.

Levels are sanitized on load (`sanitizeLevel`) so malformed data degrades to a playable fallback
instead of crashing. Every audio/haptic/storage call is fail-safe.

## Monetization hooks (not active)

- `services/ads/AdService.ts` — `AdService` interface (`showRewarded`, `showInterstitial`) with a mock;
  used for **revive** on the game-over screen. `InterstitialPolicy` only allows interstitials between
  games (every 4th), never during play, and never with the `remove_ads` entitlement.
- `services/purchases/PurchaseService.ts` — product catalog + `PurchaseService` interface (RevenueCat-ready);
  entitlements live in persisted progress and unlock themes (`theme:medieval`, `theme:*`).

## Store release

Everything for Google Play and App Store Connect (texts, form answers, screenshots, graphics, privacy policy,
build + signing steps) is in [`store/`](store/README.md).
