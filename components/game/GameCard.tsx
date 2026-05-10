'use client';

import { cn } from '@/lib/utils';
import type { Card } from '@/lib/game/types';

interface GameCardProps {
  card: Card;
  faceDown?: boolean;
  className?: string;
  animate?: boolean;
  size?: 'sm' | 'md';
}

const SPECIAL_LABELS: Record<string, { label: string; color: string }> = {
  freeze:        { label: '❄️', color: 'bg-sky-500 text-white border-sky-400/60' },
  second_chance: { label: '🔄', color: 'bg-amber-500 text-white border-amber-400/60' },
  x2:            { label: '×2', color: 'bg-violet-600 text-white border-violet-400/60' },
  plus3:         { label: '+3', color: 'bg-emerald-600 text-white border-emerald-400/60' },
};

function numberColor(value: number): string {
  if (value <= 3)  return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (value <= 6)  return 'bg-amber-100 text-amber-800 border-amber-300';
  if (value <= 9)  return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function isBonusCard(card: Card): boolean {
  return card.type === 'x2' || card.type === 'plus3' || card.type === 'hypertrain' || card.type === 'freeze';
}

export function GameCard({ card, faceDown, className, animate, size = 'md' }: GameCardProps) {
  const dims = size === 'sm'
    ? 'w-10 h-14 text-sm rounded-[var(--radius-md)]'
    : 'w-16 h-24 text-xl rounded-[var(--radius-lg)]';

  const isBonus = isBonusCard(card);
  const animClass = animate
    ? isBonus
      ? 'card-bonus-enter'
      : 'animate-in fade-in zoom-in-75 duration-300'
    : '';

  const base = cn(
    'relative border-2 flex items-center justify-center select-none font-bold shadow-md',
    dims,
    animClass,
    className
  );

  if (faceDown) {
    return (
      <div className={cn(base, 'bg-primary/80 border-primary/40')}>
        <span className={size === 'sm' ? 'text-xl' : 'text-3xl'}>🃏</span>
      </div>
    );
  }

  if (card.type === 'hypertrain') {
    return (
      <div className={cn(base, 'card-hypertrain border-white/40')}>
        <span className={size === 'sm' ? 'text-base' : 'text-2xl'}>🌈</span>
      </div>
    );
  }

  if (card.type === 'number') {
    return (
      <div className={cn(base, 'border', numberColor(card.value ?? 0))}>
        <span>{card.value}</span>
      </div>
    );
  }

  const { label, color } = SPECIAL_LABELS[card.type] ?? { label: '?', color: 'bg-gray-500 text-white border-gray-400/60' };
  return (
    <div className={cn(base, color, 'border-2')}>
      <span className={size === 'sm' ? 'text-base' : 'text-2xl'}>{label}</span>
    </div>
  );
}
