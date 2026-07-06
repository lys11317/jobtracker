$ErrorActionPreference = "Stop"

Invoke-Expression -Command ([System.IO.File]::ReadAllText(
    (Resolve-Path ".\work\test_job_tracker_chrome_no_remote_sync.ps1"),
    [System.Text.Encoding]::UTF8
))
