# Phase 3 — Overview Tab

> **Goal:** Build the default landing surface — server identity, live resource metrics, recent action history, and quick SSH connect — so users can answer "is the server healthy?" in one glance.
> **PRD sections:** §3.2
> **Depends on:** Phase 1 (API client, polling, design system, layout), Phase 2 (token present)
> **Estimated effort:** 1.5 days

---

## §3.2.1 Server Identity Bar

- [ ] Build `IdentityBar.svelte` — _file: `src/webview/pages/Overview/IdentityBar.svelte`_
  - Hostname (large bold), primary IP (monospace), OS template, datacenter (city + country), plan type, creation date
  - `<StatusDot />` reflecting Running / Stopped / Error / Unknown
  - Endpoints: `GET /api/vps/v1/virtual-machines/{id}` (PRD §9)
  - Acceptance: rendered values match what hPanel shows for the same VPS.
- [ ] Three quick-action buttons — Restart, Stop, Recovery Mode — each wrapped in `<ConfirmInline>` from Phase 1
  - Restart: `POST /api/vps/v1/virtual-machines/{id}/restart`
  - Stop: `POST /api/vps/v1/virtual-machines/{id}/stop`
  - Recovery Mode: `POST /api/vps/v1/virtual-machines/{id}/recovery` (DELETE to exit handled in Settings later)
  - Acceptance: each click → "Are you sure?" → confirm → action fires; auto-cancels at 8s.

## §3.2.2 Resource Metrics Panel

- [ ] Build `MetricsPanel.svelte` 2×2 grid: CPU, RAM, Disk, Network — _file: `src/webview/pages/Overview/MetricsPanel.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/metrics`
  - CPU: large % + 24h sparkline + daily average
  - RAM: used / total (e.g. `2.1 / 4 GB`) + horizontal fill bar + %
  - Disk: same shape as RAM
  - Network: total in / out since reboot + sparkline
  - Inline SVG sparkline component `Sparkline.svelte` — no chart library — _file: `src/webview/lib/ui/Sparkline.svelte`_
- [ ] Wire `pollable("vps:metrics", fetchMetrics, prefs.pollingIntervalMs)` from Phase 1 polling abstraction
  - Acceptance: polling stops when panel hidden; resumes when shown.
- [ ] Threshold-aware coloring: each card switches to `warning` style when its metric exceeds the relevant `Preferences.thresholds.*` value (PRD §3.7.4 defaults: CPU 85, RAM 90, Disk 80)
  - Acceptance: lowering a threshold below the current value flips the card to warning within one tick.

## §3.2.3 Recent Actions Log

- [ ] Build `ActionsLog.svelte` — _file: `src/webview/pages/Overview/ActionsLog.svelte`_
  - Last 10 actions; columns: timestamp, action name, status badge (success/failed/pending)
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/actions?limit=10`
  - Hover highlight per row
  - "View full history" link → routes to a deep view (out of scope for v1; show toast "Coming soon" or hide if no API support)
  - Empty state via `<EmptyState>` if no actions returned (PRD §4.5)

## §3.2.4 Quick SSH Connect

- [ ] Build `SshCard.svelte` — _file: `src/webview/pages/Overview/SshCard.svelte`_
  - Pre-built command: `ssh root@<vps-ip>` shown in monospace
  - Copy-to-clipboard button
  - "Open in terminal" button → posts `openTerminal` message to host
- [ ] Host handler `openTerminal` → `vscode.window.createTerminal({ name: "Hostinger VPS" }).sendText(cmd)` — _file: `src/HostingerWebviewProvider.ts`_
  - Acceptance: button click opens an integrated terminal with the command pre-typed (and executed).
- [ ] List currently attached SSH keys: `GET /api/vps/v1/virtual-machines/{id}/public-keys`
  - Each row: key name + truncated fingerprint (monospace)
  - Link → Settings tab SSH section

## Page composition

- [ ] Compose all four sections into `Overview.svelte` route — _file: `src/webview/pages/Overview.svelte`_
  - Skeleton placeholders during initial load (PRD §4.4)
  - Reacts to `Preferences.activeVpsId` change → refetches all sections

## Tests

- [ ] Threshold flip — _file: `src/webview/pages/Overview/__tests__/MetricsPanel.test.ts`_
- [ ] Confirm-inline → action fires (mock API) — _file: `src/webview/pages/Overview/__tests__/IdentityBar.test.ts`_
- [ ] SSH command construction handles IPv6 + custom username (future-proof) — _file: `src/webview/pages/Overview/__tests__/SshCard.test.ts`_
- [ ] Polling pauses when `document.hidden = true` — covered in Phase 1, smoke-tested again here

## Verification

1. Open extension on a real account → Overview renders with correct hostname, IP, OS, plan, datacenter for the active VPS.
2. Sparklines populate after one polling cycle.
3. Lower CPU threshold to `1%` in Settings → CPU card flips to warning color within 1 tick.
4. Click "Restart" → confirm → see action appear in Actions Log within next polling cycle with `pending` status.
5. Click "Open in terminal" → integrated terminal opens with `ssh root@<ip>` pre-typed.
6. Switch VPS via the top-nav selector (Phase 4 dependency — verify after Phase 4) → all four sections refetch.
