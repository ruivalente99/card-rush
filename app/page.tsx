'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useGameStore } from '@/store/gameStore';
import { createInitialState } from '@/lib/game/engine';
import { v4 as uuidv4 } from 'uuid';
import type { GameMode } from '@/lib/game/types';

interface PlayerEntry {
  id: string;
  name: string;
}

export default function HomePage() {
  const router = useRouter();
  const { setLocalGame } = useGameStore();
  const [mode, setMode] = useState<'home' | 'local-setup' | 'online-create' | 'online-join'>('home');
  const [players, setPlayers] = useState<PlayerEntry[]>([
    { id: uuidv4(), name: 'Player 1' },
    { id: uuidv4(), name: 'Player 2' },
  ]);
  const [pointTarget, setPointTarget] = useState(200);
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [roomCode, setRoomCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [hostName, setHostName] = useState('');

  const startLocal = () => {
    const validPlayers = players.filter((p) => p.name.trim());
    if (validPlayers.length < 2) return;

    const state = createInitialState({
      pointTarget,
      turnTimerSeconds: 0,
      gameMode,
      players: validPlayers,
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
      body: JSON.stringify({ hostId, hostName: hostName.trim(), pointTarget, gameMode }),
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
      body: JSON.stringify({ playerId, playerName: joinName.trim() }),
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
      <label className="text-slate-400 text-sm">Game mode</label>
      <div className="mt-1 flex gap-2">
        <button
          onClick={() => setGameMode('free')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
            gameMode === 'free'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
          }`}
        >
          Free Play
          <div className="text-xs font-normal opacity-70 mt-0.5">Flip until you stay</div>
        </button>
        <button
          onClick={() => setGameMode('one-per-turn')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
            gameMode === 'one-per-turn'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
          }`}
        >
          One Per Turn
          <div className="text-xs font-normal opacity-70 mt-0.5">One card each round</div>
        </button>
      </div>
    </div>
  );

  if (mode === 'local-setup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setMode('home')} className="text-slate-400 hover:text-white text-sm">
              ← Back
            </button>
            <ThemeSwitcher />
          </div>
          <h1 className="text-3xl font-black text-white">Local Game</h1>
          <div className="space-y-2">
            <label className="text-slate-400 text-sm">Players (2–6)</label>
            {players.map((p, i) => (
              <div key={p.id} className="flex gap-2">
                <input
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  value={p.name}
                  onChange={(e) => {
                    const updated = [...players];
                    updated[i] = { ...p, name: e.target.value };
                    setPlayers(updated);
                  }}
                  placeholder={`Player ${i + 1}`}
                />
                {players.length > 2 && (
                  <button
                    onClick={() => setPlayers(players.filter((_, j) => j !== i))}
                    className="text-slate-500 hover:text-red-400 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {players.length < 6 && (
              <button
                onClick={() =>
                  setPlayers([...players, { id: uuidv4(), name: `Player ${players.length + 1}` }])
                }
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                + Add player
              </button>
            )}
          </div>
          <GameModeSelector />
          <div>
            <label className="text-slate-400 text-sm">Win condition (points)</label>
            <input
              type="number"
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
              value={pointTarget}
              onChange={(e) => setPointTarget(Number(e.target.value))}
              min={50}
              step={50}
            />
          </div>
          <Button
            onClick={startLocal}
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-5 text-lg"
          >
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
          <div className="flex items-center justify-between">
            <button onClick={() => setMode('home')} className="text-slate-400 hover:text-white text-sm">
              ← Back
            </button>
            <ThemeSwitcher />
          </div>
          <h1 className="text-3xl font-black text-white">Create Room</h1>
          <div>
            <label className="text-slate-400 text-sm">Your name</label>
            <input
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <GameModeSelector />
          <div>
            <label className="text-slate-400 text-sm">Win condition (points)</label>
            <input
              type="number"
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
              value={pointTarget}
              onChange={(e) => setPointTarget(Number(e.target.value))}
              min={50}
              step={50}
            />
          </div>
          <Button
            onClick={createOnlineRoom}
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-5 text-lg"
          >
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
          <div className="flex items-center justify-between">
            <button onClick={() => setMode('home')} className="text-slate-400 hover:text-white text-sm">
              ← Back
            </button>
            <ThemeSwitcher />
          </div>
          <h1 className="text-3xl font-black text-white">Join Room</h1>
          <div>
            <label className="text-slate-400 text-sm">Room code</label>
            <input
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white uppercase font-mono tracking-widest text-center text-xl"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Your name</label>
            <input
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button
            onClick={joinOnlineRoom}
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-5 text-lg"
          >
            Join Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-7xl font-black text-white mb-2">
          FLIP<span className="text-indigo-400">7</span>
        </h1>
        <p className="text-slate-400 text-lg">Push your luck. Know when to stop.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={() => setMode('local-setup')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-6 text-lg rounded-xl"
        >
          🎮 Local Game
        </Button>
        <Button
          onClick={() => setMode('online-create')}
          variant="outline"
          className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 font-bold py-6 text-lg rounded-xl"
        >
          🌐 Create Online Room
        </Button>
        <Button
          onClick={() => setMode('online-join')}
          variant="outline"
          className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 font-bold py-6 text-lg rounded-xl"
        >
          🔗 Join Room
        </Button>
      </div>
      <p className="text-slate-600 text-xs text-center max-w-xs">
        Flip cards to score points. Flip a duplicate and lose everything. First to {pointTarget} wins!
      </p>
    </div>
  );
}
