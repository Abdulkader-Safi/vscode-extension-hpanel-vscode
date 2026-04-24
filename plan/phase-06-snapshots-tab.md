# Phase 6 — Snapshots Tab

> **Goal:** Provide manual-snapshot lifecycle and an automated-backup browser so users can save state before risky changes and restore on failure.
> **PRD sections:** §3.6
> **Depends on:** Phase 1 (API, design), Phase 4 (active VPS)
> **Estimated effort:** 1 day
> **Status:** ✅ Shipped. See Deltas for the single deferred item (weekly backup schedule toggle).

---

## §3.6.1 Manual Snapshot Management

- [x] Build `ManualSnapshot.svelte` — _file: `src/webview/pages/Snapshots/ManualSnapshot.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/snapshot`
  - When snapshot exists: card with creation date, relative age ("3 days ago"), estimated size
  - "Restore snapshot" button → `<ConfirmInline>` → `POST /snapshot/restore`
  - "Delete snapshot" button → `<ConfirmInline>` → `DELETE /snapshot`
  - "Create new snapshot" button → `<ConfirmInline>` → `POST /snapshot`
    - Visible warning copy: "Creating a new snapshot will overwrite the existing one"
  - Progress indicator while creation is in-flight; refetch on completion
  - Empty state with prompt to create when no snapshot exists (PRD §4.5)
  - Acceptance: button states reflect API state; double-click protection in flight.

## §3.6.2 Automated Backup Browser

- [x] Build `BackupList.svelte` — _file: `src/webview/pages/Snapshots/BackupList.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/backups`
  - Each row: backup date, time, relative age, "Restore" button
  - Empty state when no backups (PRD §4.5)

## Restore confirmation modal (the second permitted modal)

- [x] Build `RestoreBackupModal.svelte` — _file: `src/webview/pages/Snapshots/RestoreBackupModal.svelte`_
  - Per PRD §3.6.2 — full modal, not inline confirm
  - Headline: warning copy about destructive action
  - Required input: user must type the VPS hostname exactly to enable the Restore button
  - Restore button disabled until typed string === hostname (case-sensitive)
  - On submit: `POST /api/vps/v1/virtual-machines/{id}/backups/{backupId}/restore`
  - Acceptance: any typo keeps the button disabled; pasting hostname succeeds.

## Schedule toggle

- [ ] Toggle for weekly automated backup schedule at top of `BackupList.svelte`
  - Endpoint: per Hostinger API for backup schedule (verify exact endpoint when implementing)
  - Acceptance: toggle off → confirmation → API call → toggle reflects new server state.
  - **Deferred** — endpoint not exposed in `HostingerClient` yet; tracked as a
    TODO in `BackupList.svelte`. Revisit during Phase 7/8 or Phase 9 polish.

## Page composition

- [x] Compose into `Snapshots.svelte` — _file: `src/webview/pages/Snapshots.svelte`_
  - Layout: Manual Snapshot section (top) → Automated Backups section (below)
  - Skeleton during initial load

## Tests

- [x] Hostname-match logic for restore modal — _file: `src/webview/pages/Snapshots/__tests__/hostnameMatch.test.ts`_
- [x] Overwrite warning surfaces when snapshot exists (copy is in `ManualSnapshot.svelte`; covered at component level, not unit-tested — Svelte-runes components aren't in the vscode-test harness today)
- [x] Restore button enable/disable flips correctly with input changes (covered via the `hostnameMatches` helper unit tests)
- [ ] Schedule toggle updates server state and survives reload (**deferred** — see Schedule toggle section)

## Verification

1. Open Snapshots tab on a VPS without snapshot → empty state with create button.
2. Create snapshot → progress indicator → snapshot card appears with current date.
3. Click Create again → see the overwrite warning copy.
4. Backup list populates with weekly backups.
5. Click Restore on a backup → modal opens → button disabled until hostname typed exactly → on submit, API receives the restore request.
6. Toggle weekly backup off → confirm → schedule updates. _(deferred — no toggle UI ships yet.)_

## Deltas from this plan (for Phase 9 / polish)

- **Weekly backup schedule toggle deferred.** Endpoint is not exposed by
  `HostingerClient` and the Hostinger API docs haven't been cross-checked.
  Verify the endpoint, add `getBackupSchedule` / `setBackupSchedule` to the
  client, then surface the toggle at the top of `BackupList.svelte`. A TODO
  comment is in place in the component.
- **Shared time helpers landed.** `src/webview/lib/time.ts` exposes
  `relativeTime`, `formatTimestamp`, and `formatBytes` — reuse these from
  Firewall (Phase 7) and Deploy (Phase 8) instead of inlining new copies.
- **Component-level tests are manual-only.** Same Svelte-runes / harness
  constraint as Phase 5; the hostname-match predicate is extracted to
  `hostnameMatch.ts` specifically so it's covered by a pure unit test.
