import { route } from 'preact-router';

/** Vite base always ends with / in config: '/castle-guide/' */
export function appBase(): string {
  const b = import.meta.env.BASE_URL || '/';
  return b.endsWith('/') ? b : `${b}/`;
}

/** Join app paths safely under the Pages base. */
export function href(...segments: string[]): string {
  const base = appBase();
  const path = segments
    .filter(Boolean)
    .map((s) => String(s).replace(/^\/+|\/+$/g, ''))
    .join('/');
  return `${base}${path}`;
}

/** Client-side navigate (fixes broken multi-view hops). */
export function go(...segments: string[]): void {
  route(href(...segments), true);
}

/** Router path patterns (no trailing slash on base). */
export function routePath(pattern: string): string {
  const base = appBase().replace(/\/$/, '') || '';
  if (!pattern || pattern === '/') return base || '/';
  return `${base}${pattern.startsWith('/') ? pattern : `/${pattern}`}`;
}
