# Application Card Parser Design

## Goal

Improve the Chrome job tracker extension so it can read application-list pages, such as a company personal center page, where the submitted role appears inside an application card instead of a standard job-detail page.

## User Problem

Some recruiting sites show applied jobs in a personal center. The old parser prioritizes JobPosting JSON-LD, page H1, title, and host name. On pages where the H1 is "个人中心", it can miss the real submitted role, company, and applied date.

## Design

Add an application-card parsing path before the existing job-detail fallback.

- Detect application cards by text markers such as "投递时间", "进入面试环节", "修改简历", and a role line ending with a numeric job id.
- Extract the role from lines like `AI+无机/有机材料研发（四川成都） （4341535）`, preserving the location text and removing only the final numeric job id.
- Extract applied date from `投递时间：YYYY-MM-DD HH:mm:ss`.
- Extract company from visible brand/header text when possible, falling back to the existing title/host logic.
- Extract channel from visible labels such as `校招`, `社招`, or `留学生招聘`.
- Preserve page status text, card details, and job id in notes.
- Return multiple candidate records when more than one application card is visible.

## Popup Behavior

The popup still auto-fills one record by default. If several application-card candidates are found, show a compact candidate picker above the form. Clicking a candidate fills the existing fields. The user still reviews and saves manually.

## Compatibility

The stored record fields and storage key stay unchanged:

- `company`
- `role`
- `appliedDate`
- `channel`
- `jobLink`
- `statusLink`
- `status`
- `statusUpdatedDate`
- `notes`

Existing Chrome extension data remains readable without export or migration.

## Testing

Add tests that fail before implementation and pass after implementation:

- Static extension test checks that parser exposes application-card support and popup exposes candidate UI.
- Parser behavior test simulates the 三环集团 personal center text and verifies company, role, applied date, channel, status link, status, notes, and candidates.
- Existing storage, CSV import/export, sort, and manifest checks continue to pass.
