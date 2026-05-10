'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RiskIndicator } from './RiskIndicator';
import type { GameState, GameAction } from '@/lib/game/types';

interface ActionBarProps {
  state: GameState;
  playerId: string;
  onAction: (action: GameAction) => void;
}

export function ActionBar({ state, playerId, onAction }: ActionBarProps) {
  const current = state.players[state.currentPlayerIndex];
  const isMyTurn = current?.id === playerId;
  const rs = current?.roundState;
  const timerSeconds = state.config.turnTimerSeconds ?? 0;

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const didAutoDrawRef = useRef(false);

  useEffect(() => {
    if (!isMyTurn || !rs || rs.busted || rs.stayed || rs.froze || timerSeconds <= 0) {
      setTimeLeft(null);
      didAutoDrawRef.current = false;
      return;
    }
    setTimeLeft(timerSeconds);
    didAutoDrawRef.current = false;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (!didAutoDrawRef.current) {
            didAutoDrawRef.current = true;
            onAction({ type: 'DRAW' });
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, state.currentPlayerIndex, timerSeconds]);

  if (!isMyTurn || !rs) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Waiting for <span className="text-foreground font-medium">{current?.name}</span>…
      </div>
    );
  }

  if (rs.busted || rs.stayed || rs.froze) return null;

  const timerPercent = timerSeconds > 0 && timeLeft !== null ? (timeLeft / timerSeconds) * 100 : null;
  const timerColor = timeLeft !== null && timeLeft <= 5 ? 'bg-red-500' : timeLeft !== null && timeLeft <= 10 ? 'bg-amber-500' : 'bg-primary';

  const isNull = current?.name?.toUpperCase() === 'NULL';

  return (
    <div className="flex flex-col gap-3">
      {isNull && !rs.hyperTrainActive && (
        <Button
          onClick={() => onAction({ type: 'FORCE_HYPERTRAIN' })}
          className="w-full card-hypertrain border-white/30 text-white font-bold py-3 text-sm rounded-[var(--radius-lg)]"
        >
          🌈 Force HyperTrain
        </Button>
      )}
      {timerPercent !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Auto-draw in</span>
            <span className={timeLeft !== null && timeLeft <= 5 ? 'text-red-400 font-bold' : ''}>{timeLeft}s</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      )}
      <RiskIndicator deck={state.deck} hand={rs.hand} />
      <div className="flex gap-3">
        <Button
          onClick={() => onAction({ type: 'DRAW' })}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg rounded-[var(--radius-xl)]"
          disabled={state.deck.length === 0}
        >
          🃏 Draw
        </Button>
        <Button
          onClick={() => onAction({ type: 'STAY' })}
          variant="outline"
          className="flex-1 border-border text-foreground hover:bg-accent font-bold py-6 text-lg rounded-[var(--radius-xl)]"
          disabled={rs.hand.length === 0}
        >
          ✋ Stay
        </Button>
      </div>
    </div>
  );
}
