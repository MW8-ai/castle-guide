export function StatPanel() {
  return (
    <footer class="kit-stat-panel">
      <div class="kit-stat">
        <h4>Up next</h4>
        <p>HVAC filter · 12d</p>
        <p class="muted">3 tasks due soon</p>
      </div>
      <div class="kit-stat">
        <h4>Castle health</h4>
        <div class="kit-health-shield">A−</div>
        <p class="muted">Great shape</p>
      </div>
      <div class="kit-stat">
        <h4>This month</h4>
        <p class="mono">$412.75</p>
        <div class="kit-mini-chart" aria-hidden="true">
          <i style={{ height: '40%' }} />
          <i style={{ height: '55%' }} />
          <i style={{ height: '35%' }} />
          <i style={{ height: '70%' }} />
          <i style={{ height: '50%' }} />
        </div>
      </div>
      <div class="kit-stat">
        <h4>Recent</h4>
        <p>Kitchen backsplash done</p>
        <p class="muted">May 5</p>
      </div>
    </footer>
  );
}
