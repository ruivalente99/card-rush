'use client';

import { useState } from 'react';
import { usePlayerStore, EMOJIS } from '@/store/playerStore';
import { useThemeStore, type Theme } from '@/store/themeStore';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEMES: { value: Theme; label: string; title: string }[] = [
  { value: 'dark',   label: '🌙', title: 'Dark' },
  { value: 'light',  label: '☀️', title: 'Light' },
  { value: 'retro',  label: '📼', title: 'Retro' },
  { value: 'neon',   label: '⚡', title: 'Neon' },
  { value: 'sunset', label: '🌅', title: 'Sunset' },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { name, emoji, setName, setEmoji } = usePlayerStore();
  const { theme, setTheme } = useThemeStore();
  const [localName, setLocalName] = useState(name);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = localName.trim();
    if (trimmed) setName(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-16 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleSave(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSave} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-[var(--radius-xl)] p-5 space-y-5 shadow-2xl animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-bold text-lg">Settings</h2>
          <button
            onClick={handleSave}
            className="text-muted-foreground hover:text-foreground text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Profile */}
        <div className="space-y-3">
          <label className="text-muted-foreground text-sm font-medium">Profile</label>
          <div className="flex gap-2 items-center">
            <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-[var(--radius-md)] text-2xl shrink-0">
              {emoji}
            </div>
            <input
              className="game-input flex-1"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>

        {/* Emoji picker */}
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium">Icon</label>
          <div className="grid grid-cols-10 gap-1">
            {EMOJIS.map((e, i) => (
              <button
                key={i}
                onClick={() => setEmoji(e)}
                className={cn(
                  'w-8 h-8 text-base rounded-[var(--radius-sm)] flex items-center justify-center transition-all',
                  emoji === e
                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                    : 'hover:bg-accent'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'py-2 px-2 rounded-[var(--radius-md)] text-sm font-medium border transition-all flex items-center justify-center gap-1',
                  theme === t.value
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-border text-foreground hover:bg-accent'
                )}
              >
                {t.label} {t.title}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-[var(--radius-md)] transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
