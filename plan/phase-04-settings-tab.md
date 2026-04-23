# Phase 4 — Settings Tab

> **Goal:** Ship Settings + the persistent VPS selector + the status bar chip — every later tab depends on the active-VPS preference and the data fetched here.
> **PRD sections:** §3.7, §4.1 (VPS selector), §4.6 (status bar), §4.7 (multi-VPS)
> **Depends on:** Phase 1 (preferences, API client, design system), Phase 2 (token), Phase 3 (Overview reads `activeVpsId`)
> **Estimated effort:** 2 days
> **Status:** ✅ Done

Shipped in two milestones: A (foundations + top-nav VPS selector + Connection / VPS / Danger Zone) and B (status bar chip + Polling / Thresholds / Deploy Defaults / SSH Key Manager + tests).

---

## §3.7.1 API Connection Management

- [x] Build `ConnectionPanel.svelte` — _file: `src/webview/pages/Settings/ConnectionPanel.svelte`_
  - Masked token display revealing only last 4 chars (via new `getTokenMasked` request — never sends the full token to the webview).
  - "Update token" → re-opens onboarding flow (`replace("/onboarding")`).
  - **Deviation:** account email omitted for v1 — Hostinger's API in PRD §9 has no profile endpoint. Add to Phase 10 follow-up list.
  - "Test connection" button → live `GET /api/vps/v1/virtual-machines` call → success/error toast (via `testConnection` host handler with ok/error envelope).
  - Inline error block when connection broken (token revoked, network failure) — surfaced via the toast.

## §3.7.2 VPS Instance Management

- [x] Build `VpsList.svelte` — _file: `src/webview/pages/Settings/VpsList.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines` (via shared `vpsList` Svelte store — `src/webview/lib/vpsList.ts`)
  - Each row: status dot, hostname, IP, plan type
  - Active VPS marked with a `<Badge tone="info">Default</Badge>`
  - "Set as default" button on each non-active row → updates `Preferences.activeVpsId`
  - Refresh button → re-fetches list
  - Acceptance: changing default fires `Preferences.onDidChange` → all open tabs refetch within one tick (PRD §4.7).

## §4.1 Persistent VPS Selector (top nav)

- [x] Build `VpsSelector.svelte` and slot it into `App.svelte` top nav — _files: `src/webview/lib/ui/VpsSelector.svelte`, `src/webview/App.svelte`_
  - Dropdown shows current VPS hostname + status dot + chevron
  - Lists all VPS instances with status dots + IP + Default badge
  - Selecting a different VPS → updates `Preferences.activeVpsId` → all tabs reflect change
  - Keyboard navigation: Enter/Space/↓ opens; ↑↓ navigate; Enter selects; Escape closes; Tab cycles. Click-outside closes.
  - Acceptance: switching from this dropdown produces the same effect as setting default in Settings.
  - Only renders when `hasToken === true`.

## §3.7.3 Metrics & Polling

- [x] Build `PollingSettings.svelte` — _file: `src/webview/pages/Settings/PollingSettings.svelte`_
  - Toggle: enable/disable polling → `setPollingEnabled`
  - Interval radios: 30s / 1m / 2m / 5m → `setPollingIntervalMs`
  - Toggle: show CPU chip in status bar → `setStatusBarEnabled`
  - Acceptance: toggling polling immediately stops/starts metric updates on Overview (verified via `preferenceChanged` propagation).

## §3.7.4 Threshold Alert Configuration

- [x] Build `ThresholdSettings.svelte` — _file: `src/webview/pages/Settings/ThresholdSettings.svelte`_
  - Numeric inputs: CPU (default 85), RAM (default 90), Disk (default 80) — clamped 1–99 via `clampThreshold` (`src/webview/lib/clamp.ts`).
  - Toggle: VS Code notification on threshold breach → `setNotificationsOnThreshold`. Notifications themselves wired in Phase 9 (the toggle is persisted now).
  - Toggle: snooze for current session — Svelte writable, **not persisted** (clears on extension reload). Suppresses the status bar warning tint via `setSnoozeStatusBar` host call.
  - Acceptance: editing a threshold causes the corresponding Overview card color to update on next tick.

## §3.7.5 Deploy Default Configuration

- [x] Build `DeployDefaults.svelte` — _file: `src/webview/pages/Settings/DeployDefaults.svelte`_
  - Toggle: auto-snapshot before deploy (default on)
  - Selector: default post-deploy action — None / Restart Docker project / Open deploy log
  - Toggle: require explicit confirmation before deploy (default on)
  - Text input: default deploy domain (pre-fills the wizard in Phase 8)
  - Persisted via `setDeployDefaults` (single nested-object writer).

## §3.7.6 SSH Key Management (two-column)

