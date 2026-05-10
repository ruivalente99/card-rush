'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';

export function BustOverlay() {
  const { ui, setUI, localGame, dispatchLocal } = useGameStore();

  const handleDismiss = () => {
    if (localGame) {
      const prevIdx = localGame.currentPlayerIndex;
      dispatchLocal({ type: 'NEXT_TURN' });
      const nextState = useGameStore.getState().localGame;
      if (nextState?.phase === 'PLAYING' && nextState.currentPlayerIndex !== prevIdx) {
        setTimeout(() => useGameStore.getState().setUI({ showPassDeviceModal: true }), 300);
      } else if (nextState?.phase === 'ROUND_END' || nextState?.phase === 'GAME_OVER') {
        // NEXT_ROUND/GAME_OVER handled by overlays, no passDevice needed
      }
    }
    setUI({ showBustOverlay: false, bustingPlayerName: null });
  };

  // Online mode: auto-dismiss after 2.5s (server already advanced state)
  useEffect(() => {
    if (!ui.showBustOverlay || localGame) return;
    const t = setTimeout(() => {
      useGameStore.getState().setUI({ showBustOverlay: false, bustingPlayerName: null });
    }, 2500);
    return () => clearTimeout(t);
  }, [ui.showBustOverlay, localGame]);

  if (!ui.showBustOverlay) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 animate-in fade-in duration-150">
      <div className="text-center space-y-5 p-8 rounded-[var(--radius-xl)] bg-card border border-border max-w-sm w-full mx-4 animate-in zoom-in-90 duration-200">
        <div className="text-7xl animate-bounce">💥</div>
        <div>
          <h2 className="text-4xl font-black text-red-500 mb-2 brand-heading">BUST!</h2>
          <p className="text-lg text-foreground/80">
            <span className="font-semibold text-foreground">{ui.bustingPlayerName ?? 'Player'}</span> loses their round score
          </p>
        </div>
        {localGame && (
          <Button
            onClick={handleDismiss}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-base"
          >
            Continue →
          </Button>
        )}
      </div>
    </div>
  );
}
