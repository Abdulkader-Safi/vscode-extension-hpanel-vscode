# Phase 1 — Core Architecture

> **Goal:** Build the load-bearing infrastructure every later tab will sit on: typed Hostinger API client, secure token storage, typed extension↔webview messaging, design-system primitives, layout shell, routing with auth guard, and a polling abstraction.
> **PRD sections:** §6 (constraints), foundation for §3.1–§3.7 and §4
> **Depends on:** Phase 0
> **Estimated effort:** 2–3 days

---

## API client (extension host)

- [x] Implement base HTTP wrapper with bearer auth, 30s timeout, JSON in/out — _file: `src/api/HostingerClient.ts`_
  - Acceptance: `client.get("/api/vps/v1/virtual-machines")` returns typed list given a valid token.
  - Uses native Node 18+ `fetch` with `AbortSignal.timeout(30_000)`; injectable `fetchImpl` for tests.
- [x] Add exponential backoff with jitter for `429` and `5xx` responses (PRD §6.1) — _file: `src/api/HostingerClient.ts`_
  - Cap at 3 retries; honor `Retry-After` header when present.
  - Acceptance: unit test with mocked fetch returning 429 then 200 succeeds within ≤3 attempts.
  - Defaults: base 500 ms, factor 2, jitter ±25 %; honors `Retry-After` (seconds or HTTP date) and uses `max(retryAfter, computed)`.
