# Phase 0 — Project Foundation & Rebrand

> **Goal:** Strip the `svelte-starter` scaffold of its demo identity and stand up the Hostinger VPS Manager skeleton with correct names, commands, and metadata.
> **PRD sections:** §2.1
> **Depends on:** nothing
> **Estimated effort:** 0.5 day

---

## Package metadata

- [x] Update `package.json` — `name: "hostinger-vps-manager"`, `displayName: "Hostinger VPS Manager"`, `description` from PRD §1, `version: "0.1.0"` (pre-release), `publisher: <to-be-set>`, `repository`, `bugs`, `homepage`, `license: "MIT"` — _file: `package.json`_
  - Acceptance: `npm pack --dry-run` reports the new name; `vsce ls` (if installed) shows the renamed manifest.
  - **Note:** `publisher`, `repository`, `bugs`, `homepage` deferred to Phase 10 (marketplace polish).
- [x] Set marketplace categories to `["Other", "Azure"]` → reduce to just `["Other"]` for v0.1; revisit in Phase 10 — _file: `package.json`_
- [x] Set `engines.vscode` to `^1.85.0` per PRD §2.1 (downgrade from current `^1.106.1` so older VS Code installs aren't excluded) — _file: `package.json`_
  - Acceptance: PRD §2.1 minimum honored; `vsce` does not warn.

## Commands

- [x] Replace `contributes.commands` with the v1.0 set — _file: `package.json`_
  - `hostinger-vps.open` → "Hostinger: Open VPS Manager"
  - `hostinger-vps.connect` → "Hostinger: Connect Account"
  - `hostinger-vps.disconnect` → "Hostinger: Disconnect Account"
  - Acceptance: all three appear in Command Palette filtered by "Hostinger".
- [ ] Set `activationEvents` to `["onCommand:hostinger-vps.open", "onCommand:hostinger-vps.connect", "onStartupFinished"]` — _file: `package.json`_
  - `onStartupFinished` is required so the status bar chip (PRD §4.6) can register without the user opening the panel first.
  - **Status:** partially done — only the two `onCommand:*` entries set. `onStartupFinished` deferred until Phase 4 (status bar chip) to avoid eager activation overhead while the extension has no startup-time work.

## Source rename

- [x] Replace command id `svelte-starter.openSvelteView` with `hostinger-vps.open` and register all three commands — _file: `src/extension.ts`_
- [x] Rename class `SvelteWebviewProvider` → `HostingerWebviewProvider`; rename file `src/WebviewProvider.ts` → `src/HostingerWebviewProvider.ts` — _files: `src/extension.ts`, `src/HostingerWebviewProvider.ts`_
- [x] Update panel id `"svelteView"` → `"hostinger-vps.panel"` and title `"Svelte App"` → `"Hostinger VPS Manager"` — _file: `src/HostingerWebviewProvider.ts`_
- [x] Delete demo pages and routes — _files: `src/webview/pages/NotificationPage.svelte`, `src/webview/pages/DirectoryListPage.svelte`, `src/webview/App.svelte`_
  - Acceptance: `grep -ri "Notification\|DirectoryList" src` returns no matches.
- [x] Remove demo message handlers `showNotification`, `getDirectoryContents` — _file: `src/HostingerWebviewProvider.ts`_

## Documentation

- [x] Replace `README.md` with a stub for the product (full marketplace README lands in Phase 10) — _file: `README.md`_
  - Include: product name, one-line summary from PRD §1, "In active development" note, link to `PRD.md`, link to `plan/`.
- [x] Reset `CHANGELOG.md` with `## [Unreleased] — Initial scaffolding` entry — _file: `CHANGELOG.md`_
- [x] Add `LICENSE` (MIT, per PRD §2.1) — _file: `LICENSE`_

## Tests

- [ ] Replace the demo test file at `src/test/extension.test.ts` (if present) with a stub that asserts the extension activates and registers the three commands — _file: `src/test/extension.test.ts`_
  - **Status:** placeholder Mocha test left in place (still passes). Phase 1 added 22 unit tests covering `HostingerClient`, `TokenStore`, messaging contract, and `pollable` — the explicit activation/commands assertion is still pending.

## Verification

1. `npm install` (clean) succeeds.
2. `npm run check-types` and `npm run lint` both pass.
3. `npm run compile` produces `dist/extension.js` and `dist/webview.js`.
4. Press F5 → Extension Development Host opens → Command Palette → all three "Hostinger:" commands appear → `Hostinger: Open VPS Manager` opens an empty panel titled "Hostinger VPS Manager".
5. `git grep -i svelte-starter` returns zero hits.
