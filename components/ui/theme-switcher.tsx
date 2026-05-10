'use client';

import { useThemeStore, type Theme } from '@/store/themeStore';
import { cn } from '@/lib/utils';

const THEMES: { value: Theme; label: string; title: string }[] = [
  { value: 'dark',  label: '🌙', title: 'Dark' },
  { value: 'light', label: '☀️', title: 'Light' },
  { value: 'retro', label: '📼', title: 'Retro' },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className={cn('flex gap-1', className)}>
      {THEMES.map((t) => (
        <button
          key={t.value}
          title={t.title}
          onClick={() => setTheme(t.value)}
          className={cn(
            'w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all',
            theme === t.value
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--background)]'
              : 'bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--foreground)]'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
