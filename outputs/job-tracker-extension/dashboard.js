import { STATUS_OPTIONS, getToday, statusTone } from "./shared/statuses.js";
import {
  deleteRecord,
  downloadCsv,
  exportRecordsToCsv,
  getRecords,
  importCsvRecords,
  normalizeRecord,
  saveRecord,
  sortRecords,
  updateRecord
} from "./shared/storage.js";
import { downloadPdf } from "./shared/pdf-export.js";

let records = [];
let editingId = "";
let toastTimer = 0;

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  populateStatusControls();
  bindEvents();
  resetForm();
  records = await getRecords();
  render();
}

function cacheElements() {
  els.addButton = document.getElementById("add-record-button");
  els.exportButton = document.getElementById("export-csv-button");
  els.exportPdfButton = document.getElementById("export-pdf-button");
  els.dialog = document.getElementById("record-dialog");
  els.form = document.getElementById("job-form");
  els.dialogTitle = document.getElementById("dialog-title");
  els.closeDialogButton = document.getElementById("close-dialog-button");
  els.cancelButton = document.getElementById("cancel-button");
  els.statusSelect = document.getElementById("status-select");
  els.statusFilter = document.getElementById("status-filter");
  els.sortSelect = document.getElementById("sort-select");
  els.importButton = document.getElementById("import-csv-button");
  els.importInput = document.getElementById("import-csv-input");
  els.searchInput = document.getElementById("search-input");
  els.recordsBody = document.getElementById("records-body");
  els.emptyState = document.getElementById("empty-state");
  els.toast = document.getElementById("toast");
  els.summaryTotal = document.getElementById("summary-total");
  els.summaryWaiting = document.getElementById("summary-waiting");
  els.summaryInterview = document.getElementById("summary-interview");
  els.summaryOffer = document.getElementById("summary-offer");
  els.summaryClosed = document.getElementById("summary-closed");
}

function populateStatusControls() {
  STATUS_OPTIONS.forEach((status) => {
    const formOption = document.createElement("option");
    formOption.value = status.label;
    formOption.textContent = status.label;
    els.statusSelect.appendChild(formOption);

    const filterOption = document.createElement("option");
    filterOption.value = status.label;
    filterOption.textContent = status.label;
    els.statusFilter.appendChild(filterOption);
  });
}

function bindEvents() {
  els.addButton.addEventListener("click", () => openRecordDialog());
  els.exportButton.addEventListener("click", () => {
    exportRecordsToCsv(records);
    downloadCsv(records);
    showToast("CSV 已导出");
  });
  els.exportPdfButton.addEventListener("click", () => {
    downloadPdf(records);
    showToast("PDF 已生成");
  });
  els.closeDialogButton.addEventListener("click", closeRecordDialog);
  els.cancelButton.addEventListener("click", closeRecordDialog);
  els.form.addEventListener("submit", saveRecordFromForm);
  els.statusFilter.addEventListener("change", render);
  els.sortSelect.addEventListener("change", render);
  els.searchInput.addEventListener("input", render);
  els.importButton.addEventListener("click", () => els.importInput.click());
  els.importInput.addEventListener("change", importSelectedCsv);
  els.recordsBody.addEventListener("click", handleTableClick);
  els.recordsBody.addEventListener("change", handleTableChange);
  els.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeRecordDialog();
  });
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  if (button.dataset.action === "edit") {
    editRecord(button.dataset.id);
  }
  if (button.dataset.action === "delete") {
    removeRecord(button.dataset.id);
  }
}

function handleTableChange(event) {
  const select = event.target.closest("select[data-action='status']");
  if (!select) {
    return;
  }
  updateStatusFromTable(select.dataset.id, select.value);
}

async function updateStatusFromTable(id, status) {
  const record = records.find((item) => item.id === id);
  if (!record) {
    showToast("没有找到这条记录");
    render();
    return;
  }
  if (record.status === status) {
    return;
  }

  try {
    await updateRecord(normalizeRecord({
      ...record,
      status,
      statusUpdatedDate: getToday()
    }));
    records = await getRecords();
    render();
    showToast("状态已更新");
  } catch (error) {
    render();
    showToast("状态更新失败，请稍后再试");
  }
}

function openRecordDialog(record) {
  editingId = record ? record.id : "";
  els.dialogTitle.textContent = record ? "编辑求职记录" : "新增求职记录";
  resetForm(record);
  if (typeof els.dialog.showModal === "function") {
    els.dialog.showModal();
  } else {
    els.dialog.setAttribute("open", "open");
  }
}

function closeRecordDialog() {
  if (typeof els.dialog.close === "function") {
    els.dialog.close();
  } else {
    els.dialog.removeAttribute("open");
  }
  editingId = "";
  resetForm();
}

function resetForm(record) {
  els.form.reset();
  const today = getToday();
  const data = record || {
    id: "",
    company: "",
    role: "",
    appliedDate: today,
    channel: "",
    jobLink: "",
    statusLink: "",
    status: STATUS_OPTIONS[0].label,
    statusUpdatedDate: today,
    notes: ""
  };
  Object.entries(data).forEach(([key, value]) => {
    const input = els.form.elements[key];
    if (input) {
      input.value = value || "";
    }
  });
}

