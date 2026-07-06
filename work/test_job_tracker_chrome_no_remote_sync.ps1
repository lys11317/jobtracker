$ErrorActionPreference = "Stop"

$root = (Resolve-Path ".").Path
$extensionDir = Join-Path $root "outputs\job-tracker-extension"
$zipPath = Join-Path $root "outputs\job-tracker-extension-v1.6.1.zip"
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    $script:failures.Add($Message) | Out-Null
}

function Read-Utf8 {
    param([string]$RelativePath)
    $path = Join-Path $extensionDir $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        Add-Failure "Missing file: $RelativePath"
        return ""
    }
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Assert-Contains {
    param([string]$Content, [string]$Needle, [string]$Label)
    if (-not $Content.Contains($Needle)) {
        Add-Failure "$Label missing: $Needle"
    }
}

function Assert-NotContains {
    param([string]$Content, [string]$Needle, [string]$Label)
    if ($Content.Contains($Needle)) {
        Add-Failure "$Label should not contain: $Needle"
    }
}

function Assert-FileMissing {
    param([string]$RelativePath)
    $path = Join-Path $extensionDir $RelativePath
    if (Test-Path -LiteralPath $path) {
        Add-Failure "Remote sync file should be removed: $RelativePath"
    }
}

$manifestText = Read-Utf8 "manifest.json"
$dashboardHtml = Read-Utf8 "dashboard.html"
$dashboardJs = Read-Utf8 "dashboard.js"
$dashboardCss = Read-Utf8 "dashboard.css"
$readme = Read-Utf8 "README.md"

if ($manifestText) {
    $manifest = $manifestText | ConvertFrom-Json
    if ($manifest.name -ne "Job Tracker v1.6.1") {
        Add-Failure "manifest name must be Job Tracker v1.6.1"
    }
    if ($manifest.version -ne "1.6.1") {
        Add-Failure "manifest version must be 1.6.1"
    }
}

foreach ($requiredFile in @(
    "popup.html",
    "popup.css",
    "popup.js",
    "dashboard.html",
    "dashboard.css",
    "dashboard.js",
    "shared\pdf-export.js",
    "shared\statuses.js",
    "shared\storage.js",
    "shared\parser.js"
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $extensionDir $requiredFile))) {
        Add-Failure "Missing required extension file: $requiredFile"
    }
}

foreach ($removedFile in @(
    "shared\cloud-sync.js",
    "shared\supabase-sync.js",
    "shared\mobile-export.js"
)) {
    Assert-FileMissing $removedFile
}

foreach ($content in @($dashboardHtml, $dashboardJs, $dashboardCss, $readme)) {
    Assert-NotContains $content "Supabase" "remote sync text"
    Assert-NotContains $content "supabase" "remote sync text"
    Assert-NotContains $content "PWA" "remote sync text"
    Assert-NotContains $content "云同步" "remote sync text"
    Assert-NotContains $content "远程同步" "remote sync text"
    Assert-NotContains $content "同步到手机" "remote sync text"
    Assert-NotContains $content "从手机同步" "remote sync text"
    Assert-NotContains $content "手机同步" "remote sync text"
    Assert-NotContains $content "生成手机版" "mobile export text"
    Assert-NotContains $content "export-mobile" "mobile export code"
    Assert-NotContains $content "downloadMobileHtml" "mobile export code"
    Assert-NotContains $content "cloud-sync" "remote sync text"
    Assert-NotContains $content "pushRecordsToCloud" "remote sync code"
    Assert-NotContains $content "pullRecordsFromCloud" "remote sync code"
    Assert-NotContains $content "getCloudSyncSettings" "remote sync code"
    Assert-NotContains $content "copyMobileSetupLink" "remote sync code"
}

Assert-Contains $dashboardHtml "Job Tracker v1.6.1" "dashboard version"
Assert-Contains $dashboardHtml "id=`"export-pdf-button`"" "PDF export button"
Assert-Contains $dashboardHtml "id=`"export-csv-button`"" "CSV export button"
Assert-Contains $dashboardHtml "id=`"import-csv-button`"" "CSV import button"
Assert-Contains $dashboardHtml "id=`"records-body`"" "records table"
Assert-Contains $dashboardJs "getRecords" "storage read"
Assert-Contains $dashboardJs "downloadCsv" "CSV export"
Assert-Contains $dashboardJs "downloadPdf" "PDF export"
Assert-Contains $dashboardJs "importCsvRecords" "CSV import"
Assert-Contains $dashboardJs "function appendStatusSelectCell" "inline status select"

$pdfExportJs = Read-Utf8 "shared\pdf-export.js"
Assert-Contains $pdfExportJs "function buildPdfHtml" "PDF HTML builder"
Assert-Contains $pdfExportJs "function downloadPdf" "PDF export helper"
Assert-Contains $pdfExportJs "window.print" "PDF print handoff"

if (-not (Test-Path -LiteralPath $zipPath)) {
    Add-Failure "Missing versioned Chrome zip: outputs\job-tracker-extension-v1.6.1.zip"
}

if ($failures.Count -gt 0) {
    "FAILED"
    $failures | ForEach-Object { "- $_" }
    exit 1
}

"PASSED"
exit 0
