'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GameHeader } from '@/components/ui/game-header';
import { Button } from '@/components/ui/button';

export default function LobbyPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { playerId, addToast } = useGameStore();
  const [players, setPlayers] = useState<{ id: string; name: string; emoji?: string }[]>([]);
  const [isHost, setIsHost] = useState(false);

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${code}/join`
    : `/room/${code}/join`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => addToast('🔗 Link copied!'));
  };

  useEffect(() => {
    const poll = async () => {
      const res = await fetch(`/api/room/${code}/state`);
      if (!res.ok) return;
      const data = await res.json();
      setPlayers(data.state.config.players);
      setIsHost(data.state.config.players[0]?.id === playerId);
      if (data.phase !== 'LOBBY') {
        router.push(`/room/${code}`);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [code, playerId]);

  const startGame = async () => {
    await fetch(`/api/room/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, action: { type: 'START_GAME' } }),
    });
    router.push(`/room/${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto gap-6">
      <GameHeader
        left={
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground text-sm">
            ← Leave
          </button>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground mb-1 brand-heading">Room Lobby</h1>
          <div className="bg-card rounded-[var(--radius-lg)] px-6 py-3 inline-block border border-border mt-2">
            <span className="text-primary font-mono text-3xl font-bold tracking-widest brand-heading">
              {code}
            </span>
          </div>
          <button
            onClick={copyLink}
            className="w-full mt-3 py-2 px-3 rounded-[var(--radius-md)] border border-border bg-card hover:bg-accent active:scale-[0.98] transition-all text-muted-foreground hover:text-foreground text-sm text-left truncate"
          >
            🔗 {inviteLink.replace('https://', '')}
          </button>
        </div>

        <div className="w-full bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-muted-foreground text-sm">
              Players ({players.length}/6)
            </span>
          </div>
          <ul className="divide-y divide-border">
            {players.map((p, i) => (
              <li key={p.id} className="px-4 py-3 flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                {p.emoji && <span className="text-base leading-none">{p.emoji}</span>}
                <span className="text-foreground">{p.name}</span>
                {i === 0 && (
                  <span className="ml-auto text-xs text-primary font-medium">Host</span>
                )}
                {p.id === playerId && i !== 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">(you)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <div className="w-full space-y-2">
            {players.length < 2 && (
              <p className="text-center text-muted-foreground text-sm">Need at least 2 players…</p>
            )}
            <Button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-lg disabled:opacity-50"
            >
              Start Game
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Waiting for host to start…</p>
        )}
      </div>
    </div>
  );
}
