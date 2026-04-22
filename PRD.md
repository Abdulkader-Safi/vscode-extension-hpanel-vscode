# Hostinger VPS Manager — Product Requirements Document

**Version:** 1.0.0
**Status:** Draft — Pre-Development
**Author:** Abdul Kader Safi
**Date:** April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Feature Specifications](#3-feature-specifications)
   - 3.1 [Onboarding & Authentication](#31-onboarding--authentication)
   - 3.2 [Overview Tab](#32-overview-tab)
   - 3.3 [Docker Tab](#33-docker-tab)
   - 3.4 [Deploy Tab](#34-deploy-tab)
   - 3.5 [Firewall Tab](#35-firewall-tab)
   - 3.6 [Snapshots Tab](#36-snapshots-tab)
   - 3.7 [Settings Tab](#37-settings-tab)
4. [Global Behaviours & Design Patterns](#4-global-behaviours--design-patterns)
5. [Out of Scope](#5-out-of-scope)
6. [Technical Constraints & Assumptions](#6-technical-constraints--assumptions)
7. [Success Metrics](#7-success-metrics)
8. [Open Questions](#8-open-questions)
9. [Appendix — API Endpoint Reference](#9-appendix--hostinger-api-endpoint-reference)

---

## 1. Executive Summary

Hostinger VPS Manager is a VS Code extension that gives developers and engineers direct control over their Hostinger VPS infrastructure from inside the editor — without switching to a browser, opening hPanel, or managing multiple tabs. It opens as a full editor tab (WebView panel) and exposes the most operationally critical workflows through a clean, developer-native interface.

The extension is built around a single core insight: developers do not leave their editor to check billing or manage WHOIS records. They leave to restart a Docker container, check if RAM is spiking before a deploy, peek at firewall rules, or grab an SSH command. This product eliminates all of those interruptions.

> **Core Value Proposition:** Every hour a developer spends context-switching between VS Code and hPanel is an hour of lost flow. Hostinger VPS Manager keeps VPS operations — monitoring, deployment, Docker management, security, and recovery — inside the single tool developers already live in.

---

## 2. Product Overview

### 2.1 Product Identity

| Field          | Value                                               |
| -------------- | --------------------------------------------------- |
| Product Name   | Hostinger VPS Manager                               |
| Type           | VS Code Extension (WebView panel — full editor tab) |
| Platform       | Visual Studio Code 1.85+                            |
| Target API     | Hostinger Public API v1 (developers.hostinger.com)  |
| Authentication | Bearer token via VS Code secret storage             |
| Distribution   | VS Code Marketplace                                 |
| License        | MIT (open source)                                   |

---

### 2.2 Target Users

The extension is designed for three overlapping user profiles:

**Individual Developers**

- Freelancers or solo developers who self-host projects on Hostinger VPS
- Primarily working alone, need fast access without management overhead
- Use case: check server health, restart a service, SSH in, deploy a build

**Agency Engineers**

- Engineers at digital agencies managing multiple client VPS instances
- Need to switch between servers quickly and act without context-switching
- Use case: monitor multiple VPS, manage Docker projects per client, deploy from workspace

**DevOps-Adjacent Full-Stack Developers**

- Developers who handle their own infrastructure as part of the role
- Comfortable with Docker, SSH, firewalls but not sysadmin specialists
- Use case: deploy configurations, manage firewall rules, take safety snapshots before risky changes

---

### 2.3 Problem Statement

Developers using Hostinger VPS for their projects currently face a fragmented workflow:

1. To restart a Docker container, they open a browser, log into hPanel, navigate to the VPS, find the Docker Manager, and click restart — a 6-step process that breaks their coding flow.
2. To check if a deploy caused a memory spike, they must open hPanel separately and navigate to metrics — there is no ambient awareness inside the editor.
3. To deploy a project, they manually SSH in, pull changes, rebuild, and restart services — with no standardised, repeatable workflow tied to their VS Code workspace.
4. To check or add a firewall rule before opening a port for a new service, they open hPanel and navigate multiple levels deep.
5. Agency engineers managing multiple client VPS instances have no single view — they log in and out or maintain multiple browser sessions.

> **The Core Problem:** The Hostinger API exposes everything needed to manage a VPS programmatically. No developer tool currently wraps this API in a form that integrates into the editor workflow. This extension fills that gap.

---

### 2.4 Solution Overview

Hostinger VPS Manager wraps the Hostinger API in a six-tab WebView panel that opens as a native VS Code editor tab. The six functional areas map directly to the six most common reasons developers leave their editor to interact with their VPS:

| Tab       | Problem it solves                           | Primary API areas used             |
| --------- | ------------------------------------------- | ---------------------------------- |
| Overview  | Check server health without opening hPanel  | Virtual machines, Metrics, Actions |
| Docker    | Manage containers without SSH or browser    | Docker Compose endpoints           |
| Deploy    | Deploy from workspace with one command      | Hosting, VPS, Docker endpoints     |
| Firewall  | Add/remove rules without navigating hPanel  | Firewall endpoints                 |
| Snapshots | Take safety snapshots and restore backups   | Snapshot, Backup endpoints         |
| Settings  | Configure the extension and manage SSH keys | Virtual machines, Public keys      |

---

## 3. Feature Specifications

This section defines every feature in the product. Features are organized by functional area (tab). Each feature is described in terms of what it does, what data it shows, and what actions it enables. No implementation or code is specified here.

---

### 3.1 Onboarding & Authentication

#### 3.1.1 First-Launch Onboarding Screen

When the extension is opened for the first time with no API token stored, a full-screen onboarding view replaces all tab content. This screen exists to guide the user through connecting their Hostinger account in the minimum number of steps.

- Displays the Hostinger logo and a clear headline explaining the required action
- Provides a single password-masked text input for the API token with a show/hide toggle
- Includes a direct link to the Hostinger documentation page for generating an API token
- Submitting the token triggers an immediate API validation call
- Shows a loading state while validation is in progress (input disabled, button replaced with spinner)
- Shows an inline error state if the token is invalid, with a specific error message
- On success, transitions automatically to the Overview tab with the full navigation bar visible
- The token is stored in VS Code's built-in secret storage — never written to disk in plaintext

**States:** Default → Loading → Error → Success (auto-transitions to Overview)

---

### 3.2 Overview Tab

The default view shown after authentication. Shows server health, status, and quick actions at a glance.

#### 3.2.1 Server Identity Bar

A persistent header card at the top of the Overview tab that shows the identity and current state of the active VPS at a glance.

- Displays the VPS hostname in large bold text
- Displays the primary IP address in monospace format
- Shows the operating system template (e.g. Ubuntu 22.04)
- Shows the datacenter location (city and country)
- Shows the hosting plan type
- Shows the VPS creation date
- Displays a real-time status indicator: Running / Stopped / Error / Unknown
- Provides three quick-action buttons: Restart, Stop, and Recovery Mode
- Each destructive action requires an inline two-step confirmation before executing

#### 3.2.2 Resource Metrics Panel

Four metric cards displayed in a 2×2 grid that show current and historical resource usage for the active VPS.

- **CPU usage card:** shows current percentage as a large number with a sparkline chart of the last 24 hours and a daily average figure
- **RAM usage card:** shows used and total memory (e.g. 2.1 / 4 GB) with a horizontal fill bar and percentage label
- **Disk usage card:** shows used and total disk space with a fill bar and percentage label
- **Network card:** shows total inbound and outbound transfer since last reboot with a sparkline
- All metric data is fetched from the Hostinger API metrics endpoint
- Metrics refresh automatically at a user-configurable interval (see Settings)
- Cards visually change state when a metric exceeds a user-configured threshold (warning color)

#### 3.2.3 Recent Actions Log

A scrollable list of the most recent operations performed on the VPS, sourced from the Hostinger API actions endpoint.

- Shows the last 10 actions by default
- Each row displays: timestamp, action name, and a status badge (success, failed, or pending)
- Rows have a hover highlight for readability
- A link at the bottom allows viewing the full action history

#### 3.2.4 Quick SSH Connect

A utility card that removes the friction of opening a terminal and manually typing an SSH command.

- Displays the complete SSH command pre-built using the VPS IP address from the API
- Provides a one-click copy-to-clipboard button for the command
- Provides an "Open in terminal" button that opens a VS Code integrated terminal and executes the command automatically
- Lists the SSH keys currently attached to the VPS
- Includes a link to the Settings tab for SSH key management

---

### 3.3 Docker Tab

Manage all Docker Compose projects and containers on the active VPS without SSH or browser access.

#### 3.3.1 Project Overview Summary

A summary line at the top of the Docker tab that provides an instant count of the infrastructure state.

- Shows total number of Docker Compose projects on the VPS
- Shows total number of containers across all projects
- Shows number of containers in an unhealthy or stopped state
- Includes a search/filter input to filter projects by name

#### 3.3.2 Docker Compose Project List

An accordion-style list of all Docker Compose projects deployed on the active VPS. Each project row is interactive and expandable.

- Each project row (collapsed) shows: project name, overall status badge, container count, and exposed port pills
- Hovering a project row reveals action icon buttons: Start, Stop, Restart, Update, Logs, Delete
- Clicking the expand control reveals a list of all containers belonging to that project
- Each container sub-row shows: container name, Docker image and tag, status indicator, port mappings, and current CPU and RAM usage
- Each container sub-row includes a "View logs" link

#### 3.3.3 Project Actions

Direct actions that can be performed on any Docker Compose project without leaving the editor.

- **Start:** starts all stopped services in the project in dependency order
- **Stop:** gracefully stops all running services, preserving data volumes and configuration
- **Restart:** stops and starts all services, preserving data and network configuration
- **Update:** pulls the latest images and recreates containers — equivalent to a rolling update
- **Delete:** completely removes the project, all containers, networks, and associated data — irreversible, requires confirmation
- All actions trigger an immediate status refresh for the affected project after completion

#### 3.3.4 Log Viewer

A log panel that opens inline (splitting the content area vertically) when logs are requested for any project.

- Opens without navigating away from the Docker tab — the project list remains visible above
- Displays the last 300 lines of aggregated logs across all services in the project
- Each log line is prefixed with the service name for easy filtering
- Supports auto-scroll to keep the latest logs visible
- Auto-scroll can be toggled off to read earlier entries without the view jumping
- The panel can be closed with a button in its header

#### 3.3.5 New Project Deployment

A modal form for deploying a new Docker Compose project directly from the extension, without SSH or manual file transfer.

- Accepts a project name (validated: alphanumeric characters, dashes, and underscores only)
- Supports two input methods: pasting raw docker-compose.yml content, or providing a URL (GitHub repo or direct raw file URL)
- Includes an expandable environment variables section for adding key/value pairs
- Environment variables are sent securely as part of the API request — not written to disk
- After submission, the new project immediately appears in the project list

---

### 3.4 Deploy Tab

Deploy the current VS Code workspace directly to the VPS. Reads from `.hostinger.json` in the project root.

#### 3.4.1 Project Configuration Detection

The Deploy tab automatically detects whether the current VS Code workspace has a deployment configuration file.

- Scans the workspace root for a `.hostinger.json` configuration file on tab load
- If a config file is found, displays the target VPS, domain, and deploy type as a confirmation banner
- If no config file is found, shows an empty state with a prompt to run the setup wizard
- The config file stores: deploy type, target VPS ID, target domain, snapshot preference, and post-deploy action
- The config file is designed to be committed to `.gitignore` — it contains no secrets

#### 3.4.2 One-Click Deploy

When a valid configuration is present, the entire deploy workflow is triggered by a single button.

- Displays workspace information: project root path, detected project type, and estimated archive size
- Displays deploy target information: domain name, VPS hostname, and IP address
- Provides a toggle to enable or disable pre-deploy snapshot creation
- Provides a selector for the post-deploy action: none, restart Docker project, or open deploy log
- The "Deploy now" button triggers the full deploy pipeline
- Shows the timestamp and a link to the log of the most recent previous deploy

#### 3.4.3 Supported Deploy Types

The extension automatically detects and handles four types of projects based on the workspace file structure.

- **Static site:** zips the build output directory and uploads it to the Hostinger hosting API for direct file serving
- **Node.js application:** zips the source files (excluding node_modules and build output), uploads to the hosting API, and triggers a server-side build
- **Docker Compose project:** pushes the docker-compose.yml to the VPS via the Docker API and starts the project
- **WordPress:** uploads an archive and database dump to the Hostinger WordPress import endpoint

#### 3.4.4 Deploy Pipeline & Progress View

When a deploy is running, the UI switches to a live progress view that shows each step of the pipeline.

- Displays a vertical step-by-step progress tracker with individual states: pending, active, complete, failed
- Steps shown: Creating snapshot → Archiving workspace → Uploading to VPS → Triggering build → Verifying containers
- Each completed step shows its timestamp
- The active step shows a progress indicator and relevant details (e.g. file count while archiving)
- A terminal-style log panel below the stepper streams real output from the deploy process
- A cancel option is available during the deploy (where the API supports it)

#### 3.4.5 Deploy Outcomes

The deploy view handles all possible outcomes and provides clear next steps.

- **Success:** all steps check green, shows deploy duration, provides "View live site" and "View deploy log" buttons
- **Failure:** the failed step is highlighted in red with the error message inline; provides "Retry deploy" and "Restore snapshot" options
- If a pre-deploy snapshot was created and the deploy failed, the restore option is always surfaced prominently

#### 3.4.6 Deploy Config Setup Wizard

A guided, four-step inline wizard for creating the `.hostinger.json` configuration file for projects that do not yet have one.

- **Step 1 — Project type selection:** user selects from Static site, Node.js app, Docker Compose, or WordPress using large visual option cards
- **Step 2 — Target selection:** user selects the target VPS from a dropdown populated from the API and enters the deployment domain
- **Step 3 — Options:** user configures snapshot preference, post-deploy action, and deploy confirmation toggle
- **Step 4 — Review and save:** shows a JSON preview of the config file that will be written, with a checkbox to auto-add it to `.gitignore`
- The wizard is entirely inline — no modals — and navigated with Back and Next buttons

---

### 3.5 Firewall Tab

View and manage firewall rules applied to the active VPS without navigating hPanel.

#### 3.5.1 Firewall Selector

A top-level control bar for selecting and managing firewall configurations associated with the active VPS.

- Dropdown showing the currently active firewall by name
- Sync status indicator: Synced (green) or Out of sync (amber)
- A "Sync now" button appears when the firewall is out of sync — applies current rules to the VPS
- Buttons for creating a new firewall and deleting the current firewall

#### 3.5.2 Rules Table

A table view of all firewall rules in the current firewall configuration.

- Columns: Protocol, Port or Range, Source type, Source detail
- Protocol displayed as a colored badge: TCP, UDP, ICMP
- Port displayed in monospace format, supports ranges (e.g. `1024:2048`)
- Source type: Any, IP, or CIDR
- Source detail in monospace (e.g. `any`, `192.168.1.0/24`)
- Edit and Delete action icons appear on row hover
- An "Add rule" inline form appears at the bottom of the table, using the same column structure as the table rows
- Inline validation on the add rule form before submission

#### 3.5.3 Out-of-Sync Warning

A persistent warning that appears whenever the local firewall configuration has changes not yet applied to the VPS.

- Shown as an amber banner above the rules table
- Explains that the firewall has unapplied changes
- Provides a one-click sync button directly in the banner
- Banner dismisses automatically after a successful sync

---

### 3.6 Snapshots Tab

Manual snapshot management and automated backup history for the active VPS.

#### 3.6.1 Manual Snapshot Management

Controls for creating, viewing, and restoring a manual snapshot of the current VPS state.

- Shows the current snapshot's creation date, relative age (e.g. "3 days ago"), and estimated size
- Provides a "Restore snapshot" button with an inline two-step confirmation
- Provides a "Delete snapshot" option
- Provides a "Create new snapshot" button — with a visible warning that creating a new snapshot overwrites the existing one
- Shows a progress indicator while a snapshot is being created
- If no snapshot exists, shows an empty state with a prompt to create one

#### 3.6.2 Automated Backup Browser

A view of all automated weekly backups available for the active VPS, with restore capability.

- Lists all available backups with their date, time, and relative age
- Each backup row has a "Restore" button
- Restoring a backup opens a confirmation modal — the only modal in the extension outside of Docker project creation
- The restore confirmation modal requires the user to type the VPS hostname to confirm, preventing accidental data loss
- The restore button in the modal is disabled until the hostname is typed correctly
- A toggle at the top of the section enables or disables the weekly automated backup schedule

---

### 3.7 Settings Tab

Extension configuration, credentials, VPS management, and all user preferences.

#### 3.7.1 API Connection Management

Controls for managing the API token connection between the extension and the user's Hostinger account.

- Shows the stored token in masked format, revealing only the last four characters
- Provides an "Update token" option to replace the stored token
- Displays the connected account email address when the connection is valid
- Provides a "Test connection" button that makes a live API call and reports success or failure
- Shows an error state with a descriptive message if the connection is broken

#### 3.7.2 VPS Instance Management

A list of all VPS instances associated with the connected Hostinger account.

- Fetches and displays all VPS instances from the API
- Each row shows: status indicator, hostname, IP address, and plan type
- The currently active (default) VPS is marked with a badge
- Any VPS can be set as the default with a single click
- A refresh button re-fetches the VPS list from the API
- Switching the default VPS updates all tabs to reflect the new selection

#### 3.7.3 Metrics & Polling Configuration

Controls for how and when the extension fetches live data from the API.

- Toggle to enable or disable automatic metrics polling
- Interval selector when polling is enabled: 30 seconds, 1 minute, 2 minutes, or 5 minutes
- Toggle to show a CPU usage chip in the VS Code status bar (bottom bar)

#### 3.7.4 Threshold Alert Configuration

User-defined thresholds that trigger visual alerts in the extension when resource usage is high.

- Numeric input for CPU alert threshold (default: 85%)
- Numeric input for RAM alert threshold (default: 90%)
- Numeric input for disk alert threshold (default: 80%)
- Toggle to enable or disable VS Code notifications when a threshold is exceeded
- Toggle to snooze all threshold alerts for the current VS Code session

#### 3.7.5 Deploy Default Configuration

Default values that pre-populate the Deploy tab and configuration wizard.

- Toggle: auto-create a snapshot before every deploy (default: on)
- Selector: default post-deploy action — None, Restart Docker project, or Open deploy log
- Toggle: require explicit confirmation before starting any deploy (default: on)
- Text input: default deploy domain (pre-fills the deploy config wizard for new projects)

#### 3.7.6 SSH Key Management

A two-column interface for managing SSH keys at both the Hostinger account level and the local machine level.

- Left column shows all SSH public keys registered on the Hostinger account
- Each account key row shows the key name and a truncated fingerprint in monospace
- Individual keys can be deleted from the account
- Right column shows all `.pub` files detected in the local `~/.ssh` directory
- Each local key can be registered to the Hostinger account with a name
- Registering a local key shows an inline form to name the key before saving

#### 3.7.7 Danger Zone

A clearly separated section at the bottom of Settings for irreversible account-level actions.

- **Disconnect account:** removes the API token from VS Code secret storage and returns the extension to the onboarding screen
- **Reset all settings:** clears all extension preferences and configuration (does not remove the API token)
- Both actions use an inline two-step confirmation pattern — the user must explicitly confirm before the action executes
- The section is visually distinct with a warning-colored border to signal destructive intent

---

## 4. Global Behaviours & Design Patterns

These patterns apply across all tabs and screens in the extension. They define how the extension behaves as a system, not just as individual features.

### 4.1 VPS Selector (Top Navigation)

- A persistent dropdown in the top navigation bar showing the name and status of the currently active VPS
- Clicking the dropdown opens a list of all VPS instances associated with the account
- Selecting a different VPS updates all tabs simultaneously to reflect the selected server
- The status dot in the dropdown updates in real time during polling cycles

### 4.2 Inline Two-Step Confirmation

- All destructive actions (restart, stop, delete, restore) use an inline confirmation pattern — no modal dialogs
- Clicking a destructive button transforms it in-place into a confirmation row: "Are you sure?" + "Yes, proceed" + "Cancel"
- The confirmation row auto-cancels after 8 seconds of inactivity
- Exceptions: the Backup Restore modal and the New Docker Project modal use full modal overlays due to the complexity of the required inputs

### 4.3 Toast Notification System

- Async action results are surfaced as toast notifications in the bottom-right corner of the WebView
- Three semantic types: success (green), error (red), info (blue), warning (amber)
- Success and info toasts auto-dismiss after 4 seconds
- Error toasts remain until explicitly dismissed
- A maximum of 3 toasts are displayed simultaneously; newer toasts push up

### 4.4 Loading Skeleton States

- When data is being fetched, content areas show animated skeleton placeholders matching the shape of the incoming content
- Skeletons use a pulsing animation to indicate loading activity
- Spinners are used only inside buttons during async button actions — never in content areas

### 4.5 Empty States

- Every content area that can have zero items has a designed empty state
- Empty states follow a consistent pattern: a contextual icon, a short heading, a one-line explanation, and a primary action button
- Empty states are used in: Docker (no projects), Firewall (no rules), Snapshots (no backups), Actions log (no history)

### 4.6 VS Code Status Bar Integration

- When enabled in Settings, the extension adds a chip to the VS Code status bar (bottom bar)
- Normal state: colored status dot + VPS hostname + current CPU percentage
- Alert state: warning color background when any configured threshold is exceeded
- Clicking the status bar chip opens or focuses the extension's Overview tab

### 4.7 Multi-VPS Support

- The extension supports accounts with multiple VPS instances without requiring login/logout
- All tabs always reflect the currently selected VPS from the top navigation dropdown
- Switching VPS clears all cached data for the previous selection and re-fetches for the new one

### 4.8 Workspace-Aware Deploy Configuration

- The extension detects the VS Code workspace root when the Deploy tab is opened
- It scans for `.hostinger.json` at the project root to determine deploy context
- Different workspace folders can have different deploy configurations
- The configuration file is designed to be human-readable and editable outside the extension

---

## 5. Out of Scope

The following capabilities are explicitly excluded from version 1.0 of this product. They are either better served by hPanel, outside the developer workflow, or reserved for future versions.

| Feature                                  | Reason for exclusion                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Billing and subscription management      | No developer workflow requires billing mid-session; hPanel is the right place |
| Domain registration and WHOIS management | One-time tasks best handled in a full browser interface                       |
| Email marketing (Hostinger Reach API)    | Unrelated to VPS developer workflow                                           |
| DNS zone management                      | Infrequent, complex, and high-risk without a full UI; better in hPanel        |
| VPS purchase / provisioning              | A one-time action, not a recurring developer need                             |
| Hosting plan management (non-VPS)        | Different product surface; out of scope for VPS-focused tool                  |
| Multi-account support                    | Single API token per installation; multi-account is a v2 consideration        |
| Mobile support                           | VS Code WebView is desktop-only by design                                     |

---

## 6. Technical Constraints & Assumptions

### 6.1 API Constraints

- All data is fetched from the Hostinger Public API v1 at `developers.hostinger.com`
- Authentication uses a Bearer token stored in VS Code's `SecretStorage` — never written to disk or included in settings JSON
- The API has rate limits; the extension must implement polling backoff and avoid hammering endpoints
- Metrics history is available via the API; real-time streaming is not available — polling is required
- Log data from Docker projects is limited to the last 300 lines per the API specification

### 6.2 VS Code Extension Constraints

- The extension runs as a VS Code WebView panel (full editor tab), not a sidebar panel
- The WebView is implemented as a web application running inside a sandboxed iframe within VS Code
- Communication between the WebView (frontend) and the extension host (backend) uses VS Code's bidirectional message passing API
- All Hostinger API calls are made from the extension host (Node.js), not from the WebView, to protect the API token from browser-level exposure
- User preferences (polling interval, thresholds, default VPS) are stored in VS Code's `globalState`
- The API token is stored in VS Code's `SecretStorage`

### 6.3 Assumptions

- The user has a Hostinger account with at least one active VPS plan
- The user has generated a Hostinger API token from hPanel
- The VPS runs a Linux-based OS (required for Docker and SSH functionality)
- For Docker features, the VPS has Docker and Docker Compose installed and the Hostinger Docker Manager is enabled
- For the Deploy tab, the user has a VS Code workspace open with a project they intend to deploy

---

## 7. Success Metrics

| Metric                         | Target                              | Timeframe           |
| ------------------------------ | ----------------------------------- | ------------------- |
| VS Code Marketplace installs   | 500 installs                        | First 90 days       |
| Average rating                 | 4.0+ stars                          | First 90 days       |
| Marketplace reviews            | 10+ written reviews                 | First 90 days       |
| GitHub stars (if open-sourced) | 100+ stars                          | First 90 days       |
| Weekly active users retained   | 40%+ of installs                    | 90 days post-launch |
| Deploy tab usage               | >30% of active users use deploy tab | 60 days post-launch |
| Docker tab usage               | >50% of active users use Docker tab | 60 days post-launch |
| Zero critical security issues  | No API token exposure incidents     | Ongoing             |

---

## 8. Open Questions

1. Should the extension support multiple simultaneous API tokens (for developers with multiple Hostinger accounts), or is a single-token model sufficient for v1?
2. Should the Deploy tab support deploying to Hostinger shared hosting in addition to VPS, using the hosting API endpoints?
3. Should the log viewer support live-streaming log updates via repeated polling, or is a manual "refresh logs" model acceptable for v1?
4. Should the extension support theming (respecting VS Code's light/dark mode toggle), or should it ship with a dark-only UI for v1?
5. Should `.hostinger.json` support multiple deploy targets (e.g. staging and production VPS) for the same workspace?
6. Should the extension publish telemetry (usage analytics) to understand which features are most used, and if so, what is the opt-in/opt-out model?

---

## 9. Appendix — Hostinger API Endpoint Reference

This appendix maps each product feature to the specific Hostinger API endpoints it depends on. This is for planning purposes only and does not constitute implementation specification.

| Feature area                     | API endpoints used                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Server identity & status         | `GET /api/vps/v1/virtual-machines` `GET /api/vps/v1/virtual-machines/{id}`                 |
| Resource metrics                 | `GET /api/vps/v1/virtual-machines/{id}/metrics`                                            |
| VPS actions (start/stop/restart) | `POST /api/vps/v1/virtual-machines/{id}/start` `/stop` `/restart`                          |
| Action history log               | `GET /api/vps/v1/virtual-machines/{id}/actions`                                            |
| Recovery mode                    | `POST /api/vps/v1/virtual-machines/{id}/recovery` `DELETE /recovery`                       |
| Docker project list              | `GET /api/vps/v1/virtual-machines/{id}/docker`                                             |
| Docker project details           | `GET /api/vps/v1/virtual-machines/{id}/docker/{name}`                                      |
| Docker containers                | `GET /api/vps/v1/virtual-machines/{id}/docker/{name}/containers`                           |
| Docker project logs              | `GET /api/vps/v1/virtual-machines/{id}/docker/{name}/logs`                                 |
| Docker start/stop/restart        | `POST /api/vps/v1/virtual-machines/{id}/docker/{name}/start` `/stop` `/restart`            |
| Docker update                    | `POST /api/vps/v1/virtual-machines/{id}/docker/{name}/update`                              |
| Docker create project            | `POST /api/vps/v1/virtual-machines/{id}/docker`                                            |
| Docker delete project            | `DELETE /api/vps/v1/virtual-machines/{id}/docker/{name}/down`                              |
| Deploy static site               | Hostinger hosting API — `deployStaticWebsite`                                              |
| Deploy Node.js app               | Hostinger hosting API — `deployJsApplication` `listJsDeployments`                          |
| Deploy WordPress                 | Hostinger hosting API — `importWordpressWebsite`                                           |
| Firewall list                    | `GET /api/vps/v1/firewall`                                                                 |
| Firewall rules                   | `GET /api/vps/v1/firewall/{id}` `POST/PUT/DELETE /api/vps/v1/firewall/{id}/rules/{ruleId}` |
| Firewall sync                    | `POST /api/vps/v1/firewall/{id}/sync/{vmId}`                                               |
| Snapshot create/view             | `GET/POST /api/vps/v1/virtual-machines/{id}/snapshot`                                      |
| Snapshot restore/delete          | `POST /api/vps/v1/virtual-machines/{id}/snapshot/restore` `DELETE /snapshot`               |
| Backup list                      | `GET /api/vps/v1/virtual-machines/{id}/backups`                                            |
| Backup restore                   | `POST /api/vps/v1/virtual-machines/{id}/backups/{backupId}/restore`                        |
| SSH key list (account)           | `GET /api/vps/v1/public-keys`                                                              |
| SSH key create/delete            | `POST /api/vps/v1/public-keys` `DELETE /api/vps/v1/public-keys/{id}`                       |
| SSH key attach to VPS            | `POST /api/vps/v1/public-keys/attach/{virtualMachineId}`                                   |
| Attached keys on VPS             | `GET /api/vps/v1/virtual-machines/{id}/public-keys`                                        |

---

_[APIS DOCS LINK](https://developers.hostinger.com/#description/introduction)_

_End of Document_
