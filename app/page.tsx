'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GameHeader } from '@/components/ui/game-header';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore, EMOJIS, randomEmoji, nextEmoji } from '@/store/playerStore';
import { createInitialState } from '@/lib/game/engine';
import { v4 as uuidv4 } from 'uuid';
import type { GameMode } from '@/lib/game/types';

interface PlayerEntry {
  id: string;
  name: string;
}

function initPlayerEmojis(players: PlayerEntry[]): Record<string, string> {
  const used: string[] = [];
  const result: Record<string, string> = {};
  for (const p of players) {
    const e = randomEmoji(used);
    used.push(e);
    result[p.id] = e;
  }
  return result;
}

export default function HomePage() {
  const router = useRouter();
  const { setLocalGame } = useGameStore();
  const { name: savedName, emoji: myEmoji } = usePlayerStore();

  const [mode, setMode] = useState<'home' | 'local-setup' | 'online-create' | 'online-join'>('home');

  const initialPlayersRef = useRef<PlayerEntry[]>([
    { id: uuidv4(), name: savedName },
    { id: uuidv4(), name: 'Player 2' },
  ]);
  const [players, setPlayers] = useState<PlayerEntry[]>(() => initialPlayersRef.current);
  const [playerEmojis, setPlayerEmojis] = useState<Record<string, string>>(
    () => initPlayerEmojis(initialPlayersRef.current)
  );
  const [pointTarget, setPointTarget] = useState(200);
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [roomCode, setRoomCode] = useState('');
  const [joinName, setJoinName] = useState(savedName);
  const [hostName, setHostName] = useState(savedName);

  const cycleEmoji = useCallback((playerId: string) => {
    setPlayerEmojis(prev => {
      const used = Object.entries(prev)
        .filter(([id]) => id !== playerId)
        .map(([, e]) => e);
      return { ...prev, [playerId]: nextEmoji(prev[playerId] ?? EMOJIS[0], used) };
    });
  }, []);

  const addPlayer = () => {
    const newId = uuidv4();
    const used = Object.values(playerEmojis);
    setPlayers(prev => [...prev, { id: newId, name: `Player ${prev.length + 1}` }]);
    setPlayerEmojis(prev => ({ ...prev, [newId]: randomEmoji(used) }));
  };

  const removePlayer = (idx: number) => {
    setPlayers(prev => {
      const next = prev.filter((_, j) => j !== idx);
      setPlayerEmojis(old => {
        const copy = { ...old };
        delete copy[prev[idx].id];
        return copy;
      });
      return next;
    });
  };

  const startLocal = () => {
    const validPlayers = players.filter((p) => p.name.trim());
    if (validPlayers.length < 2) return;
    const state = createInitialState({
      pointTarget,
      turnTimerSeconds: 0,
      gameMode,
      players: validPlayers.map(p => ({ ...p, emoji: playerEmojis[p.id] })),
    });
    setLocalGame(state);
    router.push('/local');
  };

  const createOnlineRoom = async () => {
    if (!hostName.trim()) return;
    const hostId = uuidv4();
    const res = await fetch('/api/room/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId, hostName: hostName.trim(), hostEmoji: myEmoji, pointTarget, gameMode }),
    });
    const data = await res.json();
    if (data.code) {
      const store = useGameStore.getState();
      store.setRoomCode(data.code);
      store.setPlayerId(hostId);
      router.push(`/room/${data.code}/lobby`);
    }
  };

  const joinOnlineRoom = async () => {
    if (!roomCode.trim() || !joinName.trim()) return;
    const playerId = uuidv4();
    const res = await fetch(`/api/room/${roomCode.trim().toUpperCase()}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, playerName: joinName.trim(), playerEmoji: myEmoji }),
    });
    if (res.ok) {
      const store = useGameStore.getState();
      store.setRoomCode(roomCode.trim().toUpperCase());
      store.setPlayerId(playerId);
      router.push(`/room/${roomCode.trim().toUpperCase()}/lobby`);
    }
  };

  const GameModeSelector = () => (
    <div>
      <label className="text-muted-foreground text-sm">Game mode</label>
      <div className="mt-1 flex gap-2">
        {([['free', 'Free Play', 'Flip until you stay'], ['one-per-turn', 'One Per Turn', 'One card each round']] as const).map(([val, title, sub]) => (
          <button
            key={val}
            onClick={() => setGameMode(val)}
            className={`flex-1 py-2 px-3 rounded-[var(--radius-md)] text-sm font-medium border transition-all text-left ${
              gameMode === val
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-muted border-border text-foreground hover:bg-accent'
            }`}
          >
            {title}
            <div className="text-xs font-normal opacity-70 mt-0.5">{sub}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (mode === 'local-setup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <GameHeader left={
            <button onClick={() => setMode('home')} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          } />
          <h1 className="text-3xl font-black text-foreground brand-heading">Local Game</h1>
          <div className="space-y-2">
            <label className="text-muted-foreground text-sm">Players (2–6)</label>
            {players.map((p, i) => (
              <div key={p.id} className="flex gap-2 items-center">
                <button
                  onClick={() => cycleEmoji(p.id)}
                  title="Click to change emoji"
                  className="w-9 h-9 text-xl flex items-center justify-center rounded-[var(--radius-md)] bg-muted hover:bg-accent transition-colors shrink-0"
                >
                  {playerEmojis[p.id]}
                </button>
                <input
                  className="game-input flex-1"
                  value={p.name}
                  onChange={(e) => {
                    const updated = [...players];
                    updated[i] = { ...p, name: e.target.value };
                    setPlayers(updated);
                  }}
                  placeholder={`Player ${i + 1}`}
                />
                {players.length > 2 && (
                  <button onClick={() => removePlayer(i)} className="text-muted-foreground hover:text-destructive px-2">✕</button>
                )}
              </div>
            ))}
            {players.length < 6 && (
              <button onClick={addPlayer} className="text-primary hover:text-primary/80 text-sm">+ Add player</button>
            )}
          </div>
          <GameModeSelector />
          <div>
            <label className="text-muted-foreground text-sm">Win condition (points)</label>
            <input type="number" className="game-input mt-1" value={pointTarget} onChange={(e) => setPointTarget(Number(e.target.value))} min={50} step={50} />
          </div>
          <Button onClick={startLocal} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-lg">
            Start Game
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'online-create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <GameHeader left={
            <button onClick={() => setMode('home')} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          } />
          <h1 className="text-3xl font-black text-foreground brand-heading">Create Room</h1>
          <div>
            <label className="text-muted-foreground text-sm">Your name</label>
            <div className="flex gap-2 mt-1">
              <div className="w-10 h-10 text-xl flex items-center justify-center bg-muted rounded-[var(--radius-md)] shrink-0">{myEmoji}</div>
              <input className="game-input flex-1" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Your name" />
            </div>
            <p className="text-muted-foreground text-xs mt-1">Change your icon in ⚙ settings</p>
          </div>
          <GameModeSelector />
          <div>
            <label className="text-muted-foreground text-sm">Win condition (points)</label>
            <input type="number" className="game-input mt-1" value={pointTarget} onChange={(e) => setPointTarget(Number(e.target.value))} min={50} step={50} />
          </div>
          <Button onClick={createOnlineRoom} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-lg">
            Create Room
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'online-join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <GameHeader left={
            <button onClick={() => setMode('home')} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          } />
          <h1 className="text-3xl font-black text-foreground brand-heading">Join Room</h1>
          <div>
            <label className="text-muted-foreground text-sm">Room code</label>
            <input className="game-input mt-1 uppercase font-mono tracking-widest text-center text-xl" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
          </div>
          <div>
            <label className="text-muted-foreground text-sm">Your name</label>
            <div className="flex gap-2 mt-1">
              <div className="w-10 h-10 text-xl flex items-center justify-center bg-muted rounded-[var(--radius-md)] shrink-0">{myEmoji}</div>
              <input className="game-input flex-1" value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Your name" />
            </div>
          </div>
          <Button onClick={joinOnlineRoom} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-lg">
            Join Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <GameHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-7xl font-black text-foreground mb-2 brand-heading">
            FLIP<span className="text-primary">7</span>
          </h1>
          <p className="text-muted-foreground text-lg">Push your luck. Know when to stop.</p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <Button onClick={() => setMode('local-setup')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg rounded-[var(--radius-xl)]">
            🎮 Local Game
          </Button>
          <Button onClick={() => setMode('online-create')} variant="outline" className="w-full border-border text-foreground hover:bg-accent font-bold py-6 text-lg rounded-[var(--radius-xl)]">
            🌐 Create Online Room
          </Button>
          <Button onClick={() => setMode('online-join')} variant="outline" className="w-full border-border text-foreground hover:bg-accent font-bold py-6 text-lg rounded-[var(--radius-xl)]">
            🔗 Join Room
          </Button>
        </div>
        <p className="text-muted-foreground text-xs text-center max-w-xs">
          Flip cards to score points. Flip a duplicate and lose everything. First to {pointTarget} wins!
        </p>
      </div>
    </div>
  );
}
