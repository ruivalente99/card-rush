'use client';

import { GameCard } from './GameCard';
import { Badge } from '@/components/ui/badge';
import type { Player } from '@/lib/game/types';
import { bustProbability, countUniqueNumbers } from '@/lib/game/scoring';
import type { Card } from '@/lib/game/types';

interface PlayerHandProps {
  player: Player;
  isActive: boolean;
  deck: Card[];
  size?: 'sm' | 'md';
}

export function PlayerHand({ player, isActive, deck, size = 'md' }: PlayerHandProps) {
  const rs = player.roundState;
  const uniqueNums = countUniqueNumbers(rs.hand);
  const bustProb = bustProbability(deck, rs.hand);
  const bustPct = Math.round(bustProb * 100);

  return (
    <div
      className={`rounded-2xl p-3 border-2 transition-all ${
        isActive
          ? 'border-indigo-500 bg-indigo-950/50 shadow-lg shadow-indigo-500/20'
          : 'border-slate-700 bg-slate-900/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-white text-sm">{player.name}</span>
          {isActive && (
            <Badge className="bg-indigo-600 text-white text-xs animate-pulse">Turn</Badge>
          )}
          {rs.busted && <Badge variant="destructive" className="text-xs">Bust!</Badge>}
          {rs.stayed && <Badge className="bg-green-700 text-white text-xs">Stayed</Badge>}
          {rs.froze && <Badge className="bg-blue-700 text-white text-xs">Frozen</Badge>}
          {rs.isFlip7 && (
            <Badge className="bg-yellow-500 text-black text-xs font-bold">FLIP 7! 🎉</Badge>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-xs">Round</div>
          <div className="text-white font-bold text-sm">{rs.roundScore}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-8">
        {rs.hand.map((card) => (
          <GameCard key={card.id} card={card} size={size} animate />
        ))}
        {rs.hand.length === 0 && (
          <span className="text-slate-600 text-sm italic">No cards yet</span>
        )}
      </div>

      {isActive && rs.hand.length > 0 && !rs.busted && !rs.stayed && !rs.froze && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span>{uniqueNums}/7 unique</span>
          <span>·</span>
          <span
            className={
              bustPct >= 50 ? 'text-red-400' : bustPct >= 25 ? 'text-yellow-400' : 'text-green-400'
            }
          >
            {bustPct}% bust risk
          </span>
          {rs.secondChances > 0 && (
            <>
              <span>·</span>
              <span className="text-yellow-400">🔄 ×{rs.secondChances}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
