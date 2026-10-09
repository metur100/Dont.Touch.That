/**
 * Ad abstraction. The MVP ships with a mock; a real SDK (e.g. Google Mobile Ads) can implement the
 * same interface later without touching game code. Ads are never shown during active gameplay.
 */

export type RewardedReason = 'revive' | 'bonusScore' | 'extraPractice' | 'doubleRewards';

export interface AdService {
  readonly isMock: boolean;
  /** Resolves true if the player earned the reward. */
  showRewarded(reason: RewardedReason): Promise<boolean>;
  showInterstitial(): Promise<void>;
}

/** Mock: rewards are granted instantly-ish so the flow can be tested end-to-end. */
class MockAdService implements AdService {
  readonly isMock = true;

  async showRewarded(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return true;
  }

  async showInterstitial(): Promise<void> {
    // No-op in the MVP.
  }
}

/** Decides WHEN an interstitial may be shown: only between games, at most every N game-overs. */
export class InterstitialPolicy {
  private gamesSinceLast = 0;

  constructor(private readonly every = 4) {}

  shouldShow(hasRemoveAds: boolean): boolean {
    if (hasRemoveAds) return false;
    this.gamesSinceLast++;
    if (this.gamesSinceLast >= this.every) {
      this.gamesSinceLast = 0;
      return true;
    }
    return false;
  }
}

export const ads: AdService = new MockAdService();
export const interstitialPolicy = new InterstitialPolicy();
