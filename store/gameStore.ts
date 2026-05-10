'use client';

import { create } from 'zustand';
import type { GameState, GameAction, Card } from '@/lib/game/types';
import { applyAction } from '@/lib/game/engine';

interface Toast {
  id: string;
  msg: string;
}

interface UIState {
  showBustOverlay: boolean;
  showWinOverlay: boolean;
  showPassDeviceModal: boolean;
  pendingCard: Card | null;
  bustingPlayerName: string | null;
  ping: number | null;
  toasts: Toast[];
}

interface GameStore {
  localGame: GameState | null;
  setLocalGame: (state: GameState) => void;
  dispatchLocal: (action: GameAction) => void;
  clearLocalGame: () => void;

  onlineGame: GameState | null;
  lastSeq: number;
  roomCode: string | null;
  playerId: string | null;
  setOnlineGame: (state: GameState) => void;
  setRoomCode: (code: string) => void;
  setPlayerId: (id: string) => void;
  setLastSeq: (seq: number) => void;
  clearOnlineGame: () => void;

  ui: UIState;
  setUI: (partial: Partial<UIState>) => void;
  addToast: (msg: string) => void;
  removeToast: (id: string) => void;
}

const defaultUI: UIState = {
  showBustOverlay: false,
  showWinOverlay: false,
  showPassDeviceModal: false,
  pendingCard: null,
  bustingPlayerName: null,
  ping: null,
  toasts: [],
};

function detectScoreToasts(
  prevPlayers: GameState['players'],
  nextPlayers: GameState['players']
): string[] {
  const msgs: string[] = [];
  for (const p of nextPlayers) {
    const prev = prevPlayers.find((pp) => pp.id === p.id);
    if (!prev) continue;
    const justStayed = p.roundState.stayed && !prev.roundState.stayed;
    const justFroze = p.roundState.froze && !prev.roundState.froze;
    if (justStayed || justFroze) {
      const verb = justFroze ? 'frozen' : 'stayed';
      msgs.push(`${p.name} ${verb} · +${p.roundState.roundScore} pts`);
    }
  }
  return msgs;
}

export const useGameStore = create<GameStore>((set, get) => ({
  localGame: null,
  setLocalGame: (state) => set({ localGame: state }),
  dispatchLocal: (action) => {
    const prev = get().localGame;
    if (!prev) return;

    const prevBusted = new Set(
      prev.players.filter((p) => p.roundState.busted).map((p) => p.id)
    );

    const next = applyAction(prev, action);

    const newlyBusted = next.players.find(
      (p) => p.roundState.busted && !prevBusted.has(p.id)
    );

    const scoreToasts = detectScoreToasts(prev.players, next.players);

    const uiUpdates: Partial<UIState> = {};
    if (newlyBusted) {
      uiUpdates.showBustOverlay = true;
      uiUpdates.bustingPlayerName = newlyBusted.name;
    }
    if (next.phase === 'GAME_OVER') {
      uiUpdates.showWinOverlay = true;
    }

    set({ localGame: next, ui: { ...get().ui, ...uiUpdates } });
    scoreToasts.forEach((msg) => get().addToast(msg));
  },
  clearLocalGame: () => set({ localGame: null }),

  onlineGame: null,
  lastSeq: 0,
  roomCode: null,
  playerId: null,
  setOnlineGame: (newState) => {
    const prev = get().onlineGame;
    if (prev) {
      const msgs = detectScoreToasts(prev.players, newState.players);
      msgs.forEach((msg) => get().addToast(msg));
    }
    set({ onlineGame: newState });
  },
  setRoomCode: (code) => {
    set({ roomCode: code });
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('cardrush:roomCode', code);
  },
  setPlayerId: (id) => {
    set({ playerId: id });
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('cardrush:playerId', id);
  },
  setLastSeq: (seq) => set({ lastSeq: seq }),
  clearOnlineGame: () => {
    set({ onlineGame: null, lastSeq: 0, roomCode: null, playerId: null });
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('cardrush:roomCode');
      sessionStorage.removeItem('cardrush:playerId');
    }
  },

  ui: defaultUI,
  setUI: (partial) => set((s) => ({ ui: { ...s.ui, ...partial } })),
  addToast: (msg) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ ui: { ...s.ui, toasts: [...s.ui.toasts, { id, msg }] } }));
    setTimeout(() => get().removeToast(id), 2500);
  },
  removeToast: (id) =>
    set((s) => ({
      ui: { ...s.ui, toasts: s.ui.toasts.filter((t) => t.id !== id) },
    })),
}));
