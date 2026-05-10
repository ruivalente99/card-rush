'use client';

import { useGameStore } from '@/store/gameStore';

export function Toaster() {
  const toasts = useGameStore((s) => s.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-card/95 border border-border rounded-[var(--radius-lg)] px-4 py-2.5 text-sm text-foreground shadow-lg backdrop-blur-sm animate-in slide-in-from-left-4 duration-200"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
