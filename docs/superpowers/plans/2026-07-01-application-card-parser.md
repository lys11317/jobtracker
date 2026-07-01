# Application Card Parser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add application-list card parsing and candidate selection to the Chrome job tracker extension.

**Architecture:** `shared/parser.js` will detect and parse application cards before falling back to job-detail parsing. `popup.js` and `popup.html` will show a candidate picker when multiple records are found while keeping the existing save flow and storage schema unchanged.

**Tech Stack:** Chrome Manifest V3 extension, vanilla JavaScript modules, local `chrome.storage.local`, PowerShell static checks, Node-based parser behavior checks.

## Global Constraints

- Do not change `jobTracker.extension.records.v1`.
- Do not change existing record field names.
- Do not auto-save parsed data.
- Keep the parser local to the browser page, without network requests.
- Rebuild `outputs/job-tracker-extension.zip` after verification.

---

### Task 1: Parser Regression Coverage

**Files:**
- Modify: `work/test_job_tracker_extension.ps1`
- Verify with: Node parser behavior check in the current session

**Interfaces:**
- Consumes: existing `globalThis.JobTrackerParser.parseJobPage()`
- Produces: expected parser output with `candidates`

- [ ] **Step 1: Write failing static checks**

Add assertions that `shared/parser.js` contains `parseApplicationCards`, `extractRoleFromApplicationLine`, and `candidates`, and that the popup contains `candidate-list` UI.

- [ ] **Step 2: Run static check and confirm failure**

Run:

```powershell
Invoke-Expression -Command ([System.IO.File]::ReadAllText((Resolve-Path '.\work\test_job_tracker_extension.ps1'), [System.Text.Encoding]::UTF8))
```

Expected: FAIL because application-card parser and candidate UI do not exist yet.

### Task 2: Parser Implementation

**Files:**
- Modify: `outputs/job-tracker-extension/shared/parser.js`

**Interfaces:**
- Consumes: `document.body.innerText`, `document.title`, `location.href`, `location.hostname`
- Produces: `parseJobPage()` result containing one primary record plus optional `candidates`

- [ ] **Step 1: Implement application-card parsing**

Add helpers:

- `parseApplicationCards(context)`
- `extractRoleFromApplicationLine(line)`
- `extractAppliedDate(text)`
- `inferCompanyFromVisibleText(lines)`
- `inferApplicationStatus(text)`

- [ ] **Step 2: Verify parser behavior**

Run a Node check that simulates the 三环集团 personal center page and confirms:

- company is `三环集团`
- role is `AI+无机/有机材料研发（四川成都）`
- applied date is `2026-06-13`
- channel is `校招`
- status is `等待一面`
- notes include `进入面试环节`
- `candidates.length` is at least `1`

### Task 3: Candidate Picker UI

**Files:**
- Modify: `outputs/job-tracker-extension/popup.html`
- Modify: `outputs/job-tracker-extension/popup.css`
- Modify: `outputs/job-tracker-extension/popup.js`

**Interfaces:**
- Consumes: parser output property `candidates`
- Produces: clickable candidate buttons that call `fillForm(candidate)`

- [ ] **Step 1: Add popup markup**

Add a hidden candidate region with `candidate-panel` and `candidate-list`.

- [ ] **Step 2: Add popup behavior**

Store parsed candidates in memory and render buttons when two or more candidates exist. Selecting a button fills the form.

- [ ] **Step 3: Add popup styles**

Style the candidate panel as a compact list that fits the 420px popup width.

### Task 4: Verification And Packaging

**Files:**
- Modify: `outputs/job-tracker-extension/README.md`
- Rebuild: `outputs/job-tracker-extension.zip`

**Interfaces:**
- Consumes: verified extension directory
- Produces: updated shareable zip

- [ ] **Step 1: Update README**

Mention that personal-center/application-list pages with multiple records can show a candidate picker.

- [ ] **Step 2: Run static and behavior checks**

Run the PowerShell static check and Node parser behavior check.

- [ ] **Step 3: Rebuild zip**

Create a fresh `outputs/job-tracker-extension.zip` from the extension folder.
