# Inline Status Select Design

## Goal

Add a direct status dropdown to the extension manager table so a job record can be updated without opening the edit dialog.

## Requirements

- Chrome and Edge extensions ship as version `1.4.0`.
- The manager table status column renders a dropdown using the same `STATUS_OPTIONS` list as the popup and edit dialog.
- The dropdown includes all current statuses, including `已挂`.
- Changing the dropdown saves the record immediately with `updateRecord`.
- Changing the dropdown also updates `statusUpdatedDate` to today's date through `getToday()`.
- The table rerenders after save so filters, status sorting, and summary cards reflect the new status.
- The dropdown keeps the existing status color language by applying the `status--<tone>` classes.
- The edit dialog remains available for changing other fields.

## User Flow

1. The user opens the manager page.
2. Each row shows a colored status dropdown in the status column.
3. The user chooses a new status directly in the table.
4. The extension saves the change, refreshes the current view, and shows `状态已更新`.

## Files

- `outputs/job-tracker-extension/dashboard.js`: render status dropdowns and handle table change events.
- `outputs/job-tracker-extension/dashboard.css`: style the inline status select.
- `outputs/job-tracker-extension/manifest.json`: bump Chrome extension version.
- `outputs/job-tracker-extension/README.md`: update Chrome version text.
- `outputs/job-tracker-edge-extension/*`: mirror the Chrome manager behavior for Edge and bump version.
- `work/test_job_tracker_extension.ps1`: assert Chrome v1.4.0 and inline status behavior markers.
- `work/test_job_tracker_edge_extension.ps1`: assert Edge v1.4.0 and inline status behavior markers.

## Test Plan

- Update tests first so they fail against v1.3.0.
- Implement the manager table dropdown.
- Run Chrome and Edge static tests.
- Import the dashboard modules with a fake browser environment to catch syntax errors.
- Rebuild latest and versioned zip packages.
