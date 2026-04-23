# Hostinger VPS Manager

A VS Code extension for managing your Hostinger VPS infrastructure without leaving the editor.

> **Status:** Under construction. See [`PRD.md`](./PRD.md) for the v1.0 specification and [`plan/`](./plan/) for the phase-by-phase implementation checklist.

## Development

```bash
npm install
npm run watch    # esbuild + tsc --watch
# Press F5 in VS Code to launch the Extension Development Host
```

## Commands

- `Hostinger: Open VPS Manager` — opens the manager panel
- `Hostinger: Connect Account` — onboarding flow (Phase 2)
- `Hostinger: Disconnect Account` — clears the stored API token (Phase 2)

## License

MIT — see [`LICENSE`](./LICENSE).
