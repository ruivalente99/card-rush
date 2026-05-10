'use client';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';

export function WinOverlay() {
  const { ui, setUI, localGame, onlineGame, clearLocalGame, playerId, roomCode } = useGameStore();
  const router = useRouter();

  const game = localGame ?? onlineGame;
  const isOnline = !!onlineGame && !localGame;
  const isHost = isOnline ? game?.config.players[0]?.id === playerId : true;

  if (!ui.showWinOverlay || !game) return null;

  const winner = game.players.find((p) => p.id === game.winner);

  const handlePlayAgain = async () => {
    if (isOnline) {
      if (!isHost) return;
      setUI({ showWinOverlay: false });
      await fetch(`/api/room/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: { type: 'RESTART_GAME' } }),
      });
    } else {
      try {
        const raw = localStorage.getItem('flip7:stats');
        const stats = raw ? JSON.parse(raw) : { wins: 0, losses: 0, highScore: 0 };
        stats.highScore = Math.max(stats.highScore, winner?.totalScore ?? 0);
        localStorage.setItem('flip7:stats', JSON.stringify(stats));
      } catch {}
      setUI({ showWinOverlay: false });
      clearLocalGame();
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-300">
      <div className="text-center space-y-6 p-8 rounded-[var(--radius-xl)] bg-card border border-border max-w-sm w-full mx-4 animate-in zoom-in-75 duration-500">
        <div className="text-7xl">🏆</div>
        <div>
          <h2 className="text-4xl font-black text-yellow-400 mb-1">Game Over!</h2>
          <p className="text-xl text-foreground">
            <span className="font-bold text-yellow-300">{winner?.name ?? 'Unknown'}</span> wins!
          </p>
          <p className="text-muted-foreground mt-1 text-lg">{winner?.totalScore} points</p>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          {[...game.players]
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((p, i) => (
              <div key={p.id} className="flex justify-between">
                <span>{i + 1}. {p.name}</span>
                <span className="font-bold text-foreground">{p.totalScore}</span>
              </div>
            ))}
        </div>
        {isOnline && !isHost ? (
          <p className="text-muted-foreground text-sm">Waiting for host to restart…</p>
        ) : (
          <Button
            onClick={handlePlayAgain}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-5"
          >
            {isOnline ? '🔄 Play Again' : '← Back to Menu'}
          </Button>
        )}
      </div>
    </div>
  );
}
