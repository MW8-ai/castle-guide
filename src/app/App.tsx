import { useState } from 'preact/hooks';
import { Router, Route } from 'preact-router';
import { AppShell } from './AppShell';
import { ActiveCastleProvider } from './ActiveCastle';
import { routePath } from './paths';
import { HomePage } from './pages/HomePage';
import { HousePage } from './pages/HousePage';
import { InventoryPage } from './pages/InventoryPage';
import { FloorPlanPage } from './pages/FloorPlanPage';
import { MaintainPage } from './pages/MaintainPage';
import { MoneyPage } from './pages/MoneyPage';
import { CouncilPage } from './pages/CouncilPage';
import { AreaPage } from './pages/AreaPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { BuildersPage } from './pages/BuildersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportPage } from './pages/ImportPage';
import { ImportZipPage } from './pages/ImportZipPage';
import { KitPage } from './pages/KitPage';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  });
  const [path, setPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  return (
    <div class={`app theme-${theme}`} data-theme={theme}>
      <ActiveCastleProvider>
        <AppShell
          theme={theme}
          path={path}
          onToggleTheme={() =>
            setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
          }
        >
          <Router
            onChange={(e) => {
              setPath(e.url || window.location.pathname);
            }}
          >
            <Route path={routePath('/')} component={HomePage} />
            <Route path={routePath('')} component={HomePage} />
            <Route
              path={routePath('/property/:id/house')}
              component={HousePage}
            />
            <Route
              path={routePath('/property/:id/inventory')}
              component={InventoryPage}
            />
            <Route
              path={routePath('/property/:id/floorplan')}
              component={FloorPlanPage}
            />
            <Route
              path={routePath('/property/:id')}
              component={HousePage}
            />
            <Route
              path={routePath('/property/:id/maintain')}
              component={MaintainPage}
            />
            <Route
              path={routePath('/property/:id/money')}
              component={MoneyPage}
            />
            <Route
              path={routePath('/property/:id/council')}
              component={CouncilPage}
            />
            <Route
              path={routePath('/property/:id/area')}
              component={AreaPage}
            />
            <Route
              path={routePath('/property/:id/emergency')}
              component={EmergencyPage}
            />
            <Route
              path={routePath('/property/:id/builders')}
              component={BuildersPage}
            />
            <Route path={routePath('/import')} component={ImportPage} />
            <Route path={routePath('/import-zip')} component={ImportZipPage} />
            <Route path={routePath('/settings')} component={SettingsPage} />
            <Route path={routePath('/council')} component={CouncilPage} />
            <Route path={routePath('/builders')} component={BuildersPage} />
            <Route path={routePath('/kit')} component={KitPage} />
            <Route default component={HomePage} />
          </Router>
        </AppShell>
      </ActiveCastleProvider>
    </div>
  );
}
