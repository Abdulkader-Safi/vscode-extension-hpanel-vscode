# Phase 7 — Firewall Tab

> **Goal:** View and manage firewall rules with full CRUD plus sync-state awareness, eliminating navigation to hPanel for routine port changes.
> **PRD sections:** §3.5
> **Depends on:** Phase 1 (API, design), Phase 4 (active VPS)
> **Estimated effort:** 1.5 days

---

## §3.5.1 Firewall Selector

- [ ] Build `FirewallSelector.svelte` — _file: `src/webview/pages/Firewall/FirewallSelector.svelte`_
  - Endpoint: `GET /api/vps/v1/firewall`
  - Dropdown shows currently active firewall by name
  - Sync status indicator: green "Synced" or amber "Out of sync"
  - "Sync now" button when out of sync → `POST /api/vps/v1/firewall/{id}/sync/{vmId}`
  - "Create firewall" button → opens inline form (no modal — only modals are New Docker Project + Backup Restore per PRD §4.2)
  - "Delete current firewall" button → `<ConfirmInline>` → API delete

## §3.5.2 Rules Table

- [ ] Build `RulesTable.svelte` — _file: `src/webview/pages/Firewall/RulesTable.svelte`_
  - Endpoint: `GET /api/vps/v1/firewall/{id}` (returns rules)
  - Columns: Protocol | Port or Range | Source type | Source detail
  - Protocol displayed as colored `<Badge>`: TCP / UDP / ICMP
  - Port in monospace; supports ranges like `1024:2048`
  - Source type: Any / IP / CIDR
  - Source detail in monospace (e.g. `any`, `192.168.1.0/24`)
  - Edit and Delete icons appear on row hover
  - Endpoints: `PUT /api/vps/v1/firewall/{id}/rules/{ruleId}`, `DELETE /api/vps/v1/firewall/{id}/rules/{ruleId}`

## Add Rule (inline form)

- [ ] Inline `AddRuleForm.svelte` at the bottom of the rules table — _file: `src/webview/pages/Firewall/AddRuleForm.svelte`_
  - Same column structure as the table
  - Inline validation:
    - Protocol required (radio: TCP / UDP / ICMP)
    - Port required for TCP/UDP; supports single port or `start:end` range; range start < end; both 1–65535
    - Source: dropdown switches detail input format
      - Any → no detail input
      - IP → IPv4 or IPv6 validator
      - CIDR → network/prefix validator
  - Submit: `POST /api/vps/v1/firewall/{id}/rules/{ruleId}`
  - Acceptance: invalid input disables submit and shows the failing field.

## §3.5.3 Out-of-Sync Warning

- [ ] Build `OutOfSyncBanner.svelte` — _file: `src/webview/pages/Firewall/OutOfSyncBanner.svelte`_
  - Amber banner above the rules table
  - Visible whenever sync state is out of sync (after any rule mutation)
  - One-click Sync button inside the banner
  - Auto-dismiss on successful sync

## Page composition

- [ ] Compose into `Firewall.svelte` — _file: `src/webview/pages/Firewall.svelte`_
  - Layout: selector top → out-of-sync banner (when applicable) → rules table → add-rule form
  - Empty state when firewall has no rules (PRD §4.5)
  - Skeleton on initial load

## Tests

- [ ] Port range validation: rejects `0:80`, `80:80`, `80:65536`, accepts `1024:2048`
- [ ] CIDR validation: rejects `999.0.0.0/24`, accepts `10.0.0.0/8`
- [ ] IP validation handles IPv4 + IPv6
- [ ] Sync-state derivation: any successful rule mutation marks the firewall out of sync until a successful sync completes
- [ ] Banner shows/hides per sync state

## Verification

1. Firewall tab lists all firewalls on the account; selecting one shows its rules.
2. Add a rule → row appears in the table; banner appears amber.
3. Click Sync → banner clears.
4. Edit a rule → row updates; banner reappears.
5. Delete a rule → row disappears; banner reappears.
6. Switch active VPS → firewall list refetches for the new context.