- [x] Normalize error responses into `HostingerApiError` with `status`, `code`, `message`, `requestId` — _file: `src/api/errors.ts`_
  - Also exposes `retryable` and `retryAfterMs` for caller logic. `requestId` field present but not currently populated (Hostinger API doesn't expose one in tested responses).
- [x] Group endpoint methods by domain — _file: `src/api/HostingerClient.ts`_
  - `client.vps.*`, `client.docker.*`, `client.firewall.*`, `client.snapshots.*`, `client.backups.*`, `client.publicKeys.*`, `client.hosting.*`
  - All endpoints from PRD §9 covered. Acceptance: `grep` for each endpoint URL in §9 returns at least one hit in the file.

## API types

- [x] Author manual TS types for every endpoint payload in PRD §9 — _file: `src/api/types.ts`_
  - VPS, Metrics, Action, DockerProject, Container, FirewallRule, Snapshot, Backup, PublicKey
  - Acceptance: `tsc --noEmit` passes; no `any` in the public surface.
  - Conservative shapes — fields will be added/refined as Phases 3-8 surface API responses against real accounts.

## Token storage

- [x] Wrap `vscode.SecretStorage` with `TokenStore` — _file: `src/auth/TokenStore.ts`_
  - Methods: `get()`, `set(token)`, `clear()`, `has()`
  - Acceptance: token round-trips across panel close/reopen. (Verified by unit test against fake `SecretStorage`.)
- [x] Add `validateToken(token)` that pings `GET /api/vps/v1/virtual-machines` and returns `{ ok, accountEmail? }` — _file: `src/auth/TokenStore.ts`_
  - **Deviation:** returns `{ ok: true; data: Vps[] } | { ok: false; error: string }` rather than `{ ok, accountEmail? }`. The Hostinger API surface in PRD §9 does not include an account-email endpoint, so the VPS list serves as both validation proof and useful first-paint data for the onboarding success state.
- [x] Ensure no log statement, telemetry call, or error message ever serializes the token — verified by lint rule or grep audit
  - Acceptance: `grep -ri "token" src` audit shows no string interpolation that could leak. (Audited; zero `console.*` calls anywhere; `validate()` test asserts the token never appears in returned error.)

## Preferences store

- [x] Wrap `context.globalState` with typed `Preferences` — _file: `src/state/Preferences.ts`_
  - Keys: `activeVpsId`, `pollingEnabled`, `pollingIntervalMs`, `statusBarEnabled`, `thresholds.{cpu,ram,disk}`, `notificationsOnThreshold`, `deploy.preSnapshot`, `deploy.postAction`, `deploy.confirm`, `deploy.defaultDomain`
  - Defaults match PRD §3.7.4 (CPU 85, RAM 90, Disk 80) and §3.7.5.
  - Emits `onDidChange` events so the webview can react.
  - Bonus: shallow-merges stored object values with defaults so newly added subkeys don't read undefined when an older preferences blob is loaded.

## Messaging contract

- [x] Define discriminated union of all webview→host requests and host→webview events — _file: `src/messaging/contract.ts`_
  - Every message has a `type` literal and a generated `id` for request/response correlation.
  - Implemented as `RequestMap`/`EventMap` interface dictionaries with `RequestPayload<T>` / `ResponsePayload<T>` / `EventPayload<E>` mapped types — Phases 2-8 extend each map with their own keys.
- [x] Implement host-side router in `HostingerWebviewProvider` — _file: `src/HostingerWebviewProvider.ts`_
  - Replaces the demo `switch` block from Phase 0 with `register(type, handler)` registry.
  - Adds `emit<E>(type, payload)` for unsolicited host→webview events. Sanitizes errors before posting back (never includes token).
- [x] Implement webview-side `host.request<TReq, TRes>(type, payload)` returning a Promise resolved by the matching response id — _file: `src/webview/lib/host.ts`_
  - Generates a `crypto.randomUUID()` correlation id per call; 30 s timeout with listener cleanup; rejects on `kind: "error"` envelope.
- [x] Implement webview-side `host.on(eventType, listener)` for unsolicited events from host (token cleared, prefs changed, polling tick) — _file: `src/webview/lib/host.ts`_
  - Acceptance: round-trip unit test: webview sends `ping`, host replies `pong`, promise resolves.
  - Implemented as `host.request("hasToken")` round-trip + four other correlation/error/timeout/event tests in `src/messaging/__tests__/contract.test.ts`.

## Design system primitives

All under `src/webview/lib/ui/` — single Svelte file per primitive.

- [x] `Button.svelte` — variants: `primary | secondary | ghost | danger`; size: `sm | md`; loading state with inline spinner (no global spinner per PRD §4.4)
- [x] `Card.svelte` — padded surface using `--vscode-editorWidget-background`
- [x] `Badge.svelte` — semantic variants: `neutral | success | warning | error | info`
- [x] `StatusDot.svelte` — colored dot for running/stopped/error/unknown
- [x] `Toast.svelte` + `toastStore.ts` — bottom-right stack of max 3, auto-dismiss for non-error after 4s (PRD §4.3)
- [x] `Skeleton.svelte` — pulsing placeholder, accepts width/height (PRD §4.4)
- [x] `Modal.svelte` — focus-trapped overlay; only used by Backup Restore and New Docker Project per PRD §4.2 exception
- [x] `EmptyState.svelte` — icon + heading + line + CTA (PRD §4.5)
- [x] `ConfirmInline.svelte` — wraps a destructive button; click 1 → "Are you sure? Yes / Cancel"; auto-cancels after 8s (PRD §4.2)
  - Acceptance: visual smoke test on a stub page exercises every primitive.
  - **Deferred:** no dedicated demo page yet — primitives compile and `svelte-check` passes, but they're not visually exercised in isolation. Add a `/dev/components` route in Phase 9 (polish) or sooner if needed during Phase 2 onboarding development.

## Theming

- [x] Map Tailwind theme to VS Code CSS variables in `src/webview/index.css` — _file: `src/webview/index.css`_
  - `--color-bg: var(--vscode-editor-background)`, `--color-fg: var(--vscode-editor-foreground)`, etc.
  - Resolves PRD §8 Open Q4 in favor of native theming.
  - Acceptance: switching VS Code light↔dark theme updates the panel without reload.
  - Extended the existing scaffold's `@theme` block with semantic tokens: `--color-vscode-success`, `-warning`, `-info`, `-progress`, each with chained `var(...)` fallbacks (testing-iconPassed → charts-green → hex).

## Layout shell & routing

- [x] Rebuild `src/webview/App.svelte` — top nav (logo + tab list slot + VPS-selector slot), route outlet, persistent toast region — _file: `src/webview/App.svelte`_
  - VPS-selector slot is a `<div data-slot="vps-selector">` placeholder; Phase 4 fills it.
- [x] Add routes — _file: `src/webview/routes.ts`_
  - `/onboarding`, `/` (Overview), `/docker`, `/deploy`, `/firewall`, `/snapshots`, `/settings`
  - Each route mounts an empty placeholder `<Card>Coming soon — Phase N</Card>` that gets replaced by the appropriate phase.
  - Placeholders live under `src/webview/pages/placeholders/*Placeholder.svelte` (no `Card` wrapper yet — bare heading + body; Phase 2-8 will replace each file outright).
- [x] Auth guard — if `TokenStore.has() === false`, any non-`/onboarding` route redirects to `/onboarding` — _file: `src/webview/App.svelte`_
  - Also subscribes to `host.on("tokenChanged", ...)` so disconnect bounces back to onboarding live.
- [x] Tab nav respects active route via `svelte-spa-router` `link` action with `active` class.
  - Uses `router.location` (svelte-spa-router v5 reactive state) — the named `location` store export was removed in v5.

## Polling abstraction

- [x] `pollable(key, fetcher, intervalMs)` — _file: `src/webview/lib/poll.ts`_
  - Pauses when `document.hidden` is true.
  - Single in-flight per key (drops overlapping ticks).
  - Subscribes to `Preferences.pollingIntervalMs`.
  - Returns a Svelte store `{ data, error, loading, lastTickAt }`.
  - Acceptance: unit test confirms only one fetch happens when the tick interval is shorter than the fetch latency.
  - Visibility source and `onVisibilityChange` registration are injectable (default to `document`) so the unit test runs in the extension-host Node context without DOM. Live `Preferences.pollingIntervalMs` subscription is wired via `host.on("preferenceChanged", ...)` once Phase 4 emits those events.

## Tests

- [x] `HostingerClient` retry/backoff with mocked fetch — _file: `src/api/__tests__/HostingerClient.test.ts`_
  - Covers: happy 200, 429→200, three 500s exhaust retries, 401 non-retryable (no retry), `Retry-After` honored, 204 No Content.
- [x] `TokenStore` round-trip in a mocked `SecretStorage` — _file: `src/auth/__tests__/TokenStore.test.ts`_
  - Covers: set/get/clear/has, validate success path, validate failure (asserts token never leaks into error).
- [x] Messaging request/response correlation — _file: `src/messaging/__tests__/contract.test.ts`_
  - Covers: response resolution, error rejection, timeout, event subscribe/unsubscribe, ignores response with unknown id.
- [x] `pollable` pause-on-hidden + single-in-flight — _file: `src/webview/lib/__tests__/poll.test.ts`_
  - Covers: interval ticks, hidden suppression, single-in-flight overlap drop, `refresh()` out-of-cycle, `dispose()` stops further ticks.
- [x] **Tooling:** added `tsconfig.tests.json` (`module: NodeNext`, `verbatimModuleSyntax: false`) so the Mocha test runtime can `require()` the compiled `out/` files; widened `.vscode-test.mjs` to `out/**/*.test.js` to pick up `__tests__/` paths in addition to `out/test/`.

## Verification

1. [x] `npm run check-types` and `npm run lint` clean. — 233 files, 0 errors, 0 warnings on both.
2. [x] `npm test` passes. — 22 passing, 0 failing (343 ms).
3. [ ] F5 → panel opens, lands on `/onboarding` (no token yet). — manual smoke; build artifacts ready in `dist/`.
4. [ ] Manually inject a fake token via the dev tools `vscode.postMessage` and confirm the auth guard releases — every tab route renders its "Coming soon" placeholder. — manual smoke.
5. [ ] Toggle VS Code theme — colors follow. — manual smoke.