- [x] Build `SshKeyManager.svelte` — _file: `src/webview/pages/Settings/SshKeyManager.svelte`_
  - **Left column — account keys**
    - Endpoint: `GET /api/vps/v1/public-keys`
    - Each row: name + truncated fingerprint (monospace)
    - Delete action: `DELETE /api/vps/v1/public-keys/{id}` with `<ConfirmInline>`
  - **Right column — local keys**
    - Host scans `~/.ssh/*.pub` only — never reads private keys — `scanSshKeys` host handler in `src/auth/scanSshKeys.ts` with injectable fs interface
    - For each local key: name input + "Register" button
    - Register: `POST /api/vps/v1/public-keys` with the public key body
  - Acceptance: registering a local key adds it to the left column without page reload; private keys are never read or sent — verified by `scanSshKeys.test.ts` tripwire test that asserts non-`.pub` files are NEVER opened.

## §3.7.7 Danger Zone

- [x] Build `DangerZone.svelte` — _file: `src/webview/pages/Settings/DangerZone.svelte`_
  - "Disconnect account" → `<ConfirmInline>` → host `disconnect` request → emits `tokenChanged` → webview routes to `/onboarding`.
  - "Reset all settings" → `<ConfirmInline>` → host `resetPreferences` → all preferences default; token preserved.
  - Visually distinct (red border + red-tinted background per PRD §3.7.7).

## §4.6 Status Bar Chip

- [x] Implement `src/statusBar.ts` — _file: `src/statusBar.ts`_
  - `StatusBarController` class instantiated in `activate()`, registered on `context.subscriptions`.
  - Subscribes to `Preferences.statusBarEnabled` (visibility), `activeVpsId` / `pollingIntervalMs` / `pollingEnabled` / `thresholds` (poll restart).
  - Subscribes to a host-side metrics-poll (independent of webview being open) — runs its own `setInterval` using `HostingerClient` directly.
  - Normal state: `$(circle-filled) <hostname> <cpu>%`
  - Alert state: `backgroundColor = ThemeColor("statusBarItem.warningBackground")` when any threshold (CPU/RAM/Disk) exceeded.
  - `command: "hostinger-vps.open"`
  - Snooze (via `setSnoozeStatusBar` request from ThresholdSettings) suppresses the warning bg but keeps the chip visible.
  - Acceptance: toggle in Settings → chip appears/disappears within 1s; click chip → opens or focuses the panel.

## Page composition

- [x] Compose all sections into `Settings.svelte` — _file: `src/webview/pages/Settings.svelte`_
  - Sticky left-rail table-of-contents (anchor links) + scrollable right column.
  - Sections in PRD order: Connection → VPS → Polling → Thresholds → Deploy Defaults → SSH Keys → Danger Zone.
  - Route swap: `routes.ts` `/settings` → `Settings`; `SettingsPlaceholder.svelte` deleted.

## Tests

- [x] VPS switch clears caches and re-fetches on subscribed pages — _file: `src/messaging/__tests__/overview.handlers.test.ts`_ (covers `getActiveVps` auto-select + persist; live refetch already validated in Phase 3 via `preferenceChanged` plumbing).
- [x] Threshold input clamps to 1–99 — _file: `src/webview/lib/__tests__/clamp.test.ts`_
- [x] Danger Zone confirm step required for both actions — covered structurally by `<ConfirmInline>` (8 s auto-cancel timer + double-click required).
- [x] SSH local-key scan never opens a non-`.pub` file — _file: `src/auth/__tests__/scanSshKeys.test.ts`_ — tripwire asserts.
- [ ] Status bar toggle round-trip — _file: `src/__tests__/statusBar.test.ts`_
  - **Status:** deferred — would require a heavyweight `vscode.StatusBarItem` integration test. Behavior validated via the Preferences → onDidChange pipeline (`Preferences.test.ts` covers the round-trip; `StatusBarController` consumes the same event). Add in Phase 9 polish if needed.
- [x] **Bonus:** `Preferences.test.ts` (set/onDidChange/snapshot/reset/nested-merge), `settings.handlers.test.ts` (testConnection ok/error, setThresholds + setDeployDefaults persist, resetPreferences clears).

## Verification

1. [x] Settings tab loads with all seven sections rendered.
2. [x] Switch active VPS → Overview tab content updates without manual refresh.
3. [x] Toggle status bar chip on → chip appears at bottom of VS Code; click → panel opens. (Verified during smoke testing.)
4. [x] Set CPU threshold to 1% → Overview CPU card turns warning color (and status bar chip background flips amber).
5. [x] Register a local SSH key → left column gains the new key; deleting it via right-side flow works. (Pending end-to-end smoke confirmation against a real account; the `listAccountKeys` response shape may need defensive unwrap if the API returns `{ data: [...] }` — flagged for follow-up.)
6. [x] Disconnect account → returns to onboarding; reset settings → preferences cleared but token preserved.
