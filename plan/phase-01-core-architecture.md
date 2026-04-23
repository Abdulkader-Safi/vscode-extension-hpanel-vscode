# Phase 1 — Core Architecture

> **Goal:** Build the load-bearing infrastructure every later tab will sit on: typed Hostinger API client, secure token storage, typed extension↔webview messaging, design-system primitives, layout shell, routing with auth guard, and a polling abstraction.
> **PRD sections:** §6 (constraints), foundation for §3.1–§3.7 and §4
> **Depends on:** Phase 0
> **Estimated effort:** 2–3 days

---

## API client (extension host)

- [ ] Implement base HTTP wrapper with bearer auth, 30s timeout, JSON in/out — _file: `src/api/HostingerClient.ts`_
  - Acceptance: `client.get("/api/vps/v1/virtual-machines")` returns typed list given a valid token.
- [ ] Add exponential backoff with jitter for `429` and `5xx` responses (PRD §6.1) — _file: `src/api/HostingerClient.ts`_
  - Cap at 3 retries; honor `Retry-After` header when present.
  - Acceptance: unit test with mocked fetch returning 429 then 200 succeeds within ≤3 attempts.
- [ ] Normalize error responses into `HostingerApiError` with `status`, `code`, `message`, `requestId` — _file: `src/api/errors.ts`_
- [ ] Group endpoint methods by domain — _file: `src/api/HostingerClient.ts`_
  - `client.vps.*`, `client.docker.*`, `client.firewall.*`, `client.snapshots.*`, `client.backups.*`, `client.publicKeys.*`, `client.hosting.*`
  - All endpoints from PRD §9 covered. Acceptance: `grep` for each endpoint URL in §9 returns at least one hit in the file.

## API types

- [ ] Author manual TS types for every endpoint payload in PRD §9 — _file: `src/api/types.ts`_
  - VPS, Metrics, Action, DockerProject, Container, FirewallRule, Snapshot, Backup, PublicKey
  - Acceptance: `tsc --noEmit` passes; no `any` in the public surface.

## Token storage

- [ ] Wrap `vscode.SecretStorage` with `TokenStore` — _file: `src/auth/TokenStore.ts`_
  - Methods: `get()`, `set(token)`, `clear()`, `has()`
  - Acceptance: token round-trips across panel close/reopen.
- [ ] Add `validateToken(token)` that pings `GET /api/vps/v1/virtual-machines` and returns `{ ok, accountEmail? }` — _file: `src/auth/TokenStore.ts`_
- [ ] Ensure no log statement, telemetry call, or error message ever serializes the token — verified by lint rule or grep audit
  - Acceptance: `grep -ri "token" src` audit shows no string interpolation that could leak.

## Preferences store

- [ ] Wrap `context.globalState` with typed `Preferences` — _file: `src/state/Preferences.ts`_
  - Keys: `activeVpsId`, `pollingEnabled`, `pollingIntervalMs`, `statusBarEnabled`, `thresholds.{cpu,ram,disk}`, `notificationsOnThreshold`, `deploy.preSnapshot`, `deploy.postAction`, `deploy.confirm`, `deploy.defaultDomain`
  - Defaults match PRD §3.7.4 (CPU 85, RAM 90, Disk 80) and §3.7.5.
  - Emits `onDidChange` events so the webview can react.

## Messaging contract

- [ ] Define discriminated union of all webview→host requests and host→webview events — _file: `src/messaging/contract.ts`_
  - Every message has a `type` literal and a generated `id` for request/response correlation.
- [ ] Implement host-side router in `HostingerWebviewProvider` — _file: `src/HostingerWebviewProvider.ts`_
  - Replaces the demo `switch` block from Phase 0 with `register(type, handler)` registry.
- [ ] Implement webview-side `host.request<TReq, TRes>(type, payload)` returning a Promise resolved by the matching response id — _file: `src/webview/lib/host.ts`_
- [ ] Implement webview-side `host.on(eventType, listener)` for unsolicited events from host (token cleared, prefs changed, polling tick) — _file: `src/webview/lib/host.ts`_
  - Acceptance: round-trip unit test: webview sends `ping`, host replies `pong`, promise resolves.

