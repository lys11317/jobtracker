import { FIELD_NAMES, STATUS_OPTIONS, createId, getToday, statusRank } from "./statuses.js";

export const STORAGE_KEY = "jobTracker.extension.records.v1";

export function normalizeRecord(record) {
  const today = getToday();
  const normalized = {
    id: typeof record.id === "string" && record.id ? record.id : createId()
  };

  FIELD_NAMES.forEach((field) => {
    normalized[field] = typeof record[field] === "string" ? record[field].trim() : "";
  });

  normalized.appliedDate = normalized.appliedDate || today;
  normalized.status = normalized.status || STATUS_OPTIONS[0].label;
  normalized.statusUpdatedDate = normalized.statusUpdatedDate || today;
  return normalized;
}

export async function getRecords() {
  const result = await chromeStorageGet(STORAGE_KEY);
  const records = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
  return records.map(normalizeRecord);
}

export async function setRecords(records) {
  const normalized = records.map(normalizeRecord);
  await chromeStorageSet({ [STORAGE_KEY]: normalized });
  return normalized;
}

export async function saveRecord(record) {
  const records = await getRecords();
  const normalized = normalizeRecord(record);
  await setRecords([normalized].concat(records));
  return normalized;
}

export async function updateRecord(record) {
  const records = await getRecords();
  const normalized = normalizeRecord(record);
  await setRecords(records.map((item) => item.id === normalized.id ? normalized : item));
  return normalized;
}

export async function deleteRecord(id) {
  const records = await getRecords();
  await setRecords(records.filter((record) => record.id !== id));
}

export function sortRecords(records, mode = "status") {
  const sorted = records.slice();
  sorted.sort((a, b) => {
    if (mode === "appliedDateDesc") {
      return compareDateDesc(a.appliedDate, b.appliedDate) || compareText(a.company, b.company);
    }
    if (mode === "appliedDateAsc") {
      return compareDateAsc(a.appliedDate, b.appliedDate) || compareText(a.company, b.company);
    }
    if (mode === "statusUpdatedDateDesc") {
      return compareDateDesc(a.statusUpdatedDate, b.statusUpdatedDate) || statusRank(a.status) - statusRank(b.status);
    }
    if (mode === "statusUpdatedDateAsc") {
      return compareDateAsc(a.statusUpdatedDate, b.statusUpdatedDate) || statusRank(a.status) - statusRank(b.status);
    }
    return statusRank(a.status) - statusRank(b.status)
      || compareDateDesc(a.statusUpdatedDate, b.statusUpdatedDate)
      || compareDateDesc(a.appliedDate, b.appliedDate)
      || compareText(a.company, b.company);
  });
  return sorted;
}

export function parseCsv(csvText) {
  const text = String(csvText || "").replace(/^\ufeff/, "");
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }
    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }
  return rows;
}

export function recordsFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return [];
  }

  const header = rows[0].map((cell) => normalizeHeader(cell));
  return rows.slice(1).map((row) => {
    const rawRecord = {};
    header.forEach((name, index) => {
      const field = CSV_HEADER_MAP[name];
      if (field) {
        rawRecord[field] = row[index] || "";
      }
    });
    if (!rawRecord.status || !STATUS_OPTIONS.some((option) => option.label === rawRecord.status.trim())) {
      rawRecord.status = "已投递";
    }
    return normalizeRecord(rawRecord);
  }).filter((record) => record.company || record.role || record.jobLink);
}

export function mergeImportedRecords(existing, imported) {
  const seen = new Set(existing.map(recordKey));
  const merged = existing.slice();
  let importedCount = 0;
  let skippedCount = 0;

  imported.forEach((record) => {
    const key = recordKey(record);
    if (seen.has(key)) {
      skippedCount += 1;
      return;
    }
    seen.add(key);
    merged.push(record);
    importedCount += 1;
  });

  return {
    records: merged,
    importedCount,
    skippedCount
  };
}

export async function importCsvRecords(csvText) {
  const existing = await getRecords();
  const imported = recordsFromCsv(csvText);
  const result = mergeImportedRecords(existing, imported);
  await setRecords(result.records);
  return result;
}

export function exportRecordsToCsv(records) {
  const headers = [
    "公司名称",
    "申请职位",
    "投递时间",
    "投递渠道",
    "职位链接/JD链接",
    "查看投递状态界面",
    "投递状态",
    "状态更新时间",
    "备注"
  ];
  const rows = records.map((record) => [
    record.company,
    record.role,
    record.appliedDate,
    record.channel,
    record.jobLink,
    record.statusLink,
    record.status,
    record.statusUpdatedDate,
    record.notes
  ]);

  return [headers].concat(rows).map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

export function downloadCsv(records) {
  const csv = exportRecordsToCsv(records);
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `求职总表-${getToday()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const CSV_HEADER_MAP = {
  "公司名称": "company",
  "申请职位": "role",
  "投递时间": "appliedDate",
  "投递渠道": "channel",
  "职位链接/JD链接": "jobLink",
  "职位链接": "jobLink",
  "JD链接": "jobLink",
  "查看投递状态界面": "statusLink",
  "投递状态": "status",
  "状态更新时间": "statusUpdatedDate",
  "备注": "notes"
};

function compareDateDesc(left, right) {
  return dateValue(right) - dateValue(left);
}

function compareDateAsc(left, right) {
  return dateValue(left) - dateValue(right);
}

function dateValue(value) {
  const time = Date.parse(value || "");
  return Number.isNaN(time) ? 0 : time;
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), "zh-Hans-CN");
}

function normalizeHeader(value) {
  return String(value || "").replace(/^\ufeff/, "").trim();
}

function recordKey(record) {
  return [
    record.company,
    record.role,
    record.jobLink
  ].map((value) => String(value || "").trim().toLowerCase()).join("|");
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function chromeStorageGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

function chromeStorageSet(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
