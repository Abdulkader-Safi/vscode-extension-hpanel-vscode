# Phase 2 — Onboarding & Authentication

> **Goal:** Capture and validate the user's Hostinger API token, store it securely, and gate the rest of the extension behind a successful connection.
> **PRD sections:** §3.1
> **Depends on:** Phase 1 (`TokenStore`, messaging, design system, auth guard)
> **Estimated effort:** 0.5–1 day

---

## §3.1.1 First-launch onboarding screen

- [ ] Build `Onboarding.svelte` mounted at `/onboarding` — _file: `src/webview/pages/Onboarding.svelte`_
  - Hostinger logo (SVG inline; no external fetch — CSP forbids it)
  - H1 headline: "Connect your Hostinger account"
  - Sub-copy explaining what the token is for and that it stays on this machine
  - Single `<input type="password">` for the token with a show/hide eye toggle
  - Anchor link → `https://developers.hostinger.com/#section/Authentication`
  - Submit `<Button variant="primary">Connect</Button>`
  - Acceptance: matches PRD §3.1.1 visual spec; keyboard `Enter` submits.

## State machine

- [ ] States: **Default → Loading → Error → Success** — _file: `src/webview/pages/Onboarding.svelte`_
  - **Loading:** input disabled, button replaced by spinner, no other UI changes
  - **Error:** inline error block above the input with the API's error message; button re-enabled
  - **Success:** auto-navigate to `/` (Overview) — no toast, no modal
  - Acceptance: each state transition visually distinct; error message reads back the actual API failure (e.g. "Invalid token", "Network error").

## Host validation handler

- [ ] `validateToken` message handler — _file: `src/HostingerWebviewProvider.ts`_
  - Calls `TokenStore.validateToken(token)` from Phase 1 — endpoint: `GET /api/vps/v1/virtual-machines`
  - On success: `TokenStore.set(token)` then reply `{ ok: true, accountEmail }`
  - On failure: reply `{ ok: false, error: <message> }` — never echo the token back
  - Acceptance: bad token → reply has `ok: false`; good token → token persists across panel close/reopen.

## Commands

- [ ] Implement `hostinger-vps.connect` — opens panel, navigates to `/onboarding` — _file: `src/extension.ts`_
- [ ] Implement `hostinger-vps.disconnect` — calls `TokenStore.clear()`, sends `tokenCleared` event to any open panel, panel auto-routes to `/onboarding` — _file: `src/extension.ts`_
  - Acceptance: invoking `hostinger-vps.disconnect` from a connected state returns the user to onboarding within one render cycle.

## Security

- [ ] No `console.log`, `vscode.window.showErrorMessage`, or telemetry call may include the token string — verified by audit pass — _files: `src/auth/TokenStore.ts`, `src/HostingerWebviewProvider.ts`, `src/webview/pages/Onboarding.svelte`_
- [ ] Show/hide toggle defaults to hidden; toggling visible does not log the value
- [ ] Token never travels back from host to webview after initial submit

## Tests

- [ ] Validation success path: token saved, success reply, navigate event emitted — _file: `src/auth/__tests__/onboarding.flow.test.ts`_
- [ ] Validation failure path: API 401 → error reply with PRD-compliant message; token NOT saved
- [ ] Persistence: token survives extension reload (mocked `SecretStorage` round-trip)
- [ ] Token redaction: assert no log/error string contains the token character sequence

## Verification

1. Clear SecretStorage (uninstall + reinstall the dev extension) → reopen → onboarding screen appears.
2. Submit an obviously invalid token → see inline error from the API.
3. Submit a real token → loading spinner → auto-navigate to `/` (still showing the placeholder card from Phase 1).
4. Close panel, reopen with `hostinger-vps.open` → goes straight to `/`, skipping onboarding.
5. Run `hostinger-vps.disconnect` → panel returns to `/onboarding`.
