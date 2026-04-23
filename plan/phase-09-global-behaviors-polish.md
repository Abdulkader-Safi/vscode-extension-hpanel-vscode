# Phase 9 — Global Behaviors & Polish

> **Goal:** Audit the global PRD §4 patterns implemented inline across phases, fix gaps, and complete accessibility, theming, and error-boundary work.
> **PRD sections:** §4 (all subsections)
> **Depends on:** Phases 0–8
> **Estimated effort:** 1.5 days

---

## §4.1 VPS Selector audit

- [ ] Confirm the dropdown built in Phase 4 lives in the persistent top nav across all routes — _file: `src/webview/App.svelte`_
- [ ] Status dot in dropdown updates in real time during polling cycles
- [ ] Switching VPS clears all cached data (per `Preferences.activeVpsId` change → all `pollable()` keys keyed by VPS id are invalidated)
  - Acceptance: while on Docker tab, switch VPS → list refetches with skeleton, no stale data flash.

## §4.2 Inline two-step confirmation audit

- [ ] Audit every destructive button across the extension — _grep: `<ConfirmInline`_
  - Required on: VPS Restart/Stop/Recovery (Phase 3), Docker Delete (Phase 5), Snapshot Create/Restore/Delete (Phase 6), Firewall Rule/Firewall Delete (Phase 7), Disconnect/Reset Settings (Phase 4), SSH key delete (Phase 4)
  - Acceptance: `grep` shows every destructive action wrapped.
- [ ] 8s auto-cancel timer behaves correctly under repeated clicks (resets per re-arming)
- [ ] Verify the only modal exceptions are: Backup Restore (Phase 6), New Docker Project (Phase 5)

## §4.3 Toast notification audit

- [ ] Three semantic types: success, error, info, warning (PRD lists 3 + warning makes 4 — confirm exact list)
- [ ] Success/info auto-dismiss at 4s
- [ ] Error toasts persist until explicitly dismissed
- [ ] Max 3 simultaneous; newer toasts push existing ones up; oldest dropped when capacity exceeded
- [ ] All async actions across Phases 2–8 fire a result toast (success or error)
  - Acceptance: trigger 5 errors in succession → 3 visible, oldest 2 dropped silently.

## §4.4 Loading skeleton audit

- [ ] Every async content area shows a `<Skeleton>` placeholder during initial load
- [ ] Spinners only inside buttons during async button actions — never in content areas
- [ ] Pulsing animation works in both light and dark themes (uses `--vscode-*` variables)
  - Acceptance: grep audit confirms no full-page spinners outside button contexts.

## §4.5 Empty state audit

- [ ] Each location has the four-element empty state (icon + heading + line + CTA):
  - Docker (no projects)
  - Firewall (no rules)
  - Snapshots (no snapshot, no backups)
  - Actions log (no history)
  - Settings → SSH (no local `.pub` files)
  - Settings → VPS list (no VPS — rare but possible new account)
  - Deploy (no `.hostinger.json` → wizard CTA, already covered)

## §4.6 Status bar chip polish

- [ ] Normal state: colored status dot + VPS hostname + current CPU%
- [ ] Alert state: warning-colored background when any threshold tripped
- [ ] Click chip: opens panel; if panel already open, focuses it
- [ ] Snooze (Settings) suppresses alert color but not the chip itself
  - Acceptance: trip CPU threshold while chip enabled → background flips amber within one tick.

## §4.7 Multi-VPS — cache invalidation audit

- [ ] Every `pollable()` key includes the active VPS id so switching wipes the cache key
- [ ] Pages do not show stale data from the previous VPS even for one frame
- [ ] Status bar chip updates to the new VPS within 1 polling cycle

## §4.8 Workspace-aware deploy audit

- [ ] `.hostinger.json` is detected on workspace folder change (via `vscode.workspace.onDidChangeWorkspaceFolders`)
- [ ] Reading `.hostinger.json` while the user has it open in the editor → reflects unsaved or saved state correctly (use `vscode.workspace.fs` not `fs`)
- [ ] Different workspace folders can hold different configs (Phase 8 already; verify here)

## Accessibility pass

- [ ] Tab order is logical across every route
- [ ] Visible focus rings on all interactive elements (`outline: 2px solid var(--vscode-focusBorder)`)
- [ ] ARIA roles: `tablist`, `tab`, `tabpanel` on the top nav; `dialog` + `aria-modal="true"` on the two modals; `alert` on out-of-sync banner
- [ ] Keyboard activation parity: Enter/Space activates all buttons; Esc closes modals
- [ ] Screen-reader labels on icon-only buttons (Docker action icons, Firewall edit/delete)
- [ ] Color is not the sole differentiator — status uses dot + label
  - Acceptance: complete a full deploy using keyboard only.

## Theme pass (resolves Open Q4)

- [ ] Verify rendering against: Default Dark+, Default Light+, High Contrast Dark, High Contrast Light, Solarized Dark
- [ ] No hard-coded colors anywhere outside the theme map in `index.css`
  - Acceptance: grep `#[0-9a-f]{6}` outside `index.css` returns no matches.

## Error boundary

- [ ] Root-level error boundary in webview catches render failures — _file: `src/webview/App.svelte`_
  - Shows recovery toast: "Something went wrong — Reload"
  - Reload button posts a `reloadWebview` host message that disposes and recreates the panel

## Tests

- [ ] Confirm timer auto-cancels at 8s
- [ ] Toast stack overflow drops the oldest
- [ ] Theme variable swap on `vscode.window.onDidChangeActiveColorTheme`
- [ ] Keyboard nav smoke test (manual + scripted via accessibility tree assertion)
- [ ] Error boundary catches a thrown render and shows recovery UI

## Verification

1. Cycle every VS Code theme — no broken styling.
2. Tab through every interactive element on every route — focus is always visible and logical.
3. Trigger 5 simultaneous toasts — only 3 visible.
4. Switch VPS while on Docker → no stale flash.
5. Throw a deliberate render error in dev → recovery toast appears, click Reload → panel restored.
6. Use the extension entirely keyboard-only for one full session: connect → view metrics → restart Docker project → take snapshot → add firewall rule → deploy.
