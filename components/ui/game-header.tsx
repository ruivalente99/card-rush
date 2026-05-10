'use client';

import { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { SettingsModal } from './settings-modal';

interface GameHeaderProps {
  left?: React.ReactNode;
  meta?: string;
  ping?: number | null;
}

export function GameHeader({ left, meta, ping }: GameHeaderProps) {
  const [open, setOpen] = useState(false);
  const { name, emoji } = usePlayerStore();

  return (
    <>
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {left}
          {meta && <span className="text-muted-foreground text-sm font-mono">{meta}</span>}
          {ping != null && (
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              ping < 100 ? 'text-emerald-500' : ping < 300 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {ping}ms
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] bg-card border border-border hover:bg-accent transition-colors text-sm"
          title="Settings"
        >
          <span className="text-base">{emoji}</span>
          <span className="text-foreground font-medium hidden sm:block max-w-24 truncate">{name}</span>
          <span className="text-muted-foreground text-xs">⚙</span>
        </button>
      </div>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
