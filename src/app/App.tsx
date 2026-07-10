import { useState } from 'preact/hooks';
import { Router, Route } from 'preact-router';
import { Shell } from '../ui/Shell';
import { HomePage } from './pages/HomePage';
import { DocsPage } from './pages/DocsPage';
import { SpikeLinkPage } from './pages/SpikeLinkPage';
import { PropertyPage } from './pages/PropertyPage';
import { ImportPage } from './pages/ImportPage';
import { ImportZipPage } from './pages/ImportZipPage';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  });

  return (
    <div class={`app theme-${theme}`} data-theme={theme}>
      <Shell
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      >
        <Router>
          <Route path={base || '/'} component={HomePage} />
          <Route path={`${base}/`} component={HomePage} />
          <Route path={`${base}/docs`} component={DocsPage} />
          <Route path={`${base}/spike`} component={SpikeLinkPage} />
          <Route path={`${base}/import`} component={ImportPage} />
          <Route path={`${base}/import-zip`} component={ImportZipPage} />
          <Route path={`${base}/property/:id`} component={PropertyPage} />
          <Route default component={HomePage} />
        </Router>
      </Shell>
    </div>
  );
}
