import { getToday } from "./statuses.js";

const PDF_COLUMNS = [
  ["company", "公司名称"],
  ["role", "申请职位"],
  ["appliedDate", "投递时间"],
  ["channel", "投递渠道"],
  ["status", "投递状态"],
  ["statusUpdatedDate", "状态更新时间"],
  ["jobLink", "职位链接/JD链接"],
  ["statusLink", "查看投递状态界面"],
  ["notes", "备注"]
];

export function buildPdfHtml(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  const rows = safeRecords.length > 0
    ? safeRecords.map(buildRecordRow).join("")
    : `<tr><td colspan="${PDF_COLUMNS.length}" class="empty">暂无求职记录</td></tr>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Job Tracker PDF ${escapeHtml(getToday())}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      color: #172033;
      font-family: "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
      background: #ffffff;
    }
    header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
      border-bottom: 2px solid #d8e0eb;
      padding-bottom: 12px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.25;
    }
    .meta {
      color: #667085;
      font-size: 12px;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 11px;
    }
    th,
    td {
      border: 1px solid #d8e0eb;
      padding: 7px 6px;
      text-align: center;
      vertical-align: middle;
      word-break: break-word;
    }
    th {
      color: #26364d;
      background: #eef4fb;
      font-weight: 800;
    }
    td:nth-child(1),
    td:nth-child(2) {
      font-weight: 700;
    }
    .empty {
      height: 70px;
      color: #667085;
      font-weight: 800;
    }
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    @media print {
      body { padding: 0; }
      header { break-after: avoid; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Job Tracker 求职总表</h1>
      <div class="meta">共 ${safeRecords.length} 条记录</div>
    </div>
    <div class="meta">生成日期：${escapeHtml(getToday())}</div>
  </header>
  <table>
    <thead>
      <tr>${PDF_COLUMNS.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>
    window.addEventListener("load", () => {
      setTimeout(() => window.print(), 150);
    });
  </script>
</body>
</html>`;
}

export function downloadPdf(records) {
  const html = buildPdfHtml(records);
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    return;
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `job-tracker-pdf-${getToday()}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildRecordRow(record) {
  return `<tr>${PDF_COLUMNS.map(([field]) => `<td>${formatPdfCell(record[field])}</td>`).join("")}</tr>`;
}

function formatPdfCell(value) {
  const text = String(value || "").trim();
  return text ? escapeHtml(text) : "-";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