async function saveRecordFromForm(event) {
  event.preventDefault();
  const data = new FormData(els.form);
  const record = normalizeRecord({
    id: editingId,
    company: String(data.get("company") || ""),
    role: String(data.get("role") || ""),
    appliedDate: String(data.get("appliedDate") || ""),
    channel: String(data.get("channel") || ""),
    jobLink: String(data.get("jobLink") || ""),
    statusLink: String(data.get("statusLink") || ""),
    status: String(data.get("status") || ""),
    statusUpdatedDate: String(data.get("statusUpdatedDate") || ""),
    notes: String(data.get("notes") || "")
  });

  if (!record.company || !record.role) {
    showToast("请填写公司名称和申请职位");
    return;
  }

  if (editingId) {
    await updateRecord(record);
    showToast("记录已更新");
  } else {
    await saveRecord(record);
    showToast("记录已新增");
  }

  records = await getRecords();
  closeRecordDialog();
  render();
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) {
    showToast("没有找到这条记录");
    return;
  }
  openRecordDialog(record);
}

async function removeRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) {
    showToast("没有找到这条记录");
    return;
  }
  if (!confirm(`删除“${record.company} - ${record.role}”？`)) {
    return;
  }
  await deleteRecord(id);
  records = await getRecords();
  render();
  showToast("记录已删除");
}

function render() {
  renderSummary();
  renderTable();
}

function filteredRecords() {
  const query = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  return records.filter((record) => {
    const matchesStatus = !status || record.status === status;
    const text = [record.company, record.role, record.channel, record.notes, record.status].join(" ").toLowerCase();
    return matchesStatus && (!query || text.includes(query));
  });
}

function renderSummary() {
  els.summaryTotal.textContent = String(records.length);
  els.summaryWaiting.textContent = String(records.filter((record) => statusTone(record.status) === "waiting").length);
  els.summaryInterview.textContent = String(records.filter((record) => {
    const tone = statusTone(record.status);
    return tone === "interview" || tone === "assessment";
  }).length);
  els.summaryOffer.textContent = String(records.filter((record) => statusTone(record.status) === "offer").length);
  els.summaryClosed.textContent = String(records.filter((record) => {
    const tone = statusTone(record.status);
    return tone === "closed" || tone === "archived";
  }).length);
}

function renderTable() {
  const visibleRecords = sortRecords(filteredRecords(), els.sortSelect.value);
  els.recordsBody.textContent = "";

  visibleRecords.forEach((record) => {
    const row = document.createElement("tr");
    appendTextCell(row, record.company);
    appendTextCell(row, record.role);
    appendTextCell(row, record.appliedDate);
    appendTextCell(row, record.channel);
    appendLinkCell(row, record.jobLink);
    appendLinkCell(row, record.statusLink);
    appendStatusSelectCell(row, record);
    appendTextCell(row, record.statusUpdatedDate);
    appendTextCell(row, record.notes, "cell-notes");
    appendActionsCell(row, record.id);
    els.recordsBody.appendChild(row);
  });

  if (els.emptyState) {
    els.emptyState.hidden = visibleRecords.length > 0;
  }
}

async function importSelectedCsv(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  try {
    const csvText = await file.text();
    const result = await importCsvRecords(csvText);
    records = await getRecords();
    render();
    showToast(`导入 ${result.importedCount} 条，跳过重复 ${result.skippedCount} 条`);
  } catch (error) {
    showToast("CSV 导入失败，请检查文件格式");
  } finally {
    els.importInput.value = "";
  }
}

function appendTextCell(row, value, className) {
  const cell = document.createElement("td");
  cell.textContent = value || "-";
  if (value) {
    cell.title = value;
  }
  if (!value) {
    cell.classList.add("cell-muted");
  }
  if (className) {
    cell.classList.add(className);
  }
  row.appendChild(cell);
}

function appendLinkCell(row, value) {
  const cell = document.createElement("td");
  cell.className = "cell-link";
  if (value) {
    const link = document.createElement("a");
    link.href = value;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "打开";
    cell.appendChild(link);
  } else {
    cell.textContent = "-";
    cell.classList.add("cell-muted");
  }
  row.appendChild(cell);
}

function appendStatusSelectCell(row, record) {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  const currentStatus = STATUS_OPTIONS.some((option) => option.label === record.status)
    ? record.status
    : STATUS_OPTIONS[0].label;

  select.className = `status-inline-select status--${statusTone(currentStatus)}`;
  select.dataset.action = "status";
  select.dataset.id = record.id;
  select.setAttribute("aria-label", `更新 ${record.company || "这条记录"} 的投递状态`);

  STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.label;
    option.textContent = status.label;
    option.selected = status.label === currentStatus;
    select.appendChild(option);
  });

  cell.appendChild(select);
  row.appendChild(cell);
}

function appendActionsCell(row, id) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "row-actions";

  const editButton = document.createElement("button");
  editButton.className = "action-button";
  editButton.type = "button";
  editButton.dataset.action = "edit";
  editButton.dataset.id = id;
  editButton.textContent = "编辑";

  const deleteButton = document.createElement("button");
  deleteButton.className = "action-button action-danger";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.id = id;
  deleteButton.textContent = "删除";

  actions.append(editButton, deleteButton);
  cell.appendChild(actions);
  row.appendChild(cell);
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2200);
}
