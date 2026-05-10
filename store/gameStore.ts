'use client';

import { create } from 'zustand';
import type { GameState, GameAction, Card } from '@/lib/game/types';
import { applyAction } from '@/lib/game/engine';

interface UIState {
  showBustOverlay: boolean;
  showWinOverlay: boolean;
  showPassDeviceModal: boolean;
  pendingCard: Card | null;
  bustingPlayerName: string | null;
  ping: number | null;
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
}

const defaultUI: UIState = {
  showBustOverlay: false,
  showWinOverlay: false,
  showPassDeviceModal: false,
  pendingCard: null,
  bustingPlayerName: null,
  ping: null,
};

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

    const uiUpdates: Partial<UIState> = {};
    if (newlyBusted) {
      uiUpdates.showBustOverlay = true;
      uiUpdates.bustingPlayerName = newlyBusted.name;
    }
    if (next.phase === 'GAME_OVER') {
      uiUpdates.showWinOverlay = true;
    }

    set({ localGame: next, ui: { ...get().ui, ...uiUpdates } });
  },
  clearLocalGame: () => set({ localGame: null }),

  onlineGame: null,
  lastSeq: 0,
  roomCode: null,
  playerId: null,
  setOnlineGame: (state) => set({ onlineGame: state }),
  setRoomCode: (code) => {
    set({ roomCode: code });
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('flip7:roomCode', code);
  },
  setPlayerId: (id) => {
    set({ playerId: id });
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('flip7:playerId', id);
  },
  setLastSeq: (seq) => set({ lastSeq: seq }),
  clearOnlineGame: () => {
    set({ onlineGame: null, lastSeq: 0, roomCode: null, playerId: null });
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('flip7:roomCode');
      sessionStorage.removeItem('flip7:playerId');
    }
  },

  ui: defaultUI,
  setUI: (partial) => set((s) => ({ ui: { ...s.ui, ...partial } })),
}));
