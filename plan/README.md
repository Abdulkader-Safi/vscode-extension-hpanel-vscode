# Hostinger VPS Manager — Build Plan

This folder is the working checklist for building **Hostinger VPS Manager v1.0**
as specified in [`../PRD.md`](../PRD.md). Each phase file is an actionable todo
list with PRD references, Hostinger API endpoints, target file paths, and
acceptance criteria per item.

## How to use

- Work phases in numeric order — each one declares its dependencies up top.
- Tick checkboxes as you complete items: change `- [ ]` to `- [x]`.
- Every phase ends with **Tests** and **Verification** sections — do not move
  on until both pass.
- If a decision conflicts with the PRD, the PRD wins. If you change scope,
  amend the PRD first, then update the affected phase file.

## Phases

| #   | File                                                                         | Focus                                    | PRD refs         | Status     |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------- | ---------------- | ---------- |
| 0   | [phase-00-foundation.md](./phase-00-foundation.md)                           | Rebrand scaffold, command/panel ids      | §2.1             | ✅ Done    |
| 1   | [phase-01-core-architecture.md](./phase-01-core-architecture.md)             | API client, messaging, design system     | §6               | ✅ Done    |
| 2   | [phase-02-onboarding-auth.md](./phase-02-onboarding-auth.md)                 | Token capture, validation, SecretStorage | §3.1             | ✅ Done    |
| 3   | [phase-03-overview-tab.md](./phase-03-overview-tab.md)                       | Server identity, metrics, actions, SSH   | §3.2             | ⬜ Pending |
| 4   | [phase-04-settings-tab.md](./phase-04-settings-tab.md)                       | Connection, VPS, polling, keys, danger   | §3.7, §4.1, §4.6 | ⬜ Pending |
| 5   | [phase-05-docker-tab.md](./phase-05-docker-tab.md)                           | Compose projects, containers, logs       | §3.3             | ⬜ Pending |
| 6   | [phase-06-snapshots-tab.md](./phase-06-snapshots-tab.md)                     | Manual snapshots, automated backups      | §3.6             | ⬜ Pending |
| 7   | [phase-07-firewall-tab.md](./phase-07-firewall-tab.md)                       | Firewalls, rules, sync                   | §3.5             | ⬜ Pending |
| 8   | [phase-08-deploy-tab.md](./phase-08-deploy-tab.md)                           | One-click deploy, wizard, pipeline       | §3.4             | ⬜ Pending |
| 9   | [phase-09-global-behaviors-polish.md](./phase-09-global-behaviors-polish.md) | Global patterns, a11y, theming           | §4               | ⬜ Pending |
| 10  | [phase-10-release-marketplace.md](./phase-10-release-marketplace.md)         | Packaging, marketplace, launch           | §2.1, §7         | ⬜ Pending |

¹ Phase 0: `onStartupFinished` activation event + activation/commands test stub deferred to Phase 4 / Phase 9 respectively (see file for notes).
² Phase 1: visual smoke page for design-system primitives deferred (will land alongside a `/dev/components` route when needed). Two minor deviations documented inline.

**Automated state at HEAD:** `check-types` 234 files / 0 errors, `lint` 0 errors, `npm test` **26 passing**, `npm run package` produces `dist/extension.js` (11K) + `dist/webview.js` (~70K) + `dist/webview.css` (~20K).

## Tab order rationale

The tab phases are sequenced **value-driven**, not in PRD section order:

`Auth → Overview → Settings → Docker → Snapshots → Firewall → Deploy`

- **Settings before Docker** — the persistent VPS selector (PRD §4.1) lives in
  the top nav and is powered by Settings data; building it first means every
  later tab plugs into a working selector.
- **Snapshots before Deploy** — Deploy can optionally auto-create a snapshot
  pre-deploy (PRD §3.4.2) and surfaces a restore-snapshot recovery path on
  failure (PRD §3.4.5). Building snapshots first means Deploy can compose them.
- **Deploy last** — most complex tab, depends on the most surfaces.

## Open Questions resolved

The PRD §8 Open Questions are resolved as follows:

| Q   | Topic                 | v1.0 decision                                                         | Phase |
| --- | --------------------- | --------------------------------------------------------------------- | ----- |
| 1   | Multi-account         | Single token only — multi-account deferred                            | 10    |
| 2   | Deploy to shared host | Out of scope — VPS only                                               | 8     |
| 3   | Live log streaming    | Manual refresh — streaming deferred                                   | 5     |
| 4   | Theming               | Native VS Code theme via `--vscode-*` CSS vars                        | 1, 9  |
| 5   | Multi deploy targets  | Single target per workspace                                           | 8     |
| 6   | Telemetry             | Off by default, opt-in only, gated by `vscode.env.isTelemetryEnabled` | 10    |

## Reference

- Hostinger API docs: https://developers.hostinger.com/#description/introduction
- VS Code Extension API: https://code.visualstudio.com/api
- Marketplace publishing: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
