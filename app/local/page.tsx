'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useGameEngine } from '@/hooks/useGameEngine';
import { PlayerHand } from '@/components/game/PlayerHand';
import { DeckCounter } from '@/components/game/DeckCounter';
import { Scoreboard } from '@/components/game/Scoreboard';
import { ActionBar } from '@/components/game/ActionBar';
import { BustOverlay } from '@/components/game/BustOverlay';
import { WinOverlay } from '@/components/game/WinOverlay';
import { PassDeviceModal } from '@/components/game/PassDeviceModal';
import { RoundEndOverlay } from '@/components/game/RoundEndOverlay';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Button } from '@/components/ui/button';
import type { GameAction } from '@/lib/game/types';

export default function LocalGamePage() {
  const router = useRouter();
  const { state, dispatch } = useGameEngine();
  const { setUI } = useGameStore();

  useEffect(() => {
    if (!state) {
      router.replace('/');
    }
  }, [state]);

  if (!state) return null;

  const handleStartGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const currentPlayer = state.players[state.currentPlayerIndex];

  const handleAction = (action: GameAction) => {
    const prevIdx = state.currentPlayerIndex;
    dispatch(action);

    const nextState = useGameStore.getState().localGame;
    if (!nextState) return;

    const nextIdx = nextState.currentPlayerIndex;
    const prevPlayer = state.players[prevIdx];
    const nextPlayer = nextState.players[nextIdx];

    if (
      nextState.phase === 'PLAYING' &&
      nextPlayer &&
      prevPlayer?.id !== nextPlayer.id
    ) {
      const bustVisible = useGameStore.getState().ui.showBustOverlay;
      if (bustVisible) {
        setTimeout(() => setUI({ showPassDeviceModal: true }), 2100);
      } else {
        setTimeout(() => setUI({ showPassDeviceModal: true }), 200);
      }
    }
  };

  const cardSize = state.players.length > 3 ? 'sm' : 'md';

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm">
          ← Menu
        </button>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm">Round {state.round}</span>
          <ThemeSwitcher />
        </div>
      </div>

      {state.phase === 'LOBBY' && (
        <div className="flex-1 flex items-center justify-center">
          <Button
            onClick={handleStartGame}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold py-6 px-12 text-xl rounded-xl"
          >
            Start Game
          </Button>
        </div>
      )}

      {(state.phase === 'PLAYING' || state.phase === 'ROUND_END') && (
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          {/* Left: deck + player hands */}
          <div className="flex flex-col gap-3 md:flex-1 md:min-w-0">
            <DeckCounter deck={state.deck} discardPile={state.discardPile} />
            <div className="space-y-2">
              {state.players.map((player, i) => (
                <PlayerHand
                  key={player.id}
                  player={player}
                  isActive={i === state.currentPlayerIndex}
                  deck={state.deck}
                  size={cardSize}
                />
              ))}
            </div>
          </div>

          {/* Right: scoreboard + action bar */}
          <div className="flex flex-col gap-3 md:w-72 md:shrink-0">
            <Scoreboard
              players={state.players}
              config={state.config}
              round={state.round}
              currentPlayerIndex={state.currentPlayerIndex}
            />
            {state.phase === 'PLAYING' && currentPlayer && (
              <ActionBar
                state={state}
                playerId={currentPlayer.id}
                onAction={handleAction}
              />
            )}
          </div>
        </div>
      )}

      <RoundEndOverlay
        state={state}
        isHost
        onBeginRound={() => dispatch({ type: 'BEGIN_ROUND' })}
      />
      <BustOverlay />
      <WinOverlay />
      <PassDeviceModal />
    </div>
  );
}
