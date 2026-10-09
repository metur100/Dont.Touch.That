/**
 * Creator info + cross-promotion slots. Add other Medin Turkes games here once they are live;
 * the About screen renders whatever is listed.
 */
export const STUDIO: { name: string; tagline: string; website?: string; privacyUrl?: string } = {
  name: 'Medin Turkes',
  tagline: 'Small games. Big feelings. Occasional buttons.',
  // TODO before release: set the website and hosted privacy policy URL (links stay hidden until set).
  website: undefined,
  privacyUrl: undefined,
};

export interface OtherGame {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** Store URL; undefined = "coming soon". */
  url?: string;
}

export const OTHER_GAMES: OtherGame[] = [
  { id: 'coming-soon', title: 'More games coming soon', emoji: '🎮', description: "Working on it. Don't touch anything until then." },
];
