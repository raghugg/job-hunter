export const VIEWS = {
  CHECKLIST: "checklist",
  APPLY: "apply",
  LEETCODE: "leetcode",
  RESUME: "resume",
  LATEX_INFO: "latex-info",
};

export const STORAGE_KEY = "jobhunter_state_v1";

export const defaultTodayTasks = [
  {
    id: 1,
    label: "Apply to 3 jobs",
    target: 3,
    completedCount: 0,
    frequency: "daily",
    linkedView: "apply",
    isDefault: true,
  },
  {
    id: 2,
    label: "Solve 1 LeetCode / interview problem",
    target: 1,
    completedCount: 0,
    frequency: "daily",
    linkedView: "leetcode",
    isDefault: true,
  },
  {
    id: 3,
    label: "Send 2 networking messages on LinkedIn",
    target: 2,
    completedCount: 0,
    frequency: "daily",
    linkedView: "apply",
    isDefault: true,
  },
  {
    id: 4,
    label: "Spend 15 minutes improving resume/portfolio",
    target: 1,
    completedCount: 0,
    frequency: "weekly",
    linkedView: "resume",
    isDefault: true,
  },
];