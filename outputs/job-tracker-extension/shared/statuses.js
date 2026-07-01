export const STATUS_OPTIONS = [
  { label: "准备投递", tone: "draft" },
  { label: "已投递", tone: "submitted" },
  { label: "已查看", tone: "submitted" },
  { label: "等待回复", tone: "waiting" },
  { label: "简历筛选中", tone: "submitted" },
  { label: "测评 / 笔试", tone: "assessment" },
  { label: "等待一面", tone: "waiting" },
  { label: "一面 / 初面", tone: "interview" },
  { label: "技术一面", tone: "interview" },
  { label: "技术二面", tone: "interview" },
  { label: "技术三面", tone: "interview" },
  { label: "HR 面", tone: "interview" },
  { label: "部门负责人面", tone: "interview" },
  { label: "终面", tone: "interview" },
  { label: "等待面试结果", tone: "waiting" },
  { label: "Offer 沟通中", tone: "offer" },
  { label: "已 Offer", tone: "offer" },
  { label: "已挂", tone: "closed" },
  { label: "已拒绝", tone: "closed" },
  { label: "已放弃", tone: "closed" },
  { label: "无回应归档", tone: "archived" }
];

export const STATUS_SORT_ORDER = [
  "准备投递",
  "已投递",
  "已查看",
  "简历筛选中",
  "等待回复",
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
  "无回应归档",
  "已放弃",
  "已拒绝",
  "已挂"
];

export const FIELD_NAMES = [
  "company",
  "role",
  "appliedDate",
  "channel",
  "jobLink",
  "statusLink",
  "status",
  "statusUpdatedDate",
  "notes"
];

export function statusTone(status) {
  const match = STATUS_OPTIONS.find((option) => option.label === status);
  return match ? match.tone : "draft";
}

export function statusRank(status) {
  const index = STATUS_SORT_ORDER.indexOf(status);
  return index === -1 ? STATUS_SORT_ORDER.length : index;
}

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clearStatusToneClasses(element) {
  element.classList.remove(
    "status--draft",
    "status--submitted",
    "status--waiting",
    "status--assessment",
    "status--interview",
    "status--offer",
    "status--closed",
    "status--archived"
  );
}
