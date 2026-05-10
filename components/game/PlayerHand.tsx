'use client';

import { GameCard } from './GameCard';
import { Badge } from '@/components/ui/badge';
import type { Player } from '@/lib/game/types';
import { bustProbability, countUniqueNumbers, calculateRoundScore } from '@/lib/game/scoring';
import type { Card } from '@/lib/game/types';

interface PlayerHandProps {
  player: Player;
  isActive: boolean;
  deck: Card[];
  size?: 'sm' | 'md';
  emoji?: string;
}

export function PlayerHand({ player, isActive, deck, size = 'md', emoji }: PlayerHandProps) {
  const rs = player.roundState;
  const uniqueNums = countUniqueNumbers(rs.hand);
  const bustProb = bustProbability(deck, rs.hand);
  const bustPct = Math.round(bustProb * 100);
  const liveScore = rs.busted ? 0 : calculateRoundScore(rs.hand, rs.isFlip7);

  return (
    <div
      className={`rounded-[var(--radius-lg)] p-3 border-2 transition-all ${
        isActive
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15'
          : 'border-border bg-card/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {emoji && <span className="text-base leading-none">{emoji}</span>}
          <span className="font-semibold text-foreground text-sm">{player.name}</span>
          {isActive && (
            <Badge className="bg-primary text-primary-foreground text-xs animate-pulse px-1.5">Turn</Badge>
          )}
          {rs.busted && <Badge variant="destructive" className="text-xs px-1.5">Bust!</Badge>}
          {rs.stayed && <Badge className="bg-emerald-700 text-white text-xs px-1.5">Stayed</Badge>}
          {rs.froze && <Badge className="bg-primary/70 text-primary-foreground text-xs px-1.5">Frozen</Badge>}
          {rs.isFlip7 && (
            <Badge className="bg-yellow-500 text-black text-xs font-bold px-1.5">FLIP 7! 🎉</Badge>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-muted-foreground text-xs">Round</div>
          <div className={`font-bold text-sm ${rs.busted ? 'text-red-400 line-through' : 'text-foreground'}`}>
            {liveScore}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-8">
        {rs.hand.map((card) => (
          <GameCard key={card.id} card={card} size={size} animate />
        ))}
        {rs.hand.length === 0 && (
          <span className="text-muted-foreground text-sm italic">No cards yet</span>
        )}
      </div>

      {isActive && rs.hand.length > 0 && !rs.busted && !rs.stayed && !rs.froze && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{uniqueNums}/7</span>
          <span>·</span>
          <span className={
            bustPct >= 50 ? 'text-red-400 font-semibold' :
            bustPct >= 25 ? 'text-orange-400' :
            'text-emerald-500'
          }>
            {bustPct}% bust
          </span>
          {rs.secondChances > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-400">🔄 ×{rs.secondChances}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
