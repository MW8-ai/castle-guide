import type { ComponentChildren } from 'preact';
import { Disclaimer } from './Disclaimer';

const base = import.meta.env.BASE_URL;

interface ShellProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: ComponentChildren;
}

export function Shell({ theme, onToggleTheme, children }: ShellProps) {
  return (
    <>
      <header class="topbar">
        <a class="brand" href={base}>
          <span class="brand-mark" aria-hidden="true">
            🏰
          </span>
          <span>Castle Guide</span>
        </a>
        <nav class="nav">
          <a href={base}>Home</a>
          <a href={`${base}import`}>Import</a>
          <a href={`${base}docs`}>Docs</a>
          <a href={`${base}spike`}>Spike</a>
        </nav>
        <button type="button" class="theme-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>
      <main class="main">{children}</main>
      <footer class="footer">
        <Disclaimer />
        <p class="footer-meta">
          v0.3.0 · Phase 2 · Local-first ·{' '}
          <span class="serenity-whisper">How's the serenity?</span>
        </p>
      </footer>
    </>
  );
}
