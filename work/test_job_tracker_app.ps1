$ErrorActionPreference = "Stop"

$root = (Resolve-Path ".").Path
$appDir = Join-Path $root "outputs\job-tracker-app"
$indexPath = Join-Path $appDir "index.html"
$stylesPath = Join-Path $appDir "styles.css"
$scriptPath = Join-Path $appDir "app.js"
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    $script:failures.Add($Message) | Out-Null
}

function Assert-FileExists {
    param([string]$Path, [string]$Label)
    if (-not (Test-Path -LiteralPath $Path)) {
        Add-Failure "$Label missing: $Path"
    }
}

function Read-Utf8 {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Assert-Contains {
    param([string]$Content, [string]$Needle, [string]$Label)
    if (-not $Content.Contains($Needle)) {
        Add-Failure "$Label missing: $Needle"
    }
}

Assert-FileExists $indexPath "index.html"
Assert-FileExists $stylesPath "styles.css"
Assert-FileExists $scriptPath "app.js"

if ($failures.Count -eq 0) {
    $index = Read-Utf8 $indexPath
    $styles = Read-Utf8 $stylesPath
    $script = Read-Utf8 $scriptPath

    $fields = @(
        "company",
        "role",
        "appliedDate",
        "channel",
        "jobLink",
        "statusLink",
        "status",
        "statusUpdatedDate",
        "notes"
    )

    foreach ($field in $fields) {
        Assert-Contains $index "name=`"$field`"" "form field"
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
        "已拒绝",
        "已放弃",
        "无回应归档"
    )

    foreach ($status in $statuses) {
        Assert-Contains $script $status "status option"
    }

    Assert-Contains $index "id=`"add-record-button`"" "add record button"
    Assert-Contains $index "id=`"job-form`"" "record form"
    Assert-Contains $index "id=`"records-body`"" "records table body"
    Assert-Contains $index "id=`"status-filter`"" "status filter"
    Assert-Contains $index "id=`"search-input`"" "search input"
    Assert-Contains $index "id=`"export-csv-button`"" "CSV export button"
    Assert-Contains $index "href=`"styles.css`"" "stylesheet link"
    Assert-Contains $index "src=`"app.js`"" "script link"

    Assert-Contains $script "jobTracker.records.v1" "storage key"
    Assert-Contains $script "localStorage.getItem" "localStorage read"
    Assert-Contains $script "localStorage.setItem" "localStorage write"
    Assert-Contains $script "function exportCsv" "CSV export function"
    Assert-Contains $script "function editRecord" "edit function"
    Assert-Contains $script "function deleteRecord" "delete function"
    Assert-Contains $script "statusTone" "status color mapper"

    $statusClasses = @(
        "status--draft",
        "status--submitted",
        "status--waiting",
        "status--assessment",
        "status--interview",
        "status--offer",
        "status--closed",
        "status--archived"
    )

    foreach ($className in $statusClasses) {
        Assert-Contains $styles $className "status color class"
    }

    if ($index -match '(?i)<(?:script|link)[^>]+(?:src|href)="https?://') {
        Add-Failure "index.html should not depend on external HTTP script or stylesheet assets"
    }
}

if ($failures.Count -gt 0) {
    "FAILED"
    $failures | ForEach-Object { "- $_" }
    exit 1
}

"PASSED"
exit 0
