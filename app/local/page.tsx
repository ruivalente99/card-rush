'use client';

import { useEffect, useRef } from 'react';
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
import { GameHeader } from '@/components/ui/game-header';
import { Button } from '@/components/ui/button';
import type { GameAction } from '@/lib/game/types';

export default function LocalGamePage() {
  const router = useRouter();
  const { state, dispatch } = useGameEngine();
  const { setUI } = useGameStore();
  const playerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!state) router.replace('/');
  }, [state]);

  // Scroll active player into view on mobile
  useEffect(() => {
    if (!state || state.phase !== 'PLAYING') return;
    const ref = playerRefs.current[state.currentPlayerIndex];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state?.currentPlayerIndex]);

  if (!state) return null;

  const handleStartGame = () => dispatch({ type: 'START_GAME' });
  const currentPlayer = state.players[state.currentPlayerIndex];

  const handleAction = (action: GameAction) => {
    const prevPlayer = state.players[state.currentPlayerIndex];
    dispatch(action);

    const nextState = useGameStore.getState().localGame;
    if (!nextState) return;

    const nextPlayer = nextState.players[nextState.currentPlayerIndex];
    const playerChanged = nextState.phase === 'PLAYING' && prevPlayer?.id !== nextPlayer?.id;

    if (playerChanged && !useGameStore.getState().ui.showBustOverlay) {
      setTimeout(() => setUI({ showPassDeviceModal: true }), 200);
    }
    // Bust case: BustOverlay.handleDismiss dispatches NEXT_TURN and shows PassDeviceModal
  };

  const cardSize = state.players.length > 3 ? 'sm' : 'md';
  const emojiMap = Object.fromEntries(
    state.config.players.map(p => [p.id, p.emoji ?? '🎴'])
  );

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full">
      <GameHeader
        left={
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground text-sm">
            ← Menu
          </button>
        }
        meta={`Round ${state.round}`}
      />

      {state.phase === 'LOBBY' && (
        <div className="flex-1 flex items-center justify-center">
          <Button
            onClick={handleStartGame}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-[var(--radius-xl)]"
          >
            Start Game
          </Button>
        </div>
      )}

      {(state.phase === 'PLAYING' || state.phase === 'ROUND_END') && (
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-3 md:flex-1 md:min-w-0 overflow-y-auto">
            <DeckCounter deck={state.deck} discardPile={state.discardPile} />
            <div className="space-y-2">
              {state.players.map((player, i) => (
                <PlayerHand
                  key={player.id}
                  ref={(el) => { playerRefs.current[i] = el; }}
                  player={player}
                  isActive={i === state.currentPlayerIndex}
                  deck={state.deck}
                  size={cardSize}
                  emoji={emojiMap[player.id]}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:w-72 md:shrink-0">
            <Scoreboard
              players={state.players}
              config={state.config}
              round={state.round}
              currentPlayerIndex={state.currentPlayerIndex}
            />
            {state.phase === 'PLAYING' && currentPlayer && (
              <div className="hidden md:block">
                <ActionBar
                  state={state}
                  playerId={currentPlayer.id}
                  onAction={handleAction}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {state.phase === 'PLAYING' && currentPlayer && (
        <div className="md:hidden sticky bottom-0 z-10 py-3 bg-background/95 backdrop-blur-sm border-t border-border -mx-4 px-4">
          <ActionBar
            state={state}
            playerId={currentPlayer.id}
            onAction={handleAction}
          />
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
