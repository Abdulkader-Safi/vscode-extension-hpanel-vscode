# Phase 10 — Release & Marketplace

> **Goal:** Cut v1.0.0, package the `.vsix`, and publish to the VS Code Marketplace with a marketing-quality listing.
> **PRD sections:** §2.1, §7
> **Depends on:** Phases 0–9 (everything)
> **Estimated effort:** 1–1.5 days

---

## Marketplace metadata

- [ ] Confirm publisher account exists at <https://marketplace.visualstudio.com/manage>
  - Acceptance: `vsce login <publisher>` succeeds.
- [ ] Final `package.json` polish — _file: `package.json`_
  - `version` → `1.0.0`
  - `categories` → `["Other", "Azure"]` (or refine post-research)
  - `keywords` → `hostinger`, `vps`, `docker`, `deploy`, `devops`, `server`, `ssh`, `firewall`, `snapshot`
  - `galleryBanner` → `{ color: "#673de6", theme: "dark" }`
  - `badges`: marketplace install + downloads
  - `repository`, `bugs`, `homepage` final
- [ ] Add `icon` field pointing to `icons/icon.png` (128×128 PNG, transparent bg) — _files: `icons/icon.png`, `package.json`_
- [ ] Optional: theme-aware status bar icons in `icons/` (`status-dark.svg`, `status-light.svg`)

## `.vscodeignore` audit

- [ ] Exclude `src/`, `out/`, `plan/`, `PRD.md`, `tsconfig.json`, `eslint.config.mjs`, `esbuild.js`, `svelte.config.mjs`, `tailwind.config.js`, `postcss.config.js`, `.vscode/`, `.vscode-test.mjs`, `node_modules/` (auto), tests — _file: `.vscodeignore`_
  - Acceptance: `vsce ls` does not list any of the above.

## Production build verification

- [ ] `npm run package` produces minified `dist/extension.js`, `dist/webview.js`, `dist/webview.css`
- [ ] Extension installs from generated `.vsix` via `code --install-extension hostinger-vps-manager-1.0.0.vsix`
- [ ] Smoke test in a fresh VS Code profile (`code --user-data-dir=/tmp/test-profile`):
  1. Install `.vsix`
  2. Run `Hostinger: Open VPS Manager`
  3. Complete onboarding with a real token
  4. Walk every tab end-to-end
  5. Run a real deploy of a sample static site
  6. Restore the pre-deploy snapshot

## README rewrite for Marketplace listing

- [ ] Hero section: product name, tagline, screenshots (one per tab) — _file: `README.md`_
- [ ] Feature matrix mirroring PRD §2.4 table
- [ ] Install instructions
- [ ] Security note: token storage uses `SecretStorage`; no telemetry by default; private SSH keys are never read
- [ ] Configuration examples for `.hostinger.json`
- [ ] Roadmap / open questions deferred to v1.1
- [ ] Contributing + license sections

## Screenshots

- [ ] Capture eight screenshots (light + dark of: Onboarding, Overview, Docker, Deploy, Firewall, Snapshots, Settings, Status bar chip) — _files: `media/screenshots/*.png`_
- [ ] One animated GIF showing a deploy run end-to-end — `media/screenshots/deploy.gif`

## Telemetry decision (resolves Open Q6)

- [ ] Implement a no-op telemetry stub that respects `vscode.env.isTelemetryEnabled`
- [ ] If shipping any telemetry: opt-in only via Settings toggle (default OFF), no PII, no token
- [ ] If not shipping: explicit "No telemetry" line in README's Privacy section
  - Acceptance: in either path, an audit confirms no network calls outside the documented Hostinger API surface.

## CHANGELOG

- [ ] Add `## [1.0.0] — <publish date>` section — _file: `CHANGELOG.md`_
  - Group entries by tab area: Onboarding, Overview, Docker, Deploy, Firewall, Snapshots, Settings, Global

## Repository hygiene (if open-sourcing per PRD §2.1 license)

- [ ] `LICENSE` (MIT) — already added in Phase 0
- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml`, `feature_request.yml`
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] `SECURITY.md` — vulnerability disclosure address
- [ ] `CONTRIBUTING.md` — dev setup, lint, test, commit message style

## Publish

- [ ] `vsce package` → produces `hostinger-vps-manager-1.0.0.vsix`
- [ ] `vsce publish 1.0.0` (or `vsce publish` after `npm version 1.0.0`)
  - Acceptance: extension page is live within ~5 minutes at `https://marketplace.visualstudio.com/items?itemName=<publisher>.hostinger-vps-manager`
- [ ] Tag the release: `git tag v1.0.0 && git push --tags`
- [ ] GitHub Release notes mirroring the CHANGELOG entry; attach `.vsix` to the release

## Post-launch monitoring (PRD §7 metrics)

- [ ] Track installs, ratings, reviews via Marketplace dashboard
- [ ] Monitor GitHub issues for first-week regressions
- [ ] Plan v1.0.1 patch window for inevitable launch bugs

## Tests

- [ ] Smoke-installed `.vsix` activates without console errors in fresh profile
- [ ] Status bar chip shows the configured VPS hostname after fresh install + onboarding

## Verification

1. `vsce package` clean.
2. Install from `.vsix` in a clean VS Code profile → onboarding → connect → walk every tab → deploy → success.
3. Marketplace listing shows correct icon, banner, screenshots, README rendering.
4. Search "hostinger" in VS Code Extensions sidebar → extension appears in results.
5. Install via Extensions sidebar → same flow as `.vsix` install works.
6. PRD §7 success metrics dashboard set up (Marketplace + GitHub).
