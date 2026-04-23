# Changelog

All notable changes to the Hostinger VPS Manager extension are documented here.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Initial scaffolding rebrand from `svelte-starter` template to `hostinger-vps-manager` (Phase 0).
- Core architecture foundation: typed Hostinger API client, `SecretStorage`-backed `TokenStore`, `globalState`-backed `Preferences`, request/response correlated host↔webview messaging contract, design system primitives, polling abstraction, and 7-route webview shell with onboarding auth guard (Phase 1).
