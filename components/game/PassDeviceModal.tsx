'use client';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

export function PassDeviceModal() {
  const { ui, setUI, localGame } = useGameStore();

  if (!ui.showPassDeviceModal || !localGame) return null;

  const current = localGame.players[localGame.currentPlayerIndex];
  const configPlayer = localGame.config.players.find(p => p.id === current?.id);
  const emoji = configPlayer?.emoji ?? '🎴';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="text-center space-y-6 p-10 rounded-[var(--radius-xl)] bg-card border border-border max-w-xs w-full mx-4 animate-in zoom-in-75 duration-300">
        <div className="text-8xl leading-none">{emoji}</div>
        <div>
          <p className="text-foreground text-2xl font-bold">{current?.name}</p>
        </div>
        <Button
          onClick={() => setUI({ showPassDeviceModal: false })}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-xl"
        >
          Jogar
        </Button>
      </div>
    </div>
  );
}
