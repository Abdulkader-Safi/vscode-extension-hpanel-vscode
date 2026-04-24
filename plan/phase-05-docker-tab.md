# Phase 5 — Docker Tab

> **Goal:** Manage all Docker Compose projects on the active VPS — view, control, log, create — without SSH or browser.
> **PRD sections:** §3.3
> **Depends on:** Phase 1 (API client, polling, design system), Phase 4 (active VPS selector + defaults)
> **Estimated effort:** 2 days
> **Status:** ✅ Shipped in commit `d523dcb`. See bottom for the small deltas from this plan.

---

## §3.3.1 Project Overview Summary

- [x] Build `ProjectSummary.svelte` — _file: `src/webview/pages/Docker/ProjectSummary.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/docker`
  - Total projects, total containers, count of unhealthy/stopped containers
  - Search/filter input filters the project list below by name
  - Acceptance: filter input narrows the list in real-time without API call.

## §3.3.2 Docker Compose Project List

- [x] Build `ProjectRow.svelte` (collapsed state) — _file: `src/webview/pages/Docker/ProjectRow.svelte`_
  - Project name, overall status badge, container count, exposed-port pills
  - Hover reveals action icon buttons (Start, Stop, Restart, Update, Logs, Delete)
- [x] Expanded state lists containers — _file: `src/webview/pages/Docker/ProjectRow.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/docker/{name}/containers`
  - Per container row: name, image and tag, status indicator, port mappings, current CPU + RAM usage
  - "View logs" link per container row (opens Log Viewer scoped to that container)

## §3.3.3 Project Actions

- [x] Hook actions to API — _actions inlined in `ProjectRow.svelte` (no separate `projectActions.ts`) — see "Deltas" below._
  - Start: `POST .../docker/{name}/start`
  - Stop: `POST .../docker/{name}/stop`
  - Restart: `POST .../docker/{name}/restart`
  - Update: `POST .../docker/{name}/update`
  - Delete: `DELETE .../docker/{name}/down` — wrapped in `<ConfirmInline>` (PRD §3.3.3 — irreversible)
- [x] All actions trigger a project-specific status refetch on completion
  - Acceptance: clicking Stop on a running project shows the stopped state within one polling cycle.

## §3.3.4 Log Viewer (split-pane)

- [x] Build `LogViewer.svelte` opening inline below the project list — _file: `src/webview/pages/Docker/LogViewer.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/docker/{name}/logs`
  - Renders last 300 lines (PRD §6.1 cap)
  - Each line prefixed with the service name, color-coded per service
  - Auto-scroll toggle (default on); turning off freezes the view at the user's scroll position
  - Close button in panel header
  - "Refresh" button (manual refresh model — Open Q3 deferred from streaming for v1.0)
  - Acceptance: opening logs does not navigate away from the project list; toggling auto-scroll behaves as described.

## §3.3.5 New Project Deployment (modal)

- [x] Build `NewProjectModal.svelte` — _file: `src/webview/pages/Docker/NewProjectModal.svelte`_
  - One of the two permitted modals per PRD §4.2 exception
  - Project name input (validated via `isValidDockerProjectName`: letters/numbers/dash/underscore, must start with alphanumeric, ≤63 chars — note: more permissive than the originally-specced `/^[a-zA-Z0-9_-]+$/` 3–32, see Deltas)
  - Input methods:
    - [x] Paste raw `docker-compose.yml` content (textarea, monospace)
    - [ ] URL (GitHub repo or direct raw `.yml` URL) — **deferred**, see Deltas
  - Expandable env-vars section: list of `key/value` rows with add/remove
  - Submit: `POST /api/vps/v1/virtual-machines/{id}/docker`
  - Env vars sent as part of the request body — never written to disk
  - On success, modal closes and the new project appears in the list immediately
  - Acceptance: invalid name disables submit; submit failure shows inline error inside modal, doesn't close.

## Page composition

- [x] Compose into `Docker.svelte` — _file: `src/webview/pages/Docker.svelte`_
  - Layout: summary bar → project list (accordion) → log viewer split-pane (when active)
  - Empty state when no projects exist (PRD §4.5)
  - Skeleton during initial load
  - Bonus: "Docker Manager OS template not installed" hint card when the API returns `VPS:2044`.

## Tests

- [x] Project name validation — _file: `src/webview/lib/__tests__/dockerName.test.ts`_
- [x] Action confirm flow → API call → refetch — covered at handler level in _`src/messaging/__tests__/docker.handlers.test.ts`_ (verifies `dockerAction` routes to the right endpoint; refetch behavior exercised manually — Svelte 5 runes components are not in the vscode-test harness today)
- [ ] Log viewer auto-scroll toggle — not unit-tested (same Svelte-runes constraint); manually verified in step 3 of Verification
- [ ] Env-var sanitation: keys conform to `/^[A-Z_][A-Z0-9_]*$/` — **not enforced** (see Deltas)
- [ ] Filter input narrows the list correctly — not unit-tested; manually verified

## Verification

1. Docker tab lists all projects on the active VPS.
2. Hover any project → action icons reveal; click Restart → status updates within one cycle.
3. Open logs for a project → split-pane appears below; service prefixes visible; scrolling pauses auto-scroll.
4. Create a new project from a paste of valid `docker-compose.yml` → appears in list.
5. Delete a project → confirm → project disappears from list.
6. Switch active VPS → list refetches for the new VPS.

## Deltas from this plan (for Phase 9 / polish)

- **No separate `projectActions.ts` module.** Action calls are inlined in
  `ProjectRow.svelte`. Extracting them is low-value today since they're only
  used in one place; revisit if Deploy (Phase 8) starts reusing them.
- **NewProjectModal URL input deferred.** Only the paste-YAML input method
  ships in v1.0. Hostinger's create-project endpoint accepts compose text
  directly, so the URL mode is purely ergonomic — defer to Phase 9.
- **Project-name validator is more permissive than the PRD regex.** Ships as
  `isValidDockerProjectName` (≤63 chars, must start alnum, letters/numbers/
  dash/underscore) rather than the literal `/^[a-zA-Z0-9_-]+$/` 3–32. The
  looser spec matches Docker Compose's own project-name rules; tighten in
  Phase 9 if the API rejects anything Docker accepts.
- **Env-var key sanitation not enforced in the modal.** Users can type any
  key. Add validation + a unit test in Phase 9 (or the first time the API
  returns a bad-key error).
- **Component-level tests (filter, auto-scroll, env-var) are manual-only.**
  Svelte 5 runes don't play with the current vscode-test harness. Tracked
  for Phase 9 polish — options are adding a jsdom + `@testing-library/svelte`
  setup or migrating tests to `vitest`.