## Design system primitives

All under `src/webview/lib/ui/` — single Svelte file per primitive.

- [ ] `Button.svelte` — variants: `primary | secondary | ghost | danger`; size: `sm | md`; loading state with inline spinner (no global spinner per PRD §4.4)
- [ ] `Card.svelte` — padded surface using `--vscode-editorWidget-background`
- [ ] `Badge.svelte` — semantic variants: `neutral | success | warning | error | info`
- [ ] `StatusDot.svelte` — colored dot for running/stopped/error/unknown
- [ ] `Toast.svelte` + `toastStore.ts` — bottom-right stack of max 3, auto-dismiss for non-error after 4s (PRD §4.3)
- [ ] `Skeleton.svelte` — pulsing placeholder, accepts width/height (PRD §4.4)
- [ ] `Modal.svelte` — focus-trapped overlay; only used by Backup Restore and New Docker Project per PRD §4.2 exception
- [ ] `EmptyState.svelte` — icon + heading + line + CTA (PRD §4.5)
- [ ] `ConfirmInline.svelte` — wraps a destructive button; click 1 → "Are you sure? Yes / Cancel"; auto-cancels after 8s (PRD §4.2)
  - Acceptance: visual smoke test on a stub page exercises every primitive.

## Theming

- [ ] Map Tailwind theme to VS Code CSS variables in `src/webview/index.css` — _file: `src/webview/index.css`_
  - `--color-bg: var(--vscode-editor-background)`, `--color-fg: var(--vscode-editor-foreground)`, etc.
  - Resolves PRD §8 Open Q4 in favor of native theming.
  - Acceptance: switching VS Code light↔dark theme updates the panel without reload.

## Layout shell & routing

- [ ] Rebuild `src/webview/App.svelte` — top nav (logo + tab list slot + VPS-selector slot), route outlet, persistent toast region — _file: `src/webview/App.svelte`_
- [ ] Add routes — _file: `src/webview/routes.ts`_
  - `/onboarding`, `/` (Overview), `/docker`, `/deploy`, `/firewall`, `/snapshots`, `/settings`
  - Each route mounts an empty placeholder `<Card>Coming soon — Phase N</Card>` that gets replaced by the appropriate phase.
- [ ] Auth guard — if `TokenStore.has() === false`, any non-`/onboarding` route redirects to `/onboarding` — _file: `src/webview/App.svelte`_
- [ ] Tab nav respects active route via `svelte-spa-router` `link` action with `active` class.

## Polling abstraction

- [ ] `pollable(key, fetcher, intervalMs)` — _file: `src/webview/lib/poll.ts`_
  - Pauses when `document.hidden` is true.
  - Single in-flight per key (drops overlapping ticks).
  - Subscribes to `Preferences.pollingIntervalMs`.
  - Returns a Svelte store `{ data, error, loading, lastTickAt }`.
  - Acceptance: unit test confirms only one fetch happens when the tick interval is shorter than the fetch latency.

## Tests

- [ ] `HostingerClient` retry/backoff with mocked fetch — _file: `src/api/__tests__/HostingerClient.test.ts`_
- [ ] `TokenStore` round-trip in a mocked `SecretStorage` — _file: `src/auth/__tests__/TokenStore.test.ts`_
- [ ] Messaging request/response correlation — _file: `src/messaging/__tests__/contract.test.ts`_
- [ ] `pollable` pause-on-hidden + single-in-flight — _file: `src/webview/lib/__tests__/poll.test.ts`_

## Verification

1. `npm run check-types` and `npm run lint` clean.
2. `npm test` passes.
3. F5 → panel opens, lands on `/onboarding` (no token yet).
4. Manually inject a fake token via the dev tools `vscode.postMessage` and confirm the auth guard releases — every tab route renders its "Coming soon" placeholder.
5. Toggle VS Code theme — colors follow.
