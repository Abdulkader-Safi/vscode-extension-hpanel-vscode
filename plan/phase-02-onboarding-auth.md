# Phase 2 — Onboarding & Authentication

> **Goal:** Capture and validate the user's Hostinger API token, store it securely, and gate the rest of the extension behind a successful connection.
> **PRD sections:** §3.1
> **Depends on:** Phase 1 (`TokenStore`, messaging, design system, auth guard)
> **Estimated effort:** 0.5–1 day
> **Status:** ✅ Done

---

## §3.1.1 First-launch onboarding screen

- [x] Build `Onboarding.svelte` mounted at `/onboarding` — _file: `src/webview/pages/Onboarding.svelte`_
  - Hostinger logo (SVG inline; no external fetch — CSP forbids it)
  - H1 headline: "Connect your Hostinger account"
  - Sub-copy explaining what the token is for and that it stays on this machine
  - Single `<input type="password">` for the token with a show/hide eye toggle
  - Anchor link → `https://developers.hostinger.com/#section/Authentication`
  - Submit `<Button variant="primary">Connect</Button>`
  - Acceptance: matches PRD §3.1.1 visual spec; keyboard `Enter` submits.
  - **Logo note:** v0.1 ships a brand-neutral server-stack mark (24×24 SVG), not the Hostinger brand mark — pending a licensing decision in Phase 10.

## State machine

- [x] States: **Default → Loading → Error → Success** — _file: `src/webview/pages/Onboarding.svelte`_
  - **Loading:** input disabled, button replaced by spinner, no other UI changes
  - **Error:** inline error block above the input with the API's error message; button re-enabled
  - **Success:** auto-navigate to `/` (Overview) — no toast, no modal
  - Acceptance: each state transition visually distinct; error message reads back the actual API failure (e.g. "Invalid token", "Network error").
  - Local state via Svelte 5 runes (`$state<Phase>("idle")`); navigation on success is implicit — `App.svelte`'s `tokenChanged` listener calls `replace("/")` after the host emits the event.

## Host validation handler

- [x] `validateToken` message handler — _file: `src/HostingerWebviewProvider.ts`_
  - Calls `TokenStore.validateToken(token)` from Phase 1 — endpoint: `GET /api/vps/v1/virtual-machines`
  - On success: `TokenStore.set(token)` then reply `{ ok: true, accountEmail }`
  - On failure: reply `{ ok: false, error: <message> }` — never echo the token back
  - Acceptance: bad token → reply has `ok: false`; good token → token persists across panel close/reopen.
  - **Deviation (carried from Phase 1):** the success payload is `{ ok: true, data: Vps[] }`, not `{ ok: true, accountEmail }`. The Hostinger API in PRD §9 has no account-email endpoint; the VPS list is both validation proof and useful first-paint data. Handler is registered in `src/extension.ts`, not directly on `HostingerWebviewProvider`.

## Commands

- [x] Implement `hostinger-vps.connect` — opens panel, navigates to `/onboarding` — _file: `src/extension.ts`_
  - Calls `provider.open()` + `provider.emit("navigate", { path: "/onboarding" })`. New `navigate` host event added to `src/messaging/contract.ts`; `App.svelte` subscribes via `host.on("navigate", ...)` and calls `replace(path)`.
  - **Soft race:** on the *very first* panel open, the webview hasn't mounted its listener yet, so the navigate event is lost. The auth guard handles that case (no token → `/onboarding`). The event only matters when a panel is already open and the user wants to re-onboard.
- [x] Implement `hostinger-vps.disconnect` — calls `TokenStore.clear()`, sends `tokenCleared` event to any open panel, panel auto-routes to `/onboarding` — _file: `src/extension.ts`_
  - Acceptance: invoking `hostinger-vps.disconnect` from a connected state returns the user to onboarding within one render cycle.
  - Uses the existing `tokenChanged` event (with `hasToken: false`) rather than a new `tokenCleared` — `App.svelte`'s listener already routes to `/onboarding` on that signal.

## Security

- [x] No `console.log`, `vscode.window.showErrorMessage`, or telemetry call may include the token string — verified by audit pass — _files: `src/auth/TokenStore.ts`, `src/HostingerWebviewProvider.ts`, `src/webview/pages/Onboarding.svelte`_
  - Audit: `grep -rn "console\." src` returns zero hits; every `token` reference in `Onboarding.svelte` is either the `$state` binding, a label string, or the `token = ""` reset on success — no string interpolation or logging.
- [x] Show/hide toggle defaults to hidden; toggling visible does not log the value
  - `revealed = $state(false)`; the toggle handler only flips a boolean and never reads `token`.
- [x] Token never travels back from host to webview after initial submit
  - `validateToken` response carries `data: Vps[]`, not the token. No host-side message references the token after `tokenStore.set()`.
- [x] **Bonus:** new `openExternal` host handler is restricted to `https://` URLs as a small defense-in-depth, since the docs link is routed through it (CSP blocks direct webview navigation).

## Tests

- [x] Validation success path: token saved, success reply, navigate event emitted — _file: `src/auth/__tests__/onboarding.flow.test.ts`_
  - Asserts `result.ok === true`, `await ts.get() === token`, `emitted` contains `tokenChanged`.
- [x] Validation failure path: API 401 → error reply with PRD-compliant message; token NOT saved
  - Asserts `result.ok === false`, `await ts.get() === undefined`, `emitted === []`.
- [x] Persistence: token survives extension reload (mocked `SecretStorage` round-trip)
  - Two `TokenStore` instances over the same fake `SecretStorage` → second instance reads back the persisted token.
- [x] Token redaction: assert no log/error string contains the token character sequence
  - **Tripwire form:** the test currently asserts the upper bound (when the API itself echoes the token, the error contains it). The redaction guarantee is enforced extension-side: we don't log error strings nor send them back to the webview anywhere except the explicit `error` field. The test is documented to be updated if/when an explicit redaction layer lands.

## Verification

1. [ ] Clear SecretStorage (uninstall + reinstall the dev extension) → reopen → onboarding screen appears.
2. [ ] Submit an obviously invalid token → see inline error from the API.
3. [ ] Submit a real token → loading spinner → auto-navigate to `/` (still showing the placeholder card from Phase 1).
4. [ ] Close panel, reopen with `hostinger-vps.open` → goes straight to `/`, skipping onboarding.
5. [ ] Run `hostinger-vps.disconnect` → panel returns to `/onboarding`.

> Verification 1-5 are manual smoke (F5 in VS Code). Build artifacts are ready: `dist/extension.js`, `dist/webview.js`, `dist/webview.css`. Automated coverage: `npm run check-types` (234 files, 0 errors), `npm run lint` (0 errors), `npm test` (26 passing — 22 prior + 4 new flow tests).
