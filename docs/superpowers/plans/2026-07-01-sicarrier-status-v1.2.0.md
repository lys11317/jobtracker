# SiCarrier Parser And Failed Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release v1.2.0 of the Chrome and Edge job tracker extensions with SiCarrier simple application-card parsing and a new `已挂` status.

**Architecture:** Extend `shared/parser.js` with a fallback application-card parser for pages that show `我的申请` plus a role line followed by `校招职位 | 第一意向`. Extend `shared/statuses.js` so `已挂` behaves like a closed/failed status and sorts at the bottom. Keep Chrome as the source, then sync the same files to Edge.

**Tech Stack:** Chrome/Edge Manifest V3 extension, vanilla JavaScript modules, PowerShell static verification, Node REPL behavior checks, PowerShell `Compress-Archive`.

## Global Constraints

- Keep storage key `jobTracker.extension.records.v1` unchanged.
- Keep record field names unchanged.
- New release version is `1.2.0`.
- Produce both latest zips and versioned zips for Chrome and Edge.
- Do not auto-save parsed data.

---

### Task 1: Failing Coverage

**Files:**
- Modify: `work/test_job_tracker_extension.ps1`
- Modify: `work/test_job_tracker_edge_extension.ps1`

**Interfaces:**
- Requires status option `已挂`.
- Requires parser helpers `parseSimpleApplicationCards` and `extractSimpleApplicationRoleRow`.
- Requires versioned zip names ending in `v1.2.0.zip`.

- [ ] **Step 1: Add static assertions for version, parser, status, and zips.**
- [ ] **Step 2: Run Chrome and Edge tests and confirm they fail before implementation.**

### Task 2: Chrome Implementation

**Files:**
- Modify: `outputs/job-tracker-extension/shared/parser.js`
- Modify: `outputs/job-tracker-extension/shared/statuses.js`
- Modify: `outputs/job-tracker-extension/manifest.json`
- Modify: `outputs/job-tracker-extension/README.md`

**Interfaces:**
- `parseJobPage()` returns a candidate for SiCarrier pages with company `新凯来`, role `半导体工艺工程师`, channel `校招`, status `已投递`, and notes warning that the date is not shown.
- `STATUS_OPTIONS` includes `{ label: "已挂", tone: "closed" }`.

- [ ] **Step 1: Add `已挂` to status options and sort order.**
- [ ] **Step 2: Add simple application-card parser before falling back to job-detail parsing.**
- [ ] **Step 3: Bump Chrome manifest and README to `1.2.0`.**
- [ ] **Step 4: Verify SiCarrier, Feishu, and numeric-card parser behavior.**

### Task 3: Edge Sync And Packaging

**Files:**
- Modify: `outputs/job-tracker-edge-extension/*`
- Create: `outputs/job-tracker-extension-v1.2.0.zip`
- Create: `outputs/job-tracker-edge-extension-v1.2.0.zip`

**Interfaces:**
- Edge extension contains the same parser/status behavior as Chrome.
- Latest zip names and versioned zip names are both regenerated.

- [ ] **Step 1: Copy updated Chrome files to Edge, preserving Edge manifest description and README wording.**
- [ ] **Step 2: Package Chrome and Edge latest and versioned zips.**
- [ ] **Step 3: Run Chrome and Edge static checks and parser behavior checks.**
