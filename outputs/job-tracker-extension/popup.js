import { STATUS_OPTIONS, clearStatusToneClasses, getToday, statusTone } from "./shared/statuses.js";
import { normalizeRecord, saveRecord } from "./shared/storage.js";

const DEFAULT_CAPTURE_STATUS = "已投递";

const form = document.getElementById("capture-form");
const message = document.getElementById("capture-message");
const readPageButton = document.getElementById("read-page-button");
const openDashboardButton = document.getElementById("open-dashboard-button");
const statusSelect = document.getElementById("status-select");
const statusPreview = document.getElementById("status-preview");
const candidatePanel = document.getElementById("candidate-panel");
const candidateList = document.getElementById("candidate-list");

let parsedCandidates = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  populateStatusOptions();
  bindEvents();
  fillForm(defaultRecord());
  await readCurrentPage();
}

function bindEvents() {
  readPageButton.addEventListener("click", readCurrentPage);
  openDashboardButton.addEventListener("click", openDashboard);
  statusSelect.addEventListener("change", updateStatusPreview);
  form.addEventListener("submit", saveCapture);
}

function populateStatusOptions() {
  STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.label;
    option.textContent = status.label;
    statusSelect.appendChild(option);
  });
}

async function readCurrentPage() {
  setMessage("正在读取当前页面信息...");
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      throw new Error("没有找到当前标签页");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["shared/parser.js"]
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => globalThis.JobTrackerParser.parseJobPage()
    });

    const parsed = results && results[0] ? results[0].result : {};
    parsedCandidates = normalizeCandidates(parsed.candidates, tab.url || "");
    renderCandidates(parsedCandidates);
    fillForm(normalizeParsedRecord(parsed, tab.url || ""));
    setMessage(parsedCandidates.length > 1
      ? "页面信息已读取。请选择候选记录，保存前可以手动调整字段。"
      : "页面信息已读取。保存前可以手动调整字段。");
  } catch (error) {
    parsedCandidates = [];
    renderCandidates(parsedCandidates);
    fillForm(defaultRecord());
    setMessage("这个页面暂时无法自动读取，已填入默认值，可以手动补全后保存。");
  }
}

async function saveCapture(event) {
  event.preventDefault();
  const record = normalizeRecord(collectFormData());
  if (!record.company || !record.role) {
    setMessage("请至少填写公司名称和申请职位。");
    return;
  }
  await saveRecord(record);
  setMessage("已保存到插件管理器。");
  form.reset();
  fillForm(defaultRecord());
}

function collectFormData() {
  const data = new FormData(form);
  return {
    company: String(data.get("company") || ""),
    role: String(data.get("role") || ""),
    appliedDate: String(data.get("appliedDate") || ""),
    channel: String(data.get("channel") || ""),
    jobLink: String(data.get("jobLink") || ""),
    statusLink: String(data.get("statusLink") || ""),
    status: String(data.get("status") || DEFAULT_CAPTURE_STATUS),
    statusUpdatedDate: String(data.get("statusUpdatedDate") || ""),
    notes: String(data.get("notes") || "")
  };
}

function fillForm(record) {
  Object.entries(record).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input) {
      input.value = value || "";
    }
  });
  updateStatusPreview();
}

function normalizeParsedRecord(record, tabUrl) {
  const parsed = record || {};
  return normalizeRecord({
    ...defaultRecord(),
    ...parsed,
    jobLink: parsed.jobLink || tabUrl || "",
    statusLink: parsed.statusLink || tabUrl || "",
    status: parsed.status || DEFAULT_CAPTURE_STATUS
  });
}

function normalizeCandidates(candidates, tabUrl) {
  if (!Array.isArray(candidates)) {
    return [];
  }
  return candidates.map((candidate) => normalizeParsedRecord(candidate, tabUrl));
}

function renderCandidates(candidates) {
  candidateList.innerHTML = "";
  if (candidates.length <= 1) {
    candidatePanel.hidden = true;
    return;
  }

  candidatePanel.hidden = false;
  candidates.forEach((candidate, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `candidate-card${index === 0 ? " is-active" : ""}`;

    const title = document.createElement("strong");
    title.textContent = candidate.role || "未识别职位";
    const meta = document.createElement("span");
    meta.textContent = [
      candidate.company,
      candidate.appliedDate,
      candidate.status
    ].filter(Boolean).join(" · ");

    button.append(title, meta);
    button.addEventListener("click", () => {
      document.querySelectorAll(".candidate-card").forEach((element) => element.classList.remove("is-active"));
      button.classList.add("is-active");
      fillForm(candidate);
      setMessage("已填入候选记录，保存前可以手动调整字段。");
    });
    candidateList.appendChild(button);
  });
}

function defaultRecord() {
  const today = getToday();
  return {
    company: "",
    role: "",
    appliedDate: today,
    channel: "公司官网",
    jobLink: "",
    statusLink: "",
    status: DEFAULT_CAPTURE_STATUS,
    statusUpdatedDate: today,
    notes: ""
  };
}

function updateStatusPreview() {
  const status = statusSelect.value || DEFAULT_CAPTURE_STATUS;
  clearStatusToneClasses(statusPreview);
  statusPreview.classList.add(`status--${statusTone(status)}`);
  statusPreview.textContent = status;
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
}

function setMessage(text) {
  message.textContent = text;
}
