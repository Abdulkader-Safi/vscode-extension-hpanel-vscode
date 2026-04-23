# Phase 4 — Settings Tab

> **Goal:** Ship Settings + the persistent VPS selector + the status bar chip — every later tab depends on the active-VPS preference and the data fetched here.
> **PRD sections:** §3.7, §4.1 (VPS selector), §4.6 (status bar), §4.7 (multi-VPS)
> **Depends on:** Phase 1 (preferences, API client, design system), Phase 2 (token), Phase 3 (Overview reads `activeVpsId`)
> **Estimated effort:** 2 days

---

## §3.7.1 API Connection Management

- [ ] Build `ConnectionPanel.svelte` — _file: `src/webview/pages/Settings/ConnectionPanel.svelte`_
  - Masked token display revealing only last 4 chars
  - "Update token" → re-opens onboarding flow (re-uses Phase 2 component)
  - Account email shown when connection valid
  - "Test connection" button → live `GET /api/vps/v1/virtual-machines` call → success/error toast
  - Inline error block when connection broken (token revoked, network failure)

## §3.7.2 VPS Instance Management

- [ ] Build `VpsList.svelte` — _file: `src/webview/pages/Settings/VpsList.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines`
  - Each row: status dot, hostname, IP, plan type
  - Active VPS marked with a `<Badge variant="info">Default</Badge>`
  - "Set as default" button on each non-active row → updates `Preferences.activeVpsId`
  - Refresh button → re-fetches list
  - Acceptance: changing default fires `Preferences.onDidChange` → all open tabs refetch within one tick (PRD §4.7).

## §4.1 Persistent VPS Selector (top nav)

- [ ] Build `VpsSelector.svelte` and slot it into `App.svelte` top nav — _files: `src/webview/lib/ui/VpsSelector.svelte`, `src/webview/App.svelte`_
  - Dropdown shows current VPS hostname + status dot
  - Lists all VPS instances with status dots (live during polling)
  - Selecting a different VPS → updates `Preferences.activeVpsId` → all tabs reflect change
  - Acceptance: switching from this dropdown produces the same effect as setting default in Settings.

## §3.7.3 Metrics & Polling

- [ ] Build `PollingSettings.svelte` — _file: `src/webview/pages/Settings/PollingSettings.svelte`_
  - Toggle: enable/disable polling
  - Interval selector: 30s / 1m / 2m / 5m
  - Toggle: show CPU chip in status bar
  - Acceptance: toggling polling immediately stops/starts metric updates on Overview.

## §3.7.4 Threshold Alert Configuration

- [ ] Build `ThresholdSettings.svelte` — _file: `src/webview/pages/Settings/ThresholdSettings.svelte`_
  - Numeric inputs: CPU (default 85), RAM (default 90), Disk (default 80) — clamped 1–99
  - Toggle: VS Code notification on threshold breach
  - Toggle: snooze for current session (cleared on extension reload)
  - Acceptance: editing a threshold causes the corresponding Overview card color to update on next tick.

## §3.7.5 Deploy Default Configuration

- [ ] Build `DeployDefaults.svelte` — _file: `src/webview/pages/Settings/DeployDefaults.svelte`_
  - Toggle: auto-snapshot before deploy (default on)
  - Selector: default post-deploy action — None / Restart Docker project / Open deploy log
  - Toggle: require explicit confirmation before deploy (default on)
  - Text input: default deploy domain (pre-fills the wizard in Phase 8)

## §3.7.6 SSH Key Management (two-column)

- [ ] Build `SshKeyManager.svelte` — _file: `src/webview/pages/Settings/SshKeyManager.svelte`_
  - **Left column — account keys**
    - Endpoint: `GET /api/vps/v1/public-keys`
    - Each row: name + truncated fingerprint (monospace)
    - Delete action: `DELETE /api/vps/v1/public-keys/{id}` with `<ConfirmInline>`
  - **Right column — local keys**
    - Host scans `~/.ssh/*.pub` only — never reads private keys — handler `scanSshKeys` in `HostingerWebviewProvider`
    - For each local key: name input + "Register" button
    - Register: `POST /api/vps/v1/public-keys` with the public key body
  - Acceptance: registering a local key adds it to the left column without page reload; private keys are never read or sent.

## §3.7.7 Danger Zone

- [ ] Build `DangerZone.svelte` — _file: `src/webview/pages/Settings/DangerZone.svelte`_
  - "Disconnect account" → `<ConfirmInline>` → `TokenStore.clear()` → routes to `/onboarding`
  - "Reset all settings" → `<ConfirmInline>` → clears `globalState` (preserves token)
  - Visually distinct (red border per PRD §3.7.7)

## §4.6 Status Bar Chip

- [ ] Implement `src/statusBar.ts` — _file: `src/statusBar.ts`_
  - Subscribes to `Preferences.statusBarEnabled`
  - Subscribes to a host-side metrics-poll (independent of webview being open)
  - Normal state: `$(circle-filled) <hostname> <cpu>%`
  - Alert state: warning-colored background when any threshold exceeded
  - `command: "hostinger-vps.open"`
  - Acceptance: toggle in Settings → chip appears/disappears within 1s; click chip → opens or focuses the panel.

## Page composition

- [ ] Compose all sections into `Settings.svelte` — _file: `src/webview/pages/Settings.svelte`_
  - Section anchors and a sticky table of contents on the left for navigation
  - Sections in PRD order: Connection → VPS → Polling → Thresholds → Deploy Defaults → SSH Keys → Danger Zone

## Tests

- [ ] VPS switch clears caches and re-fetches on subscribed pages — _file: `src/state/__tests__/Preferences.test.ts`_
- [ ] Threshold input clamps to 1–99 — _file: `src/webview/pages/Settings/__tests__/ThresholdSettings.test.ts`_
- [ ] Danger Zone confirm step required for both actions
- [ ] SSH local-key scan never opens a non-`.pub` file — _file: `src/__tests__/scanSshKeys.test.ts`_
- [ ] Status bar toggle round-trip — _file: `src/__tests__/statusBar.test.ts`_

## Verification

1. Settings tab loads with all seven sections rendered.
2. Switch active VPS → Overview tab content updates without manual refresh.
3. Toggle status bar chip on → chip appears at bottom of VS Code; click → panel opens.
4. Set CPU threshold to 1% → Overview CPU card turns warning color.
5. Register a local SSH key → left column gains the new key; deleting it via right-side flow works.
6. Disconnect account → returns to onboarding; reset settings → preferences cleared but token preserved.
