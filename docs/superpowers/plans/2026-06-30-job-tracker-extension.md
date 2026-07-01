# Job Tracker Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension with an embedded job tracker dashboard and a popup that reads the current job page, pre-fills an application record, and saves it to extension storage.

**Architecture:** The extension is a Manifest V3 unpacked extension under `outputs/job-tracker-extension/`. A popup reads the active tab through `chrome.scripting.executeScript`, parses job information in the page context, lets the user edit the prefilled record, and persists records via shared storage helpers. A dashboard page reuses the agreed tracker workflow for viewing, filtering, editing, deleting, and exporting records from `chrome.storage.local`.

**Tech Stack:** Plain HTML, CSS, JavaScript, Chrome Extension Manifest V3. No network dependencies.

## Global Constraints

- Use a plugin-internal manager as the primary data store.
- Store records in `chrome.storage.local` under one stable key.
- Fields must match the existing job tracker: company, role, applied date, channel, job link, status page link, status, status updated date, notes.
- Default popup status is `已投递`.
- Popup must parse the current page and show editable prefilled fields before saving.
- Dashboard must support colored statuses, search, status filtering, edit, delete, and CSV export.
- The extension must be loadable as an unpacked Chrome extension.
- Do not depend on remote assets or package installs.

---

### Task 1: Requirement Test Harness

**Files:**
- Create: `work/test_job_tracker_extension.ps1`

**Interfaces:**
- Consumes: expected files under `outputs/job-tracker-extension/`
- Produces: a verification script that fails until the extension has the required manifest, popup, dashboard, parser, storage, statuses, and UI wiring.

- [ ] **Step 1: Write failing checks**

Create a PowerShell script that checks required files, Manifest V3 fields, permissions, popup/dashboard HTML references, `chrome.storage.local`, `chrome.scripting.executeScript`, default status `已投递`, all agreed fields, all detailed statuses, CSV export, and parser metadata extraction.

- [ ] **Step 2: Verify red**

Run the script before extension files exist. Expected result: FAIL with missing extension files.

### Task 2: Shared Extension Data and Parser

**Files:**
- Create: `outputs/job-tracker-extension/shared/statuses.js`
- Create: `outputs/job-tracker-extension/shared/storage.js`
- Create: `outputs/job-tracker-extension/shared/parser.js`

**Interfaces:**
- `STATUS_OPTIONS: Array<{ label: string, tone: string }>`
- `statusTone(status: string): string`
- `getToday(): string`
- `normalizeRecord(record: object): object`
- `getRecords(): Promise<Array<object>>`
- `saveRecord(record: object): Promise<object>`
- `updateRecord(record: object): Promise<object>`
- `deleteRecord(id: string): Promise<void>`
- `exportRecordsToCsv(records: Array<object>): string`
- `parseJobPage(document, location): object`

- [ ] **Step 1: Implement status and record helpers**

Add all status options, color tone mapping, field names, date helper, ID helper, and record normalization.

- [ ] **Step 2: Implement Chrome storage helpers**

Use `chrome.storage.local.get` and `chrome.storage.local.set` with a stable storage key.

- [ ] **Step 3: Implement page parser**

Read JSON-LD `JobPosting`, `h1`, title, meta tags, URL hostname, and visible fallback text to infer company, role, channel, job link, status link, dates, status, and notes.

### Task 3: Popup Capture Flow

**Files:**
- Create: `outputs/job-tracker-extension/manifest.json`
- Create: `outputs/job-tracker-extension/popup.html`
- Create: `outputs/job-tracker-extension/popup.css`
- Create: `outputs/job-tracker-extension/popup.js`

**Interfaces:**
- Consumes shared helpers from Task 2.
- Produces a popup form that reads current tab info, lets the user edit, saves a record, and opens the dashboard.

- [ ] **Step 1: Create manifest**

Use Manifest V3, `action.default_popup`, permissions `activeTab`, `scripting`, and `storage`, and `host_permissions` for `http://*/*` and `https://*/*`.

- [ ] **Step 2: Create popup UI**

Build a compact form with the agreed fields, status selector, parser confidence notes, save button, re-read button, and dashboard button.

- [ ] **Step 3: Implement popup behavior**

Query active tab, execute `parseJobPage` in the current tab, prefill defaults, save via storage, and open the dashboard page.

### Task 4: Embedded Dashboard

**Files:**
- Create: `outputs/job-tracker-extension/dashboard.html`
- Create: `outputs/job-tracker-extension/dashboard.css`
- Create: `outputs/job-tracker-extension/dashboard.js`

**Interfaces:**
- Consumes shared status/storage helpers.
- Produces a full manager page inside the extension.

- [ ] **Step 1: Create dashboard shell**

Build summary cards, search, status filter, table, empty state, and edit dialog.

- [ ] **Step 2: Implement dashboard behavior**

Load records from `chrome.storage.local`, render summary/table, support edit/delete, status chip coloring, and CSV export.

### Task 5: Verification and Packaging

**Files:**
- Use: `work/test_job_tracker_extension.ps1`
- Use: `outputs/job-tracker-extension/`

**Interfaces:**
- Produces a loadable unpacked extension directory.

- [ ] **Step 1: Run static requirement checks**

Run `work/test_job_tracker_extension.ps1`. Expected: PASS.

- [ ] **Step 2: Parse JavaScript files**

Use the available JavaScript runtime to parse all extension JS files as modules. Expected: no syntax errors.

- [ ] **Step 3: Provide installation instructions**

Tell the user to open `chrome://extensions`, enable Developer mode, click “Load unpacked”, and choose `outputs/job-tracker-extension`.
