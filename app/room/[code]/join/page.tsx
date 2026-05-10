'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore, EMOJIS } from '@/store/playerStore';
import { Button } from '@/components/ui/button';
import { GameHeader } from '@/components/ui/game-header';
import { v4 as uuidv4 } from 'uuid';

export default function JoinPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { setPlayerId, setRoomCode } = useGameStore();
  const { name: savedName, emoji: savedEmoji, setName: saveName, setEmoji: saveEmoji } = usePlayerStore();

  const [name, setName] = useState(savedName || '');
  const [emoji, setEmoji] = useState(savedEmoji || EMOJIS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const join = async () => {
    if (!name.trim()) { setError('Enter your name'); return; }
    setLoading(true);
    setError('');

    const id = uuidv4();
    const res = await fetch(`/api/room/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: id, playerName: name.trim(), playerEmoji: emoji }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to join');
      setLoading(false);
      return;
    }

    saveName(name.trim());
    saveEmoji(emoji);
    setPlayerId(id);
    setRoomCode(code);

    sessionStorage.setItem('flip7:playerId', id);
    sessionStorage.setItem('flip7:roomCode', code);

    router.push(`/room/${code}/lobby`);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto gap-6">
      <GameHeader
        left={
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground text-sm">
            ← Back
          </button>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground mb-1 brand-heading">Join Room</h1>
          <div className="bg-card rounded-[var(--radius-lg)] px-6 py-2 inline-block border border-border mt-2">
            <span className="text-primary font-mono text-2xl font-bold tracking-widest brand-heading">{code}</span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Pick your emoji</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-1.5 rounded-lg transition-all ${
                    emoji === e ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'hover:bg-card'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Your name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && join()}
              placeholder="Enter name…"
              maxLength={20}
              className="game-input w-full text-lg"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button
            onClick={join}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-lg"
          >
            {loading ? 'Joining…' : `${emoji} Join Game`}
          </Button>
        </div>
      </div>
    </div>
  );
}
