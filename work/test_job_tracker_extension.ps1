$ErrorActionPreference = "Stop"

$root = (Resolve-Path ".").Path
$extensionDir = Join-Path $root "outputs\job-tracker-extension"
$versionedZipPath = Join-Path $root "outputs\job-tracker-extension-v1.4.7.zip"
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

function Assert-Regex {
    param([string]$Content, [string]$Pattern, [string]$Label)
    if ($Content -notmatch $Pattern) {
        Add-Failure "$Label missing pattern: $Pattern"
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
    if ($manifest.name -ne "Job Tracker v1.4.7") {
        Add-Failure "manifest name must be Job Tracker v1.4.7"
    }
    if ($manifest.version -ne "1.4.7") {
        Add-Failure "manifest version must be 1.4.7"
    }
    if ($manifest.action.default_popup -ne "popup.html") {
        Add-Failure "default popup must be popup.html"
    }
    foreach ($permission in @("activeTab", "scripting", "storage")) {
        if ($manifest.permissions -notcontains $permission) {
            Add-Failure "manifest permission missing: $permission"
        }
    }
    foreach ($hostPermission in @("http://*/*", "https://*/*")) {
        if ($manifest.host_permissions -notcontains $hostPermission) {
            Add-Failure "host permission missing: $hostPermission"
        }
    }

    $popupHtml = Read-Utf8 "popup.html"
    $popupCss = Read-Utf8 "popup.css"
    $popupJs = Read-Utf8 "popup.js"
    $dashboardHtml = Read-Utf8 "dashboard.html"
    $dashboardCss = Read-Utf8 "dashboard.css"
    $dashboardJs = Read-Utf8 "dashboard.js"
    $statusesJs = Read-Utf8 "shared\statuses.js"
    $storageJs = Read-Utf8 "shared\storage.js"
    $parserJs = Read-Utf8 "shared\parser.js"

    Assert-Contains $popupHtml "popup.css" "popup stylesheet"
    Assert-Contains $popupHtml "popup.js" "popup script"
    Assert-Contains $popupHtml "Job Tracker v1.4.7" "popup English version title"
    Assert-Contains $popupHtml "id=`"capture-form`"" "popup capture form"
    Assert-Contains $popupHtml "id=`"candidate-panel`"" "candidate panel"
    Assert-Contains $popupHtml "id=`"candidate-list`"" "candidate list"
    Assert-Contains $popupHtml "id=`"read-page-button`"" "read page button"
    Assert-Contains $popupHtml "id=`"open-dashboard-button`"" "dashboard button"
    Assert-Contains $popupHtml "保存前请确认" "popup note confirmation hint"
    Assert-Contains $popupJs "chrome.tabs.query" "active tab query"
    Assert-Contains $popupJs "chrome.scripting.executeScript" "page parser execution"
    Assert-Contains $popupJs "renderCandidates" "candidate renderer"
    Assert-Contains $popupJs "parsedCandidates" "candidate state"
    Assert-Contains $popupJs "saveRecord" "popup save"
    Assert-Contains $popupJs "dashboard.html" "dashboard open"
    Assert-Contains $popupCss "candidate-panel" "candidate panel style"
    Assert-Contains $popupCss "candidate-card" "candidate card style"

    Assert-Contains $dashboardHtml "dashboard.css" "dashboard stylesheet"
    Assert-Contains $dashboardHtml "dashboard.js" "dashboard script"
    Assert-Contains $dashboardHtml "Job Tracker v1.4.7" "dashboard English version title"
    Assert-Contains $dashboardHtml "id=`"records-body`"" "dashboard table body"
    Assert-Contains $dashboardHtml "id=`"search-input`"" "dashboard search"
    Assert-Contains $dashboardHtml "id=`"status-filter`"" "dashboard status filter"
    Assert-Contains $dashboardHtml "id=`"sort-select`"" "dashboard sort select"
    Assert-Contains $dashboardHtml "id=`"import-csv-button`"" "dashboard CSV import button"
    Assert-Contains $dashboardHtml "id=`"import-csv-input`"" "dashboard CSV import input"
    Assert-Contains $dashboardHtml "id=`"export-csv-button`"" "dashboard export button"
    Assert-Contains $dashboardHtml "保存前请确认" "dashboard note confirmation hint"
    Assert-NotContains $dashboardHtml "还没有求职记录" "dashboard empty-state title"
    Assert-Contains $dashboardJs "getRecords" "dashboard storage read"
    Assert-Contains $dashboardJs "updateRecord" "dashboard update"
    Assert-Contains $dashboardJs "deleteRecord" "dashboard delete"
    Assert-Contains $dashboardJs "exportRecordsToCsv" "dashboard export"
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

    foreach ($field in @("company", "role", "appliedDate", "channel", "jobLink", "statusLink", "status", "statusUpdatedDate", "notes")) {
        Assert-Contains $popupHtml "name=`"$field`"" "popup field"
        Assert-Contains $dashboardHtml "name=`"$field`"" "dashboard field"
        Assert-Contains $storageJs $field "storage field"
    }

    $statuses = @(
        "准备投递",
        "已投递",
        "已查看",
        "等待回复",
        "简历筛选中",
        "测评 / 笔试",
        "等待一面",
        "一面 / 初面",
        "技术一面",
        "技术二面",
        "技术三面",
        "HR 面",
        "部门负责人面",
        "终面",
        "等待面试结果",
        "Offer 沟通中",
        "已 Offer",
        "已挂",
        "已拒绝",
        "已放弃",
        "无回应归档"
    )

    foreach ($status in $statuses) {
        Assert-Contains $statusesJs $status "status option"
    }

    Assert-Contains $popupJs "DEFAULT_CAPTURE_STATUS = `"已投递`"" "default popup status"
    Assert-Contains $storageJs "jobTracker.extension.records.v1" "extension storage key"
    Assert-Contains $storageJs "chrome.storage.local.get" "chrome storage get"
    Assert-Contains $storageJs "chrome.storage.local.set" "chrome storage set"
    Assert-Contains $storageJs "function exportRecordsToCsv" "CSV helper"
    Assert-Contains $storageJs "function sortRecords" "sort helper"
    Assert-Contains $storageJs "function parseCsv" "CSV parser helper"
    Assert-Contains $storageJs "function recordsFromCsv" "CSV record mapper"
    Assert-Contains $storageJs "function mergeImportedRecords" "CSV merge helper"
    Assert-Contains $storageJs "function importCsvRecords" "CSV import helper"
    Assert-Contains $statusesJs "function statusRank" "status rank helper"
    Assert-Contains $parserJs "function parseJobPage" "parser function"
    Assert-Contains $parserJs "function parseApplicationCards" "application card parser"
    Assert-Contains $parserJs "function parseTimedDeliveryCards" "timed delivery parser"
    Assert-Contains $parserJs "function parseSuccessFactorsApplicationCards" "SuccessFactors application card parser"
    Assert-Contains $parserJs "function extractSuccessFactorsApplicationRoleRow" "SuccessFactors role extractor"
    Assert-Contains $parserJs "function parseWorkdayApplicationCards" "Workday application table parser"
    Assert-Contains $parserJs "function extractWorkdayApplicationRoleRow" "Workday role extractor"
    Assert-Contains $parserJs "function extractTimedDeliveryRoleRow" "timed delivery role extractor"
    Assert-Contains $parserJs "function extractDeliveryDateTime" "delivery date-time extractor"
    Assert-Contains $parserJs "function parsePreferenceApplicationCards" "preference application card parser"
    Assert-Contains $parserJs "function parseSimpleApplicationCards" "simple application card parser"
    Assert-Contains $parserJs "function parseMokahrApplicationCards" "Moka application card parser"
    Assert-Contains $parserJs "function extractMokahrApplicationRoleRow" "Moka role extractor"
    Assert-Contains $parserJs "function parseHotjobApplicationCards" "hotjob application card parser"
    Assert-Contains $parserJs "function extractHotjobApplicationRoleRow" "hotjob role extractor"
    Assert-Contains $parserJs "function extractSimpleApplicationRoleRow" "simple application role extractor"
    Assert-Contains $parserJs "function extractRoleFromApplicationLine" "application role extractor"
    Assert-Contains $parserJs "function sanitizeCompanyName" "company name sanitizer"
    Assert-Contains $parserJs "candidates" "parser candidates"
    Assert-Contains $parserJs "我的申请" "simple application marker"
    Assert-Contains $parserJs "第一意向" "simple application intent marker"
    Assert-Contains $parserJs "function buildApplicationNotes" "blank application notes helper"
    Assert-Contains $parserJs "function inferCompanyFromZhiyeTenant" "zhiye tenant company helper"
    Assert-Contains $parserJs '"whxmc": "新芯股份"' "XMC zhiye tenant company"
    Assert-Contains $parserJs '".zhiye.com"' "zhiye tenant host guard"
    Assert-Contains $parserJs "function inferCompanyFromHotjobTenant" "hotjob tenant company helper"
    Assert-Contains $parserJs '"goertek": "Goertek"' "Goertek hotjob tenant company"
    Assert-Contains $parserJs '".hotjob.cn"' "hotjob tenant host guard"
    Assert-Contains $parserJs "function parseEnglishDate" "English date parser"
    Assert-Contains $parserJs "successfactors" "SuccessFactors host marker"
    Assert-Contains $parserJs "myworkdaysite.com" "Workday host marker"
    Assert-Contains $parserJs "BASF" "BASF company marker"
    Assert-Contains $parserJs "Onto Innovation" "Onto company marker"
    Assert-Contains $parserJs "function isGenericRecruitingTitlePart" "generic recruiting title filter"
    Assert-Contains $parserJs "app.mokahr.com" "Moka host marker"
    Assert-Contains $parserJs "投递时间：" "explicit applied time marker"
    Assert-Contains $parserJs "校园招聘 |" "timed delivery card marker"
    Assert-Contains $parserJs "投递时间" "application applied time marker"
    Assert-Contains $parserJs "进入面试环节" "application interview marker"
    Assert-Contains $parserJs "第 1 志愿" "preference marker"
    Assert-Contains $parserJs "投递简历" "resume submitted marker"
    Assert-Contains $parserJs "Review your applications" "SuccessFactors applications section marker"
    Assert-Contains $parserJs "Applied On:" "SuccessFactors applied date marker"
    Assert-Contains $parserJs "Requisition ID:" "SuccessFactors requisition marker"
    Assert-Contains $parserJs "Date Submitted" "Workday date submitted marker"
    Assert-Contains $parserJs "Under Consideration" "Workday status marker"
    Assert-Contains $parserJs "投递记录" "Moka application record marker"
    Assert-Contains $parserJs "项目：" "Moka project marker"
    Assert-Contains $parserJs "我的投递" "hotjob application marker"
    Assert-Contains $parserJs "投递成功" "hotjob submitted marker"
    Assert-Contains $parserJs "最近投递" "hotjob latest application marker"
    Assert-Contains $parserJs "application/ld+json" "JSON-LD parser"
    Assert-Contains $parserJs "JobPosting" "JobPosting parser"
    Assert-Contains $parserJs "document.querySelector(`"h1`")" "h1 parser"
    Assert-Contains $parserJs "meta[name=`"description`"]" "meta description parser"
    Assert-Contains $parserJs "location.href" "URL parser"
    Assert-NotContains $parserJs "公司名称来自页面标题或域名推断" "parser company confidence note"
    Assert-NotContains $parserJs "页面描述已用于辅助判断" "parser description confidence note"
    Assert-NotContains $parserJs "来源：投递记录页" "parser must not auto-fill notes source"
    Assert-NotContains $parserJs "页面状态：" "parser must not auto-fill status notes"
    Assert-NotContains $parserJs "完整投递时间：" "parser must not auto-fill full time notes"
    Assert-NotContains $parserJs "页面未显示投递日期，请保存前确认" "parser must not auto-fill missing-date notes"

    foreach ($className in @("status--draft", "status--submitted", "status--waiting", "status--assessment", "status--interview", "status--offer", "status--closed", "status--archived")) {
        Assert-Contains $popupCss $className "popup status class"
        Assert-Contains $dashboardCss $className "dashboard status class"
    }

    foreach ($html in @($popupHtml, $dashboardHtml)) {
        if ($html -match '(?i)<(?:script|link)[^>]+(?:src|href)="https?://') {
            Add-Failure "HTML must not load remote scripts or styles"
        }
    }
}

if ($failures.Count -gt 0) {
    "FAILED"
    $failures | ForEach-Object { "- $_" }
    exit 1
}

if (-not (Test-Path -LiteralPath $versionedZipPath)) {
    Add-Failure "Missing versioned zip: outputs\job-tracker-extension-v1.4.7.zip"
}

if ($failures.Count -gt 0) {
    "FAILED"
    $failures | ForEach-Object { "- $_" }
    exit 1
}

"PASSED"
exit 0
