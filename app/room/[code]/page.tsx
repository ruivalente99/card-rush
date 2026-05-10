'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useRoomSync } from '@/hooks/useRoomSync';
import { PlayerHand } from '@/components/game/PlayerHand';
import { DeckCounter } from '@/components/game/DeckCounter';
import { Scoreboard } from '@/components/game/Scoreboard';
import { ActionBar } from '@/components/game/ActionBar';
import { BustOverlay } from '@/components/game/BustOverlay';
import { WinOverlay } from '@/components/game/WinOverlay';
import { RoundEndOverlay } from '@/components/game/RoundEndOverlay';
import { GameHeader } from '@/components/ui/game-header';
import { usePlayerStore, deduplicateEmojis } from '@/store/playerStore';
import { useMemo } from 'react';
import type { GameAction } from '@/lib/game/types';

export default function OnlineGamePage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { onlineGame, playerId, setOnlineGame, setUI, ui } = useGameStore();

  useRoomSync(code);

  useEffect(() => {
    if (onlineGame?.phase === 'GAME_OVER') {
      setUI({ showWinOverlay: true });
    } else if (onlineGame?.phase === 'PLAYING') {
      setUI({ showWinOverlay: false });
    }
  }, [onlineGame?.phase]);

  const handleAction = async (action: GameAction) => {
    const res = await fetch(`/api/room/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, action }),
    });
    if (res.ok) {
      const data = await res.json();
      setOnlineGame(data.state);
    }
  };

  const emojiMap = useMemo(
    () => deduplicateEmojis(onlineGame?.config.players ?? [], playerId ?? ''),
    [onlineGame?.config.players, playerId]
  );

  if (!onlineGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Connecting…</div>
      </div>
    );
  }

  const state = onlineGame;
  const isHost = state.config.players[0]?.id === playerId;
  const cardSize = state.players.length > 3 ? 'sm' : 'md';

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full">
      <GameHeader
        left={
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground text-sm">
            ← Leave
          </button>
        }
        meta={`${code} · Round ${state.round}`}
        ping={ui.ping}
      />

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-3 md:flex-1 md:min-w-0 overflow-y-auto">
          <DeckCounter deck={state.deck} discardPile={state.discardPile} />
          <div className="space-y-2">
            {state.players.map((player, i) => (
              <PlayerHand
                key={player.id}
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
          {playerId && state.phase === 'PLAYING' && (
            <div className="hidden md:block">
              <ActionBar
                state={state}
                playerId={playerId}
                onAction={handleAction}
              />
            </div>
          )}
        </div>
      </div>

      {playerId && state.phase === 'PLAYING' && (
        <div className="md:hidden sticky bottom-0 z-10 py-3 bg-background/95 backdrop-blur-sm border-t border-border -mx-4 px-4">
          <ActionBar
            state={state}
            playerId={playerId}
            onAction={handleAction}
          />
        </div>
      )}

      <RoundEndOverlay
        state={state}
        isHost={isHost}
        onBeginRound={() => handleAction({ type: 'BEGIN_ROUND' })}
      />
      <BustOverlay />
      <WinOverlay />
    </div>
  );
}
