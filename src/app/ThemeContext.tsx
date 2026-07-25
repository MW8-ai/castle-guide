import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export type Theme = 'light' | 'dark';

const ThemeCtx = createContext<Theme>('dark');

export const ThemeProvider = ThemeCtx.Provider;

export function useTheme(): Theme {
  return useContext(ThemeCtx);
}
