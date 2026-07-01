# Job Tracker Extension Sort and Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Chrome job tracker extension dashboard with status-aware sorting, date sorting choices, and CSV import without changing the existing storage key or record fields.

**Architecture:** Keep the current Manifest V3 extension in `outputs/job-tracker-extension/`. Add pure helper functions to shared modules for status rank, record sorting, CSV parsing, duplicate detection, and import merging; then wire dashboard controls to those helpers.

**Tech Stack:** Plain HTML, CSS, JavaScript, Chrome Extension Manifest V3, PowerShell static checks, Node REPL module checks.

## Global Constraints

- Keep storage key `jobTracker.extension.records.v1`.
- Keep existing fields: `company`, `role`, `appliedDate`, `channel`, `jobLink`, `statusLink`, `status`, `statusUpdatedDate`, `notes`.
- Default dashboard sort is status order.
- Support sorting by status order, applied date newest/oldest, and status update date newest/oldest.
- CSV import uses Chinese exported headers, skips duplicates by company + role + job link, does not overwrite existing records, defaults unknown statuses to `已投递`, and defaults missing dates to today.
- Rebuild `outputs/job-tracker-extension.zip` after changes.

---

### Task 1: Requirement Tests

**Files:**
- Modify: `work/test_job_tracker_extension.ps1`

**Interfaces:**
- Consumes: extension files under `outputs/job-tracker-extension/`
- Produces: failing checks for new controls and helper functions before implementation.

- [ ] Add checks for `sort-select`, `import-csv-button`, and `import-csv-input`.
- [ ] Add checks for `sortRecords`, `importCsvRecords`, `parseCsv`, `mergeImportedRecords`, and stable storage key.
- [ ] Run the test and confirm it fails before implementation.

### Task 2: Shared Helpers

**Files:**
- Modify: `outputs/job-tracker-extension/shared/statuses.js`
- Modify: `outputs/job-tracker-extension/shared/storage.js`

**Interfaces:**
- `statusRank(status: string): number`
- `sortRecords(records: object[], mode: string): object[]`
- `parseCsv(csvText: string): string[][]`
- `recordsFromCsv(csvText: string): object[]`
- `mergeImportedRecords(existing: object[], imported: object[]): { records: object[], importedCount: number, skippedCount: number }`
- `importCsvRecords(csvText: string): Promise<{ records: object[], importedCount: number, skippedCount: number }>`

- [ ] Add status rank and sort helper.
- [ ] Add robust CSV parser for quoted fields and UTF-8 BOM.
- [ ] Map Chinese CSV headers into existing record fields.
- [ ] Merge without overwriting existing records.

### Task 3: Dashboard UI and Behavior

**Files:**
- Modify: `outputs/job-tracker-extension/dashboard.html`
- Modify: `outputs/job-tracker-extension/dashboard.css`
- Modify: `outputs/job-tracker-extension/dashboard.js`

**Interfaces:**
- Consumes shared helpers from Task 2.
- Produces visible sort and CSV import controls.

- [ ] Add sort dropdown to toolbar.
- [ ] Add import CSV button and hidden file input.
- [ ] Use `sortRecords(filteredRecords(), sortMode)` before rendering.
- [ ] Import selected CSV and refresh dashboard with summary toast.

### Task 4: Verification and Packaging

**Files:**
- Use: `work/test_job_tracker_extension.ps1`
- Modify: `outputs/job-tracker-extension.zip`

**Interfaces:**
- Produces updated zip and verified extension directory.

- [ ] Run static extension checks.
- [ ] Parse JavaScript modules.
- [ ] Run pure helper tests for sort and CSV import behavior.
- [ ] Rebuild `outputs/job-tracker-extension.zip`.
