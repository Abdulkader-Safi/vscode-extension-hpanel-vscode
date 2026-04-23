# Phase 8 — Deploy Tab

> **Goal:** One-click deploy of the current VS Code workspace to the user's Hostinger surface, with automatic project-type detection, snapshot safety net, live pipeline view, and a setup wizard for new projects.
> **PRD sections:** §3.4
> **Depends on:** Phase 1 (API, design), Phase 4 (deploy defaults, active VPS), Phase 5 (Docker action plumbing for compose deploys), Phase 6 (snapshot create + restore reuse)
> **Estimated effort:** 3 days

---

## §3.4.1 Project Configuration Detection

- [ ] Host handler `readDeployConfig` — _file: `src/deploy/configFile.ts`_
  - Reads `<workspaceFolders[0].uri>/.hostinger.json`
  - Returns parsed config or `null`
  - Schema: `{ deployType, vpsId, domain, snapshot, postDeploy }`
- [ ] Build `ConfigBanner.svelte` — _file: `src/webview/pages/Deploy/ConfigBanner.svelte`_
  - Found state: shows target VPS hostname, domain, deploy type as confirmation banner
  - Missing state: empty state with "Run setup wizard" CTA
  - Acceptance: re-evaluates on workspace change and on tab focus.

## §3.4.2 One-Click Deploy

- [ ] Build `DeployCard.svelte` — _file: `src/webview/pages/Deploy/DeployCard.svelte`_
  - Workspace info: project root path, detected project type, estimated archive size
  - Deploy target info: domain name, VPS hostname, IP
  - Toggle: pre-deploy snapshot (defaults from `Preferences.deploy.preSnapshot`)
  - Selector: post-deploy action — None / Restart Docker project / Open deploy log (defaults from `Preferences.deploy.postAction`)
  - "Deploy now" primary button → triggers pipeline (PRD §3.4.4)
  - Footer: "Last deploy: <timestamp> — View log"

## §3.4.3 Supported Deploy Types

- [ ] Project type detector — _file: `src/deploy/detectProjectType.ts`_
  - Static site: presence of build output dir (`dist/`, `build/`, `out/`, `_site/`) and absence of server entry
  - Node.js: `package.json` with `start` or `main` and no static build dir
  - Docker Compose: `docker-compose.yml` or `docker-compose.yaml` at root
  - WordPress: `wp-config.php` at root
  - Returns `null` when ambiguous → wizard prompts user to pick
- [ ] Static site deploy handler — `client.hosting.deployStaticWebsite` — _file: `src/deploy/types/static.ts`_
  - Zips the build output directory using a streaming archiver (no in-memory blob)
- [ ] Node.js deploy handler — `client.hosting.deployJsApplication` + `client.hosting.listJsDeployments` — _file: `src/deploy/types/node.ts`_
  - Excludes `node_modules`, `dist`, `build`, `.next`, `.svelte-kit`, `.cache`, `.git`
- [ ] Docker Compose deploy handler — _file: `src/deploy/types/dockerCompose.ts`_
  - Reads `docker-compose.yml` → `POST /api/vps/v1/virtual-machines/{id}/docker` (Phase 5 endpoint)
- [ ] WordPress deploy handler — `client.hosting.importWordpressWebsite` — _file: `src/deploy/types/wordpress.ts`_
  - Uploads archive + DB dump

## §3.4.4 Deploy Pipeline & Progress View

- [ ] Build `DeployPipeline.svelte` — _file: `src/webview/pages/Deploy/DeployPipeline.svelte`_
  - Vertical step tracker; step states: pending / active / complete / failed
  - Steps: Creating snapshot → Archiving workspace → Uploading to VPS → Triggering build → Verifying containers (Compose only)
  - Each completed step shows its timestamp
  - Active step shows progress detail (e.g. "Archiving — 1,243 files")
  - Terminal-style log panel below stepper streams real output
  - Cancel button shown where API supports cancellation
  - Acceptance: states transition deterministically; failed step is highlighted red.

## §3.4.5 Deploy Outcomes

- [ ] On success: all steps green, deploy duration shown, "View live site" button (opens `https://<domain>` via `vscode.env.openExternal`), "View deploy log" button — _file: `src/webview/pages/Deploy/DeployOutcome.svelte`_
- [ ] On failure: failed step highlighted red, error message inline, "Retry deploy" button, "Restore snapshot" button (always prominent if pre-deploy snapshot was taken)
  - Acceptance: failure with snapshot present → restore button is the dominant CTA.

## §3.4.6 Deploy Config Setup Wizard (4-step inline)

- [ ] Build `SetupWizard.svelte` — _file: `src/webview/pages/Deploy/SetupWizard.svelte`_
  - Inline (no modal) — uses Back/Next navigation
  - **Step 1 — Project type:** large visual cards: Static / Node.js / Docker Compose / WordPress (auto-suggests based on detector)
  - **Step 2 — Target:** VPS dropdown (from `GET /api/vps/v1/virtual-machines`); domain input pre-filled from `Preferences.deploy.defaultDomain`
  - **Step 3 — Options:** snapshot toggle, post-deploy selector, deploy-confirmation toggle
  - **Step 4 — Review & save:** JSON preview of `.hostinger.json`; checkbox "Add to .gitignore"; Save button writes file via host
  - Save handler `writeDeployConfig` — _file: `src/deploy/configFile.ts`_
    - Writes `.hostinger.json` via `vscode.workspace.fs.writeFile`
    - If checkbox set: append `.hostinger.json` to `.gitignore` (idempotent)
  - Acceptance: completed wizard produces a valid config that the detection step in §3.4.1 picks up immediately.

## Page composition

- [ ] Compose into `Deploy.svelte` — _file: `src/webview/pages/Deploy.svelte`_
  - When config missing → `<SetupWizard>`
  - When config present and not deploying → `<ConfigBanner>` + `<DeployCard>`
  - When deploying → `<DeployPipeline>`
  - When deploy complete → `<DeployOutcome>`

## Tests

- [ ] Project-type detection per fixture (static / node / compose / wordpress / ambiguous) — _file: `src/deploy/__tests__/detectProjectType.test.ts`_
- [ ] Archive exclusion rules for Node.js — _file: `src/deploy/__tests__/types.node.test.ts`_
- [ ] Pipeline state machine — _file: `src/webview/pages/Deploy/__tests__/DeployPipeline.test.ts`_
- [ ] Snapshot+deploy ordering: pre-snapshot completes before archiving begins
- [ ] Wizard writes valid `.hostinger.json` and updates `.gitignore` idempotently
- [ ] Failure with snapshot present surfaces restore CTA prominently

## Verification

1. Open a static-site workspace without `.hostinger.json` → wizard appears.
2. Complete wizard → `.hostinger.json` written, `.gitignore` updated.
3. Click Deploy now → pipeline runs end-to-end → success outcome → "View live site" opens domain in browser.
4. Force a failure (e.g. invalid token mid-deploy) → pipeline marks the failed step red → restore-snapshot button works.
5. Switch deploy type to Compose → pipeline includes "Verifying containers" step.
6. Open a different workspace → its own `.hostinger.json` is detected.
