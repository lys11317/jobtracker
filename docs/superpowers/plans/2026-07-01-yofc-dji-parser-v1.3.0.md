# YOFC And DJI Parser v1.3.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release v1.3.0 of the Chrome and Edge job tracker extensions with accurate parsing for YOFC/Zhiye timed delivery records and DJI application cards.

**Architecture:** Add a timed delivery-card parser before the existing simple and fallback parsers. It handles role lines followed by `校园招聘 | 2026-06-28 13:14 投递` and role cards containing `投递时间：2026-06-26`. It returns candidates with accurate `appliedDate`, keeps the complete timestamp in notes, and preserves existing record fields and storage key.

**Tech Stack:** Chrome/Edge Manifest V3 extension, vanilla JavaScript modules, PowerShell static checks, Node REPL behavior checks, PowerShell `Compress-Archive`.

## Global Constraints

- Keep storage key `jobTracker.extension.records.v1` unchanged.
- Keep record field names unchanged.
- New release version is `1.3.0`.
- Produce both latest zips and versioned zips for Chrome and Edge.
- Do not auto-save parsed data.

---

### Task 1: Failing Coverage

**Files:**
- Modify: `work/test_job_tracker_extension.ps1`
- Modify: `work/test_job_tracker_edge_extension.ps1`

**Interfaces:**
- Requires parser helpers `parseTimedDeliveryCards`, `extractTimedDeliveryRoleRow`, and `extractDeliveryDateTime`.
- Requires versioned zip names ending in `v1.3.0.zip`.

- [ ] **Step 1: Add static assertions for version, parser helpers, and timestamp note markers.**
- [ ] **Step 2: Run Chrome and Edge tests and confirm they fail before implementation.**
- [ ] **Step 3: Run behavior checks showing YOFC and DJI currently fail.**

### Task 2: Chrome Implementation

**Files:**
- Modify: `outputs/job-tracker-extension/shared/parser.js`
- Modify: `outputs/job-tracker-extension/manifest.json`
- Modify: `outputs/job-tracker-extension/README.md`

**Interfaces:**
- `parseJobPage()` returns YOFC candidates for `工艺工程师` and `研发工程师（材料）`, both with `appliedDate` of `2026-06-28` and notes containing the full time.
- `parseJobPage()` returns a DJI candidate for `产品项目管理岗（深圳）` with `appliedDate` of `2026-06-26` and status `简历筛选中`.

- [ ] **Step 1: Add timed delivery parser before existing simple/fallback parsers.**
- [ ] **Step 2: Improve company inference for Chinese title strings such as `长飞光纤光缆股份有限公司 27届校园招聘`.**
- [ ] **Step 3: Bump Chrome manifest and README to `1.3.0`.**
- [ ] **Step 4: Verify YOFC, DJI, SiCarrier, Feishu, and numeric-card behavior.**

### Task 3: Edge Sync And Packaging

**Files:**
- Modify: `outputs/job-tracker-edge-extension/*`
- Create: `outputs/job-tracker-extension-v1.3.0.zip`
- Create: `outputs/job-tracker-edge-extension-v1.3.0.zip`

**Interfaces:**
- Edge extension contains the same parser behavior as Chrome.
- Latest zip names and versioned zip names are both regenerated.

- [ ] **Step 1: Copy updated Chrome code files to Edge, preserving Edge manifest description and README wording.**
- [ ] **Step 2: Package Chrome and Edge latest and versioned zips.**
- [ ] **Step 3: Run Chrome and Edge static checks and parser behavior checks.**
