# Known Parsing Issues

这些问题用于记录解析器历史问题和补丁状态。

## BASF / SuccessFactors application page

- Status: resolved in `v1.4.7`
- Recorded: 2026-07-01
- Host: `career5.successfactors.eu`
- Page: `#/applications`, BASF `My Applications`
- Current incorrect capture:
  - Company: `Successfactors`
  - Role: `Privacy policy`
  - Applied date: current date fallback
- Expected capture:
  - Company: `BASF`
  - Role: `Chemist/Senior Chemist, Analytical Science (Spectroscopy)`
  - Applied date: `2026-06-26`
  - Status: keep as submitted/waiting, based on the application card text
- Useful visible text:
  - `Review your applications`
  - `Requisition ID: 139166`
  - `Applied On: Jun 26, 2026`
  - `Thanks for your application. You will receive feedback on your application shortly.`
- Proposed patch:
  - Add a SuccessFactors application-card parser.
  - Prefer BASF branding/header over the `successfactors.eu` platform host.
  - Extract application card title and `Applied On` date.
