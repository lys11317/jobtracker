$ErrorActionPreference = "Stop"

$root = (Resolve-Path ".").Path
$extensionDir = Join-Path $root "outputs\job-tracker-edge-extension"
$zipPath = Join-Path $root "outputs\job-tracker-edge-extension.zip"
$versionedZipPath = Join-Path $root "outputs\job-tracker-edge-extension-v1.4.5.zip"
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    $script:failures.Add($Message) | Out-Null
}

function Assert-FileExists {
    param([string]$RelativePath)
    $path = Join-Path $extensionDir $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        Add-Failure "Missing file: $RelativePath"
    }
}

function Read-Utf8 {
    param([string]$RelativePath)
    $path = Join-Path $extensionDir $RelativePath
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

$requiredFiles = @(
    "manifest.json",
    "popup.html",
    "popup.css",
    "popup.js",
    "dashboard.html",
    "dashboard.css",
    "dashboard.js",
    "README.md",
    "shared\statuses.js",
    "shared\storage.js",
    "shared\parser.js"
)

foreach ($file in $requiredFiles) {
    Assert-FileExists $file
}

if ($failures.Count -eq 0) {
    $manifestText = Read-Utf8 "manifest.json"
    $manifest = $manifestText | ConvertFrom-Json
    if ($manifest.manifest_version -ne 3) {
        Add-Failure "manifest_version must be 3"
    }
    if ($manifest.action.default_popup -ne "popup.html") {
        Add-Failure "default popup must be popup.html"
    }
    if ($manifest.name -ne "Job Tracker v1.4.5") {
        Add-Failure "manifest name must be Job Tracker v1.4.5"
    }
    if ($manifest.version -ne "1.4.5") {
        Add-Failure "manifest version must be 1.4.5"
    }
    foreach ($permission in @("activeTab", "scripting", "storage")) {
        if ($manifest.permissions -notcontains $permission) {
            Add-Failure "manifest permission missing: $permission"
        }
    }

    $readme = Read-Utf8 "README.md"
    $popupHtml = Read-Utf8 "popup.html"
    $popupCss = Read-Utf8 "popup.css"
    $popupJs = Read-Utf8 "popup.js"
    $dashboardHtml = Read-Utf8 "dashboard.html"
    $dashboardCss = Read-Utf8 "dashboard.css"
    $dashboardJs = Read-Utf8 "dashboard.js"
    $storageJs = Read-Utf8 "shared\storage.js"
    $parserJs = Read-Utf8 "shared\parser.js"
    $statusesJs = Read-Utf8 "shared\statuses.js"

    Assert-Contains $readme "edge://extensions/" "Edge install URL"
    Assert-Contains $readme "Microsoft Edge" "Edge browser name"
    Assert-Contains $readme "1.4.5" "README version"
    Assert-Contains $popupHtml "id=`"candidate-panel`"" "candidate panel"
    Assert-Contains $popupHtml "id=`"candidate-list`"" "candidate list"
    Assert-Contains $popupHtml "Job Tracker v1.4.5" "popup English version title"
    Assert-Contains $popupHtml "保存前请确认" "popup note confirmation hint"
    Assert-Contains $popupCss "candidate-panel" "candidate panel style"
    Assert-Contains $popupCss "candidate-card" "candidate card style"
    Assert-Contains $popupJs "chrome.scripting.executeScript" "page capture"
    Assert-Contains $popupJs "renderCandidates" "candidate renderer"
    Assert-Contains $popupJs "parsedCandidates" "candidate state"
    Assert-Contains $dashboardHtml "id=`"sort-select`"" "dashboard sort select"
    Assert-Contains $dashboardHtml "Job Tracker v1.4.5" "dashboard English version title"
    Assert-Contains $dashboardHtml "id=`"import-csv-button`"" "dashboard CSV import button"
    Assert-Contains $dashboardHtml "id=`"import-csv-input`"" "dashboard CSV import input"
    Assert-Contains $dashboardHtml "保存前请确认" "dashboard note confirmation hint"
    Assert-NotContains $dashboardHtml "还没有求职记录" "dashboard empty-state title"
    Assert-Contains $dashboardJs "getRecords" "dashboard storage read"
    Assert-Contains $dashboardJs "sortRecords" "dashboard sort helper"
    Assert-Contains $dashboardJs "importCsvRecords" "dashboard import helper"
    Assert-Contains $dashboardJs "function handleTableChange" "dashboard inline status change handler"
    Assert-Contains $dashboardJs "function appendStatusSelectCell" "dashboard inline status select renderer"
    Assert-Contains $dashboardJs "data-action" "dashboard inline status select action"
    Assert-Contains $dashboardJs "statusUpdatedDate: getToday()" "dashboard inline status update date"
    Assert-Contains $dashboardJs "状态已更新" "dashboard inline status toast"
    Assert-Contains $dashboardJs "cell.title = value" "dashboard text cell full-value title"
    Assert-Contains $dashboardCss "status-inline-select" "dashboard inline status select style"
    Assert-Contains $dashboardCss "width: min(1640px" "dashboard wider shell"
    Assert-Contains $dashboardCss "min-width: 1480px" "dashboard wider table"
    Assert-Contains $dashboardCss "text-align: center" "dashboard centered table text"
    Assert-Contains $dashboardCss "th:nth-child(1)" "dashboard company column width selector"
    Assert-Contains $dashboardCss "td:nth-child(1)" "dashboard company cell width selector"
    Assert-Contains $dashboardCss "th:nth-child(2)" "dashboard role column width selector"
    Assert-Contains $dashboardCss "td:nth-child(2)" "dashboard role cell width selector"
    Assert-Contains $dashboardCss "th:nth-child(4)" "dashboard channel column width selector"
    Assert-Contains $dashboardCss "td:nth-child(4)" "dashboard channel cell width selector"
    Assert-Contains $dashboardCss "min-width: 128px" "dashboard channel min width"
    Assert-Contains $dashboardCss "text-overflow: ellipsis" "dashboard single-line ellipsis"
    Assert-Contains $dashboardCss "overflow: hidden" "dashboard single-line overflow guard"
    Assert-Contains $dashboardCss "th:nth-child(3)" "dashboard applied date column width selector"
    Assert-Contains $dashboardCss "td:nth-child(3)" "dashboard applied date cell width selector"
    Assert-Contains $dashboardCss "td:nth-child(8)" "dashboard status date cell width selector"
    Assert-Contains $dashboardCss "min-width: 132px" "dashboard date column min width"
    Assert-Contains $dashboardCss "white-space: nowrap" "dashboard date no-wrap rule"
    Assert-Contains $dashboardCss "word-break: break-word" "dashboard long text wrap rule"
    Assert-Contains $storageJs "chrome.storage.local" "extension local storage"
    Assert-Contains $storageJs "function sortRecords" "sort helper"
    Assert-Contains $storageJs "function importCsvRecords" "CSV import helper"
    Assert-Contains $parserJs "JobPosting" "job posting parser"
    Assert-Contains $parserJs "function parseApplicationCards" "application card parser"
    Assert-Contains $parserJs "function parseTimedDeliveryCards" "timed delivery parser"
    Assert-Contains $parserJs "function extractTimedDeliveryRoleRow" "timed delivery role extractor"
    Assert-Contains $parserJs "function extractDeliveryDateTime" "delivery date-time extractor"
    Assert-Contains $parserJs "function parsePreferenceApplicationCards" "preference application card parser"
    Assert-Contains $parserJs "function parseSimpleApplicationCards" "simple application card parser"
    Assert-Contains $parserJs "function parseHotjobApplicationCards" "hotjob application card parser"
    Assert-Contains $parserJs "function extractHotjobApplicationRoleRow" "hotjob role extractor"
    Assert-Contains $parserJs "function extractSimpleApplicationRoleRow" "simple application role extractor"
    Assert-Contains $parserJs "function sanitizeCompanyName" "company name sanitizer"
    Assert-Contains $parserJs "我的申请" "simple application marker"
    Assert-Contains $parserJs "第一意向" "simple application intent marker"
    Assert-Contains $parserJs "function buildApplicationNotes" "blank application notes helper"
    Assert-Contains $parserJs "function inferCompanyFromZhiyeTenant" "zhiye tenant company helper"
    Assert-Contains $parserJs '"whxmc": "新芯股份"' "XMC zhiye tenant company"
    Assert-Contains $parserJs '".zhiye.com"' "zhiye tenant host guard"
    Assert-Contains $parserJs "function inferCompanyFromHotjobTenant" "hotjob tenant company helper"
    Assert-Contains $parserJs '"goertek": "Goertek"' "Goertek hotjob tenant company"
    Assert-Contains $parserJs '".hotjob.cn"' "hotjob tenant host guard"
    Assert-Contains $parserJs "投递时间：" "explicit applied time marker"
    Assert-Contains $parserJs "校园招聘 |" "timed delivery card marker"
    Assert-Contains $parserJs "第 1 志愿" "preference marker"
    Assert-Contains $parserJs "投递简历" "resume submitted marker"
    Assert-Contains $parserJs "我的投递" "hotjob application marker"
    Assert-Contains $parserJs "投递成功" "hotjob submitted marker"
    Assert-Contains $parserJs "最近投递" "hotjob latest application marker"
    Assert-NotContains $parserJs "公司名称来自页面标题或域名推断" "parser company confidence note"
    Assert-NotContains $parserJs "页面描述已用于辅助判断" "parser description confidence note"
    Assert-NotContains $parserJs "来源：投递记录页" "parser must not auto-fill notes source"
    Assert-NotContains $parserJs "页面状态：" "parser must not auto-fill status notes"
    Assert-NotContains $parserJs "完整投递时间：" "parser must not auto-fill full time notes"
    Assert-NotContains $parserJs "页面未显示投递日期，请保存前确认" "parser must not auto-fill missing-date notes"
    Assert-Contains $statusesJs "技术一面" "detailed status"
    Assert-Contains $statusesJs "HR 面" "HR status"
    Assert-Contains $statusesJs "已挂" "failed status"
}

if (-not (Test-Path -LiteralPath $zipPath)) {
    Add-Failure "Missing zip: outputs\job-tracker-edge-extension.zip"
}

if (-not (Test-Path -LiteralPath $versionedZipPath)) {
    Add-Failure "Missing versioned zip: outputs\job-tracker-edge-extension-v1.4.5.zip"
}

if ($failures.Count -gt 0) {
    "FAILED"
    $failures | ForEach-Object { "- $_" }
    exit 1
}

"PASSED"
exit 0
