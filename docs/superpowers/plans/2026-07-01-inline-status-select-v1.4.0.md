# Inline Status Select v1.4.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add direct status dropdown editing to the Chrome and Edge extension manager tables.

**Architecture:** Reuse the existing `STATUS_OPTIONS`, `statusTone`, `getToday`, `normalizeRecord`, and `updateRecord` helpers. The dashboard keeps a single delegated click handler for edit/delete and gains a delegated change handler for inline status selects.

**Tech Stack:** Manifest V3 extension, vanilla JavaScript modules, CSS, PowerShell static verification scripts.

## Global Constraints

- Chrome and Edge extension versions must be `1.4.0`.
- Do not change the storage key `jobTracker.extension.records.v1`.
- Do not add remote scripts, remote styles, or new dependencies.
- Keep Chrome and Edge feature behavior identical.
- The table dropdown must update `statusUpdatedDate` to `getToday()` on status change.

---

### Task 1: Add Failing Static Tests

**Files:**
- Modify: `work/test_job_tracker_extension.ps1`
- Modify: `work/test_job_tracker_edge_extension.ps1`

**Interfaces:**
- Consumes: Existing test helpers `Assert-Contains`, `Read-Utf8`, and manifest checks.
- Produces: Failing checks for v1.4.0 packaging and dashboard inline status behavior.

- [ ] **Step 1: Update version assertions**

Change Chrome and Edge tests so they expect `1.4.0` in manifests, README text where applicable, and versioned zip filenames.

- [ ] **Step 2: Add inline status assertions**

Add checks that `dashboard.js` contains `handleTableChange`, `appendStatusSelectCell`, `statusUpdatedDate: getToday()`, and `状态已更新`, and that `dashboard.css` contains `status-inline-select`.

- [ ] **Step 3: Run tests and verify RED**

Run:

```powershell
Invoke-Expression -Command ([System.IO.File]::ReadAllText((Resolve-Path '.\work\test_job_tracker_extension.ps1'), [System.Text.Encoding]::UTF8))
Invoke-Expression -Command ([System.IO.File]::ReadAllText((Resolve-Path '.\work\test_job_tracker_edge_extension.ps1'), [System.Text.Encoding]::UTF8))
```

Expected: both fail because the feature and v1.4.0 zips do not exist yet.

### Task 2: Implement Chrome Inline Status Select

**Files:**
- Modify: `outputs/job-tracker-extension/dashboard.js`
- Modify: `outputs/job-tracker-extension/dashboard.css`
- Modify: `outputs/job-tracker-extension/manifest.json`
- Modify: `outputs/job-tracker-extension/README.md`

**Interfaces:**
- Consumes: `STATUS_OPTIONS`, `getToday`, `statusTone`, `normalizeRecord`, and `updateRecord`.
- Produces: `handleTableChange(event)`, `updateStatusFromTable(id, status)`, and `appendStatusSelectCell(row, record)`.

- [ ] **Step 1: Wire the delegated change handler**

Add `els.recordsBody.addEventListener("change", handleTableChange);` inside `bindEvents()`.

- [ ] **Step 2: Save status changes**

Create `handleTableChange(event)` and `updateStatusFromTable(id, status)` so changing a status select updates the matching record, sets `statusUpdatedDate: getToday()`, saves through `updateRecord`, rerenders, and shows `状态已更新`.

- [ ] **Step 3: Render dropdowns**

Replace `appendStatusCell(row, record.status);` with `appendStatusSelectCell(row, record);`. The select must use `STATUS_OPTIONS` and apply `status-inline-select status--${statusTone(record.status)}`.

- [ ] **Step 4: Style dropdowns**

Add `.status-inline-select` CSS with compact pill styling and focus state.

- [ ] **Step 5: Bump Chrome version**

Update manifest and README version text to `1.4.0`.

### Task 3: Sync Edge and Package

**Files:**
- Modify: `outputs/job-tracker-edge-extension/dashboard.js`
- Modify: `outputs/job-tracker-edge-extension/dashboard.css`
- Modify: `outputs/job-tracker-edge-extension/manifest.json`
- Modify: `outputs/job-tracker-edge-extension/README.md`
- Create: `outputs/job-tracker-extension-v1.4.0.zip`
- Create: `outputs/job-tracker-edge-extension-v1.4.0.zip`
- Modify: `outputs/job-tracker-extension.zip`
- Modify: `outputs/job-tracker-edge-extension.zip`

**Interfaces:**
- Consumes: Chrome extension files from Task 2.
- Produces: Matching Edge behavior and both latest/versioned zip artifacts.

- [ ] **Step 1: Copy shared manager files to Edge**

Copy Chrome popup, dashboard, and shared JavaScript files to Edge, then keep the Edge manifest description and README browser-specific text.

- [ ] **Step 2: Bump Edge version**

Update Edge manifest and README version text to `1.4.0`.

- [ ] **Step 3: Rebuild zips**

Create latest and versioned zip files for Chrome and Edge.

### Task 4: Verify

**Files:**
- Test: `work/test_job_tracker_extension.ps1`
- Test: `work/test_job_tracker_edge_extension.ps1`
- Test: `outputs/job-tracker-extension/dashboard.js`
- Test: `outputs/job-tracker-edge-extension/dashboard.js`

**Interfaces:**
- Consumes: Completed Chrome and Edge extension directories.
- Produces: Fresh verification output and artifact list.

- [ ] **Step 1: Run static tests**

Run both PowerShell tests and confirm they print `PASSED`.

- [ ] **Step 2: Import JavaScript modules**

Import both dashboard modules with a fake DOM and Chrome extension API to catch syntax/runtime import errors.

- [ ] **Step 3: List artifacts**

List latest and versioned zip files with size and timestamp.
