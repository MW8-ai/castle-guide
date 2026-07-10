import { useState } from 'preact/hooks';
import {
  HudBar,
  NavRail,
  ItemCard,
  RoomCard,
  TaskCard,
  TaskRail,
  AdvisorBubble,
  StatPanel,
  SerenityMeterKit,
  LevelUpToast,
  QuestChip,
  VaultChest,
  AlertCard,
  FloorTabs,
  ContextDock,
  EmptyState,
  GameShell,
} from '../../ui/kit';
import '../../ui/tokens/tokens.css';
import '../../ui/kit/kit.css';

/**
 * DESIGN_BIBLE §5 / §9 kit gate.
 * Screenshot this route before feature re-homing.
 */
export function KitPage() {
  const [theme, setTheme] = useState<'hearthlight' | 'nightwatch'>('nightwatch');
  const [floor, setFloor] = useState('1F');
  const [dockOpen, setDockOpen] = useState(true);

  return (
    <div class="kit-page" data-theme={theme}>
      <h1>Castle Guide · UI Kit</h1>
      <p class="lead">
        Design Bible §5 gallery — every component, both themes. Hard gate: review
        this before features are re-homed into the game shell.
      </p>

      <div class="kit-theme-toggle">
        <button
          type="button"
          class={theme === 'hearthlight' ? 'kit-btn primary' : 'kit-btn'}
          onClick={() => setTheme('hearthlight')}
        >
          Hearthlight
        </button>
        <button
          type="button"
          class={theme === 'nightwatch' ? 'kit-btn primary' : 'kit-btn'}
          onClick={() => setTheme('nightwatch')}
        >
          Nightwatch
        </button>
      </div>

      <section class="kit-section">
        <h2>Game shell frame (§3)</h2>
        <GameShell
          activeNav="house"
          castleName="Thompson Castle"
          dock={
            dockOpen ? (
              <ContextDock
                title="Item"
                onClose={() => setDockOpen(false)}
              >
                <ItemCard />
              </ContextDock>
            ) : undefined
          }
        >
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <FloorTabs active={floor} onChange={setFloor} />
            <p style={{ marginTop: '1rem', opacity: 0.9 }}>
              House stage placeholder — iso rooms go here
            </p>
          </div>
        </GameShell>
      </section>

      <section class="kit-section">
        <h2>HudBar</h2>
        <HudBar />
      </section>

      <section class="kit-section">
        <h2>NavRail</h2>
        <div class="kit-row">
          <NavRail activeId="house" />
          <NavRail activeId="maintain" collapsed />
        </div>
      </section>

      <section class="kit-section">
        <h2>ItemCard (REF-3 anatomy)</h2>
        <div class="kit-row">
          <ItemCard warranty="active" />
          <ItemCard
            brand="Rheem"
            model="XE50"
            category="Water heater"
            warranty="expiring"
            warrantyEnd="2025-08-01"
            maintenanceNext="Anode rod"
            maintenanceDueInDays={45}
          />
          <ItemCard warranty="expired" brand="Old" model="Unit" />
        </div>
      </section>

      <section class="kit-section">
        <h2>RoomCard</h2>
        <div class="kit-row">
          <RoomCard />
          <RoomCard name="Primary Bedroom" dims="16' × 14'" itemCount={4} />
        </div>
      </section>

      <section class="kit-section">
        <h2>TaskCard · TaskRail</h2>
        <div class="kit-row">
          <TaskCard />
          <TaskCard whenNotToDiy title="Gas valve work" difficulty={5} />
          <TaskRail />
        </div>
      </section>

      <section class="kit-section">
        <h2>AdvisorBubble · Serenity · LevelUp · QuestChip</h2>
        <div class="kit-row">
          <AdvisorBubble />
          <SerenityMeterKit />
          <LevelUpToast />
          <QuestChip />
        </div>
      </section>

      <section class="kit-section">
        <h2>VaultChest · AlertCard · EmptyState · FloorTabs</h2>
        <div class="kit-row">
          <VaultChest />
          <AlertCard />
          <EmptyState />
          <FloorTabs active={floor} onChange={setFloor} />
        </div>
      </section>

      <section class="kit-section">
        <h2>StatPanel</h2>
        <StatPanel />
      </section>

      <section class="kit-section">
        <h2>Button states</h2>
        <div class="kit-states">
          <button type="button" class="kit-btn primary">
            Primary
          </button>
          <button type="button" class="kit-btn">
            Default
          </button>
          <button type="button" class="kit-btn ghost">
            Ghost
          </button>
          <button type="button" class="kit-btn" disabled>
            Disabled
          </button>
        </div>
      </section>

      <p class="lead" style={{ marginTop: '2rem' }}>
        <strong>Gate:</strong> screenshot Hearthlight + Nightwatch, then approve
        before house screen + feature re-homing.
      </p>
    </div>
  );
}
