# Phase 5 — Docker Tab

> **Goal:** Manage all Docker Compose projects on the active VPS — view, control, log, create — without SSH or browser.
> **PRD sections:** §3.3
> **Depends on:** Phase 1 (API client, polling, design system), Phase 4 (active VPS selector + defaults)
> **Estimated effort:** 2 days

---

## §3.3.1 Project Overview Summary

- [ ] Build `ProjectSummary.svelte` — _file: `src/webview/pages/Docker/ProjectSummary.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/docker`
  - Total projects, total containers, count of unhealthy/stopped containers
  - Search/filter input filters the project list below by name
  - Acceptance: filter input narrows the list in real-time without API call.

## §3.3.2 Docker Compose Project List

- [ ] Build `ProjectRow.svelte` (collapsed state) — _file: `src/webview/pages/Docker/ProjectRow.svelte`_
  - Project name, overall status badge, container count, exposed-port pills
  - Hover reveals action icon buttons (Start, Stop, Restart, Update, Logs, Delete)
- [ ] Expanded state lists containers — _file: `src/webview/pages/Docker/ProjectRow.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/docker/{name}/containers`
  - Per container row: name, image and tag, status indicator, port mappings, current CPU + RAM usage
  - "View logs" link per container row (opens Log Viewer scoped to that container)

## §3.3.3 Project Actions

- [ ] Hook actions to API — _file: `src/webview/pages/Docker/projectActions.ts`_
  - Start: `POST .../docker/{name}/start`
  - Stop: `POST .../docker/{name}/stop`
  - Restart: `POST .../docker/{name}/restart`
  - Update: `POST .../docker/{name}/update`
  - Delete: `DELETE .../docker/{name}/down` — wrapped in `<ConfirmInline>` (PRD §3.3.3 — irreversible)
- [ ] All actions trigger a project-specific status refetch on completion
  - Acceptance: clicking Stop on a running project shows the stopped state within one polling cycle.

## §3.3.4 Log Viewer (split-pane)

- [ ] Build `LogViewer.svelte` opening inline below the project list — _file: `src/webview/pages/Docker/LogViewer.svelte`_
  - Endpoint: `GET /api/vps/v1/virtual-machines/{id}/docker/{name}/logs`
  - Renders last 300 lines (PRD §6.1 cap)
  - Each line prefixed with the service name, color-coded per service
  - Auto-scroll toggle (default on); turning off freezes the view at the user's scroll position
  - Close button in panel header
  - "Refresh" button (manual refresh model — Open Q3 deferred from streaming for v1.0)
  - Acceptance: opening logs does not navigate away from the project list; toggling auto-scroll behaves as described.

## §3.3.5 New Project Deployment (modal)

- [ ] Build `NewProjectModal.svelte` — _file: `src/webview/pages/Docker/NewProjectModal.svelte`_
  - One of the two permitted modals per PRD §4.2 exception
  - Project name input (validated: `/^[a-zA-Z0-9_-]+$/`, 3–32 chars)
  - Two input methods (radio):
    - Paste raw `docker-compose.yml` content (textarea, monospace)
    - URL (GitHub repo or direct raw `.yml` URL)
  - Expandable env-vars section: list of `key/value` rows with add/remove
  - Submit: `POST /api/vps/v1/virtual-machines/{id}/docker`
  - Env vars sent as part of the request body — never written to disk
  - On success, modal closes and the new project appears in the list immediately
  - Acceptance: invalid name disables submit; submit failure shows inline error inside modal, doesn't close.

## Page composition

- [ ] Compose into `Docker.svelte` — _file: `src/webview/pages/Docker.svelte`_
  - Layout: summary bar → project list (accordion) → log viewer split-pane (when active)
  - Empty state when no projects exist (PRD §4.5)
  - Skeleton during initial load

## Tests

- [ ] Project name validation
- [ ] Action confirm flow → API call → refetch
- [ ] Log viewer auto-scroll toggle
- [ ] Env-var sanitation: keys conform to `/^[A-Z_][A-Z0-9_]*$/`
- [ ] Filter input narrows the list correctly

## Verification

1. Docker tab lists all projects on the active VPS.
2. Hover any project → action icons reveal; click Restart → status updates within one cycle.
3. Open logs for a project → split-pane appears below; service prefixes visible; scrolling pauses auto-scroll.
4. Create a new project from a paste of valid `docker-compose.yml` → appears in list.
5. Delete a project → confirm → project disappears from list.
6. Switch active VPS → list refetches for the new VPS.
