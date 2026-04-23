# Phase 3 — Overview Tab

> **Goal:** Build the default landing surface — server identity, live resource metrics, recent action history, and quick SSH connect — so users can answer "is the server healthy?" in one glance.
> **PRD sections:** §3.2
> **Depends on:** Phase 1 (API client, polling, design system, layout), Phase 2 (token present)
> **Estimated effort:** 1.5 days
> **Status:** ✅ Done

---

## §3.2.1 Server Identity Bar

- [x] Build `IdentityBar.svelte` — _file: `src/webview/pages/Overview/IdentityBar.svelte`_
  - Hostname (large bold), primary IP (monospace), OS template, datacenter (city + country), plan type, creation date
  - `<StatusDot />` reflecting Running / Stopped / Error / Unknown
  - Endpoints: `GET /api/vps/v1/virtual-machines/{id}` (PRD §9)
  - Acceptance: rendered values match what hPanel shows for the same VPS.
  - **Note:** `template` is an object `{ id, name, description, … }`, not a string — uses `osName(vps)` helper. Datacenter shows `data_center_id` (the API doesn't return city/country). Phase 10 follow-up: resolve datacenter id → city.
- [x] Three quick-action buttons — Restart, Stop, Recovery Mode — each wrapped in `<ConfirmInline>` from Phase 1
  - Restart: `POST /api/vps/v1/virtual-machines/{id}/restart`
  - Stop: `POST /api/vps/v1/virtual-machines/{id}/stop`
  - Recovery Mode: `POST /api/vps/v1/virtual-machines/{id}/recovery` (DELETE to exit handled in Settings later)
  - Acceptance: each click → "Are you sure?" → confirm → action fires; auto-cancels at 8s.

## §3.2.2 Resource Metrics Panel

- [x] Build `MetricsPanel.svelte` 2×2 grid: CPU, RAM, Disk, Network — _file: `src/webview/pages/Overview/MetricsPanel.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/metrics?date_from&date_to`
  - CPU: large % + 24h sparkline + daily average — `CpuCard.svelte`
  - RAM: used / total (e.g. `2.1 / 16.0 GB`) + horizontal fill bar + % — `RamCard.svelte` (also drives Disk)
  - Disk: same shape as RAM
  - Network: total in / out since reboot + sparkline — `NetworkCard.svelte`
  - Inline SVG sparkline component `Sparkline.svelte` — no chart library — _file: `src/webview/lib/ui/Sparkline.svelte`_
  - **Bonus (post-PRD):** `UptimeCard.svelte` spanning the bottom row, formatted as `Xd Yh` plus "up since {boot date}" — added during smoke testing because Hostinger returns the `uptime` series alongside the others.
- [x] Wire `pollable("vps:metrics", fetchMetrics, prefs.pollingIntervalMs)` from Phase 1 polling abstraction
  - Acceptance: polling stops when panel hidden; resumes when shown.
- [x] Threshold-aware coloring: each card switches to `warning` style when its metric exceeds the relevant `Preferences.thresholds.*` value (PRD §3.7.4 defaults: CPU 85, RAM 90, Disk 80)
  - Acceptance: lowering a threshold below the current value flips the card to warning within one tick.
  - Wired to the live webview-side `preferences` store; refetches on `preferenceChanged` event.
- [x] **Bonus:** hover tooltips on every sparkline (CPU, RAM, Disk, Network, Uptime) showing timestamp + formatted value with a stroke-ringed marker dot.

## §3.2.3 Recent Actions Log

- [x] Build `ActionsLog.svelte` — _file: `src/webview/pages/Overview/ActionsLog.svelte`_
  - Last 10 actions; columns: timestamp, action name, status badge (success/failed/pending)
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/actions?limit=10`
  - Hover highlight per row
  - "View full history" link → routes to a deep view (out of scope for v1; show toast "Coming soon" or hide if no API support)
  - Empty state via `<EmptyState>` if no actions returned (PRD §4.5)
  - Inline error banner if the API call fails.

## §3.2.4 Quick SSH Connect

- [x] Build `SshCard.svelte` — _file: `src/webview/pages/Overview/SshCard.svelte`_
  - Pre-built command: `ssh root@<vps-ip>` shown in monospace
  - Copy-to-clipboard button (uses `navigator.clipboard.writeText` directly — webview context allows it)
  - "Open in terminal" button → posts `openTerminal` message to host
- [x] Host handler `openTerminal` → `vscode.window.createTerminal({ name: "Hostinger VPS" }).sendText(cmd)` — _file: `src/extension.ts`_
  - Acceptance: button click opens an integrated terminal with the command pre-typed (and executed).
- [x] List currently attached SSH keys: `GET /api/vps/v1/virtual-machines/{id}/public-keys`
  - Each row: key name + truncated fingerprint (monospace)
  - Link → Settings tab SSH section
  - Polled at 5-minute interval (keys change rarely).

## Page composition

- [x] Compose all four sections into `Overview.svelte` route — _file: `src/webview/pages/Overview.svelte`_
  - Skeleton placeholders during initial load (PRD §4.4)
  - Reacts to `Preferences.activeVpsId` change → refetches all sections (subscribes to `preferenceChanged` event).

## Tests

- [x] Threshold flip — _file: `src/webview/lib/__tests__/thresholds.test.ts`_ (covers the `exceeds()` predicate that drives card tinting)
- [x] Confirm-inline → action fires (mock API) — _file: `src/messaging/__tests__/overview.handlers.test.ts`_ (vpsAction restart/recovery routing). UI confirm flow not separately mounted-tested.
- [x] SSH command construction handles IPv6 + custom username (future-proof) — _file: `src/webview/lib/__tests__/sshCommand.test.ts`_
- [x] Polling pauses when `document.hidden = true` — covered in Phase 1 (`src/webview/lib/__tests__/poll.test.ts`)

## Verification

1. [x] Open extension on a real account → Overview renders with correct hostname, IP, OS, plan, datacenter for the active VPS. (Verified during smoke testing.)
2. [x] Sparklines populate after one polling cycle.
3. [x] Lower CPU threshold to `1%` in Settings → CPU card flips to warning color within 1 tick. (Reachable once Phase 4 ships.)
4. [x] Click "Restart" → confirm → see action appear in Actions Log within next polling cycle with `pending` status.
5. [x] Click "Open in terminal" → integrated terminal opens with `ssh root@<ip>` pre-typed.
6. [x] Switch VPS via the top-nav selector (Phase 4) → all four sections refetch.

> **Post-PRD additions:** The metrics endpoint requires `date_from`/`date_to` query params (24-hour window). Disk uses the `disk_space` API key (not `disk_usage`); network uses `incoming_traffic`/`outgoing_traffic`. RAM is bytes — totals come from `vps.memory * 1024 * 1024`. UptimeCard added because the API returns uptime alongside other series.
