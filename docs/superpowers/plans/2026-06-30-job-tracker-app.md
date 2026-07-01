# Job Tracker App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local visual job-application tracker app that replaces the plain Excel workflow for adding, viewing, filtering, editing, deleting, and exporting job records.

**Architecture:** A static browser app lives under `outputs/job-tracker-app/` and works directly from `index.html`. The UI layer renders records and forms, while client-side JavaScript stores records in `localStorage` and exports CSV without a server.

**Tech Stack:** Plain HTML, CSS, and JavaScript. No external network dependencies.

## Global Constraints

- The app must cover these fields: company, role, applied date, channel, job link, status page link, status, status updated date, notes.
- Each application is one row; the same company may appear multiple times for multiple roles.
- Status choices must include detailed interview statuses such as first interview, technical interviews, HR interview, final interview, offer, rejection, abandoned, and archived no response.
- Statuses must be visually color-coded.
- The app must include a new-record form so the user can add entries without editing a spreadsheet.
- The app must be usable by opening the generated HTML locally.
- Data must persist locally in the browser.

---

### Task 1: Requirement Test Harness

**Files:**
- Create: `work/test_job_tracker_app.ps1`

**Interfaces:**
- Consumes: expected files under `outputs/job-tracker-app/`
- Produces: a PowerShell verification script that returns exit code `0` only when the static app meets the agreed requirements.

- [ ] **Step 1: Write the failing test**

Create `work/test_job_tracker_app.ps1` to verify required files, required fields, status options, localStorage usage, CSV export, edit/delete controls, and status color mappings.

- [ ] **Step 2: Run test to verify it fails**

Run: `Invoke-Expression -Command ([System.IO.File]::ReadAllText((Resolve-Path '.\work\test_job_tracker_app.ps1'), [System.Text.Encoding]::UTF8))`

Expected: FAIL because `outputs/job-tracker-app/index.html` does not exist yet.

### Task 2: Static App Implementation

**Files:**
- Create: `outputs/job-tracker-app/index.html`
- Create: `outputs/job-tracker-app/styles.css`
- Create: `outputs/job-tracker-app/app.js`

**Interfaces:**
- Consumes: no server or network dependency.
- Produces: a local browser app opened from `outputs/job-tracker-app/index.html`.

- [ ] **Step 1: Implement page shell**

Create `index.html` with summary cards, controls, table, and add/edit dialog form.

- [ ] **Step 2: Implement visual design**

Create `styles.css` with a quiet operations-style layout, responsive table/form behavior, and colored status chips.

- [ ] **Step 3: Implement app behavior**

Create `app.js` with status definitions, localStorage persistence, add/edit/delete, search, status filtering, CSV export, sample-free empty state, and link handling.

- [ ] **Step 4: Run the requirement test**

Run the same PowerShell verification script.

Expected: PASS with all requirement checks.

### Task 3: Browser Workflow Verification

**Files:**
- Use: `outputs/job-tracker-app/index.html`

**Interfaces:**
- Consumes: the generated static app.
- Produces: manual workflow evidence from the browser.

- [ ] **Step 1: Open the local app**

Open `outputs/job-tracker-app/index.html` in the in-app browser.

- [ ] **Step 2: Add a record**

Fill company, role, dates, links, status, and notes. Save it.

- [ ] **Step 3: Verify UI behavior**

Confirm the record appears, the status chip is colored, summary counts update, filtering/search works, edit works, delete works, and CSV export is available.
