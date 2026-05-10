import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const EMOJIS = [
  '🦊','🐺','🦁','🐯','🐻','🐼','🐨','🦝','🦔','🐸',
  '🦉','🦅','🦜','🐉','🦄','🦋','🐙','🦑','🦀','🐬',
  '🌵','🌴','🍄','🌊','⚡','🌙','🔥','💎','🎭','🎯',
];

export function randomEmoji(exclude: string[] = []): string {
  const pool = EMOJIS.filter(e => !exclude.includes(e));
  const src = pool.length > 0 ? pool : EMOJIS;
  return src[Math.floor(Math.random() * src.length)];
}

/** Next emoji in pool that isn't in `used`, cycling from `current` */
export function nextEmoji(current: string, used: string[]): string {
  const idx = EMOJIS.indexOf(current);
  for (let i = 1; i <= EMOJIS.length; i++) {
    const e = EMOJIS[(idx + i) % EMOJIS.length];
    if (!used.includes(e)) return e;
  }
  return EMOJIS[(idx + 1) % EMOJIS.length]; // fallback (>30 players — impossible)
}

/** Resolve emoji conflicts for a player list.
 *  Each player keeps their emoji; if two share one, the later-indexed one
 *  gets the next available emoji (deterministic, stable). */
export function deduplicateEmojis(
  players: { id: string; emoji?: string }[],
  myId: string
): Record<string, string> {
  const result: Record<string, string> = {};
  const used: string[] = [];

  for (const p of players) {
    const want = p.emoji ?? randomEmoji(used);
    if (used.includes(want)) {
      const alt = EMOJIS.find(e => !used.includes(e)) ?? want;
      result[p.id] = alt;
      used.push(alt);
    } else {
      result[p.id] = want;
      used.push(want);
    }
  }

  return result;
}

interface PlayerStore {
  name: string;
  emoji: string;
  setName: (name: string) => void;
  setEmoji: (emoji: string) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      name: 'Player 1',
      emoji: randomEmoji(),
      setName: (name) => set({ name }),
      setEmoji: (emoji) => set({ emoji }),
    }),
    { name: 'flip7:player' }
  )
);
