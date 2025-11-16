import { useState, useEffect } from "react";

const TABS = {
  TODAY: "today",
  SCHEDULE: "schedule",
  APPLY: "apply",
  LEETCODE: "leetcode",
  LINKEDIN: "linkedin",
  RESUME: "resume",
};

const STORAGE_KEY = "jobhunter_state_v1";

const defaultTodayTasks = [
  {
    id: 1,
    label: "Apply to 3 jobs",
    target: 3,
    completedCount: 0,
    frequency: "daily",
  },
  {
    id: 2,
    label: "Solve 1 LeetCode / interview problem",
    target: 1,
    completedCount: 0,
    frequency: "daily",
  },
  {
    id: 3,
    label: "Send 2 networking messages on LinkedIn",
    target: 2,
    completedCount: 0,
    frequency: "daily",
  },
  {
    id: 4,
    label: "Spend 15 minutes improving resume/portfolio",
    target: 1,
    completedCount: 0,
    frequency: "weekly",
  },
];

// "YYYY-MM-DD"
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// streak of consecutive goalMet days up to today
function computeStreak(history = {}) {
  let streak = 0;
  const d = new Date();

  while (true) {
    const key = d.toISOString().slice(0, 10);
    const entry = history[key];
    if (entry && entry.goalMet) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// helper to build a fresh empty state (used at start + on reset)
function createEmptyState() {
  const todayKey = getTodayKey();
  const resetTasks = defaultTodayTasks.map((t) => ({
    ...t,
    completedCount: 0,
  }));

  return {
    tasks: resetTasks,
    history: {},
    lastDate: todayKey,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.TODAY);

  // ---------- SHARED STATE FOR TASKS + HISTORY ----------
  const [state, setState] = useState(() => {
    const todayKey = getTodayKey();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createEmptyState();
      }

      const parsed = JSON.parse(raw);

      // New day → reset completion but keep tasks/history
      if (parsed.lastDate !== todayKey) {
        const resetTasks = (parsed.tasks || defaultTodayTasks).map((t) => ({
          ...t,
          completedCount: 0,
        }));
        return {
          tasks: resetTasks,
          history: parsed.history || {},
          lastDate: todayKey,
        };
      }

      return {
        tasks: parsed.tasks || defaultTodayTasks,
        history: parsed.history || {},
        lastDate: parsed.lastDate || todayKey,
      };
    } catch {
      return createEmptyState();
    }
  });

  // Save everything whenever state changes
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ---------- Reset all data ----------
  const handleReset = () => {
    const sure = window.confirm(
      "Reset all Job Hunter data? This will clear tasks, streaks, and history."
    );
    if (!sure) return;

    window.localStorage.removeItem(STORAGE_KEY);
    setState(createEmptyState());
  };

  return (
    <div className="app">
      {/* Header + reset */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Job Hunter</h1>
        <button
          onClick={handleReset}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Reset data
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <TabButton
          label="Today"
          active={activeTab === TABS.TODAY}
          onClick={() => setActiveTab(TABS.TODAY)}
        />
        <TabButton
          label="Schedule"
          active={activeTab === TABS.SCHEDULE}
          onClick={() => setActiveTab(TABS.SCHEDULE)}
        />
        <TabButton
          label="Apply"
          active={activeTab === TABS.APPLY}
          onClick={() => setActiveTab(TABS.APPLY)}
        />
        <TabButton
          label="LeetCode"
          active={activeTab === TABS.LEETCODE}
          onClick={() => setActiveTab(TABS.LEETCODE)}
        />
        <TabButton
          label="LinkedIn"
          active={activeTab === TABS.LINKEDIN}
          onClick={() => setActiveTab(TABS.LINKEDIN)}
        />
        <TabButton
          label="Resume"
          active={activeTab === TABS.RESUME}
          onClick={() => setActiveTab(TABS.RESUME)}
        />
      </div>

      {/* Content */}
      <div style={{ marginTop: "30px" }}>
        {activeTab === TABS.TODAY && (
          <TodayTab state={state} setState={setState} />
        )}
        {activeTab === TABS.SCHEDULE && (
          <ScheduleTab tasks={state.tasks} setState={setState} />
        )}
        {activeTab === TABS.APPLY && <ApplyTab />}
        {activeTab === TABS.LEETCODE && <LeetCodeTab />}
        {activeTab === TABS.LINKEDIN && <LinkedInTab />}
        {activeTab === TABS.RESUME && <ResumeTab />}
      </div>
    </div>
  );
}

/** ---------- SMALL TAB BUTTON COMPONENT ---------- **/

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "999px",
        border: active ? "1px solid #22c55e" : "1px solid #4b5563",
        background: active ? "#22c55e22" : "#020617",
        color: "#e5e7eb",
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

/** ---------- TODAY TAB ---------- **/

function TodayTab({ state, setState }) {
  const { tasks, history } = state;

  const toggleTask = (id) => {
    setState((prev) => {
      const updatedTasks = prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completedCount:
                task.completedCount >= task.target ? 0 : task.target,
            }
          : task
      );

      const todayKey = getTodayKey();
      const completedCount = updatedTasks.filter(
        (t) => t.completedCount >= t.target
      ).length;
      const total = updatedTasks.length;
      const allDone = completedCount === total && total > 0;

      const updatedHistory = {
        ...prev.history,
        [todayKey]: {
          goalMet: allDone,
          completedCount,
          total,
        },
      };

      return {
        tasks: updatedTasks,
        history: updatedHistory,
        lastDate: todayKey,
      };
    });
  };

  const completedTasks = tasks.filter(
    (t) => t.completedCount >= t.target
  ).length;
  const streak = computeStreak(history);

  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - idx);
    const key = d.toISOString().slice(0, 10);
    const entry = history[key];

    // Backwards-compatible if older entries only had goalMet
    let completed = 0;
    let total = 0;
    if (entry) {
      if (
        typeof entry.completedCount === "number" &&
        typeof entry.total === "number"
      ) {
        completed = entry.completedCount;
        total = entry.total;
      } else {
        completed = entry.goalMet ? 1 : 0;
        total = 1;
      }
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const label = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    });

    return { key, label, completed, total, percent };
  }).reverse(); // oldest first, today last

  return (
    <div>
      {/* Summary */}
      <div
        style={{
          padding: "12px 16px",
          marginBottom: "16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "4px", fontSize: "1.1rem" }}>
          Today&apos;s Progress
        </h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>
          {completedTasks} / {tasks.length} tasks completed
        </p>
        <p
          style={{
            margin: 0,
            marginTop: "4px",
            fontSize: "0.9rem",
            color: "#9ca3af",
          }}
        >
          Streak: {streak} day{streak === 1 ? "" : "s"} with all goals met
        </p>
      </div>

      {/* Checklist */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>
          Checklist
        </h2>

        {tasks.map((task) => {
          const done = task.completedCount >= task.target;
          return (
            <label
              key={task.id}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "6px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleTask(task.id)}
                style={{ marginTop: "3px" }}
              />
              <div>
                <div>{task.label}</div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#9ca3af",
                    marginTop: "2px",
                  }}
                >
                  Target: {task.target} &bull; Frequency: {task.frequency}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* History with partial credit */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>
          History (last 7 days)
        </h2>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            fontSize: "0.85rem",
          }}
        >
          {last7Days.map((day) => {
            let statusLabel = "⬜ 0% done";
            let statusColor = "#9ca3af";
            let bg = "#111827";

            if (day.percent === 100) {
              statusLabel = "✅ 100% done";
              statusColor = "#4ade80";
              bg = "#16a34a22";
            } else if (day.percent > 0) {
              statusLabel = `🟡 ${day.percent}% done`;
              statusColor = "#facc15";
              bg = "#43380f";
            }

            return (
              <div
                key={day.key}
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid #1f2937",
                  background: bg,
                  minWidth: "110px",
                }}
              >
                <div style={{ color: "#e5e7eb" }}>{day.label}</div>
                <div
                  style={{
                    marginTop: "2px",
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </div>
                {day.total > 0 && (
                  <div
                    style={{
                      marginTop: "2px",
                      color: "#9ca3af",
                      fontSize: "0.8rem",
                    }}
                  >
                    {day.completed} / {day.total} tasks
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** ---------- SCHEDULE TAB (EDIT TASKS) ---------- **/

function ScheduleTab({ tasks, setState }) {
  const handleChange = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  return (
    <div>
      <h2>Schedule</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "12px" }}>
        Adjust how many of each task you aim to do and how often you want to do
        it. These changes will affect your Today checklist.
      </p>

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: "10px 12px",
            marginBottom: "10px",
            borderRadius: "8px",
            background: "#020617",
            border: "1px solid #1f2937",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Task label
            </label>
            <input
              type="text"
              value={task.label}
              onChange={(e) =>
                handleChange(task.id, "label", e.target.value)
              }
              style={{
                width: "100%",
                marginTop: "4px",
                padding: "6px 8px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <div style={{ flex: "0 0 120px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Target
              </label>
              <input
                type="number"
                min={1}
                value={task.target}
                onChange={(e) =>
                  handleChange(task.id, "target", Number(e.target.value) || 1)
                }
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div style={{ flex: "0 0 160px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Frequency
              </label>
              <select
                value={task.frequency}
                onChange={(e) =>
                  handleChange(task.id, "frequency", e.target.value)
                }
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                {/* Custom disabled for now */}
                <option value="custom" disabled>
                  Custom (coming soon)
                </option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** ---------- APPLY TAB ---------- **/

function ApplyTab() {
  return (
    <div>
      <h2>Apply to Jobs</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "8px" }}>
        This tab will eventually help you track applications, keep a list of
        target companies, and maybe even suggest roles based on your profile.
      </p>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        For now, it&apos;s just a placeholder tied to your &quot;Apply to 3
        jobs&quot; task on the Today tab.
      </p>
    </div>
  );
}

/** ---------- LEETCODE TAB ---------- **/

const LEETCODE_PROBLEMS = [
  // Easy Problems
  { id: 1, title: "Two Sum", difficulty: "Easy", acceptance: 49.5, url: "https://leetcode.com/problems/two-sum/" },
  { id: 20, title: "Valid Parentheses", difficulty: "Easy", acceptance: 40.8, url: "https://leetcode.com/problems/valid-parentheses/" },
  { id: 21, title: "Merge Two Sorted Lists", difficulty: "Easy", acceptance: 62.1, url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
  { id: 26, title: "Remove Duplicates from Sorted Array", difficulty: "Easy", acceptance: 52.3, url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/" },
  { id: 27, title: "Remove Element", difficulty: "Easy", acceptance: 53.2, url: "https://leetcode.com/problems/remove-element/" },
  { id: 53, title: "Maximum Subarray", difficulty: "Easy", acceptance: 50.1, url: "https://leetcode.com/problems/maximum-subarray/" },
  { id: 66, title: "Plus One", difficulty: "Easy", acceptance: 44.3, url: "https://leetcode.com/problems/plus-one/" },
  { id: 70, title: "Climbing Stairs", difficulty: "Easy", acceptance: 51.7, url: "https://leetcode.com/problems/climbing-stairs/" },
  { id: 88, title: "Merge Sorted Array", difficulty: "Easy", acceptance: 46.8, url: "https://leetcode.com/problems/merge-sorted-array/" },
  { id: 94, title: "Binary Tree Inorder Traversal", difficulty: "Easy", acceptance: 74.2, url: "https://leetcode.com/problems/binary-tree-inorder-traversal/" },
  { id: 101, title: "Symmetric Tree", difficulty: "Easy", acceptance: 54.3, url: "https://leetcode.com/problems/symmetric-tree/" },
  { id: 104, title: "Maximum Depth of Binary Tree", difficulty: "Easy", acceptance: 73.8, url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
  { id: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", acceptance: 54.2, url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  { id: 125, title: "Valid Palindrome", difficulty: "Easy", acceptance: 44.7, url: "https://leetcode.com/problems/valid-palindrome/" },
  { id: 136, title: "Single Number", difficulty: "Easy", acceptance: 70.1, url: "https://leetcode.com/problems/single-number/" },
  { id: 141, title: "Linked List Cycle", difficulty: "Easy", acceptance: 48.3, url: "https://leetcode.com/problems/linked-list-cycle/" },
  { id: 155, title: "Min Stack", difficulty: "Easy", acceptance: 52.1, url: "https://leetcode.com/problems/min-stack/" },
  { id: 169, title: "Majority Element", difficulty: "Easy", acceptance: 63.8, url: "https://leetcode.com/problems/majority-element/" },
  { id: 206, title: "Reverse Linked List", difficulty: "Easy", acceptance: 73.5, url: "https://leetcode.com/problems/reverse-linked-list/" },
  { id: 217, title: "Contains Duplicate", difficulty: "Easy", acceptance: 61.2, url: "https://leetcode.com/problems/contains-duplicate/" },
  { id: 226, title: "Invert Binary Tree", difficulty: "Easy", acceptance: 74.5, url: "https://leetcode.com/problems/invert-binary-tree/" },
  { id: 234, title: "Palindrome Linked List", difficulty: "Easy", acceptance: 51.9, url: "https://leetcode.com/problems/palindrome-linked-list/" },
  { id: 242, title: "Valid Anagram", difficulty: "Easy", acceptance: 63.5, url: "https://leetcode.com/problems/valid-anagram/" },
  { id: 268, title: "Missing Number", difficulty: "Easy", acceptance: 62.1, url: "https://leetcode.com/problems/missing-number/" },
  { id: 283, title: "Move Zeroes", difficulty: "Easy", acceptance: 61.3, url: "https://leetcode.com/problems/move-zeroes/" },
  { id: 344, title: "Reverse String", difficulty: "Easy", acceptance: 78.1, url: "https://leetcode.com/problems/reverse-string/" },
  { id: 387, title: "First Unique Character in a String", difficulty: "Easy", acceptance: 59.8, url: "https://leetcode.com/problems/first-unique-character-in-a-string/" },
  { id: 392, title: "Is Subsequence", difficulty: "Easy", acceptance: 54.2, url: "https://leetcode.com/problems/is-subsequence/" },
  { id: 404, title: "Sum of Left Leaves", difficulty: "Easy", acceptance: 57.3, url: "https://leetcode.com/problems/sum-of-left-leaves/" },
  { id: 543, title: "Diameter of Binary Tree", difficulty: "Easy", acceptance: 58.1, url: "https://leetcode.com/problems/diameter-of-binary-tree/" },

  // Medium Problems
  { id: 2, title: "Add Two Numbers", difficulty: "Medium", acceptance: 41.2, url: "https://leetcode.com/problems/add-two-numbers/" },
  { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", acceptance: 34.1, url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { id: 5, title: "Longest Palindromic Substring", difficulty: "Medium", acceptance: 33.2, url: "https://leetcode.com/problems/longest-palindromic-substring/" },
  { id: 11, title: "Container With Most Water", difficulty: "Medium", acceptance: 54.3, url: "https://leetcode.com/problems/container-with-most-water/" },
  { id: 15, title: "3Sum", difficulty: "Medium", acceptance: 33.8, url: "https://leetcode.com/problems/3sum/" },
  { id: 17, title: "Letter Combinations of a Phone Number", difficulty: "Medium", acceptance: 57.8, url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/" },
  { id: 19, title: "Remove Nth Node From End of List", difficulty: "Medium", acceptance: 43.1, url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/" },
  { id: 22, title: "Generate Parentheses", difficulty: "Medium", acceptance: 73.8, url: "https://leetcode.com/problems/generate-parentheses/" },
  { id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", acceptance: 39.4, url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
  { id: 39, title: "Combination Sum", difficulty: "Medium", acceptance: 70.1, url: "https://leetcode.com/problems/combination-sum/" },
  { id: 46, title: "Permutations", difficulty: "Medium", acceptance: 77.2, url: "https://leetcode.com/problems/permutations/" },
  { id: 48, title: "Rotate Image", difficulty: "Medium", acceptance: 72.1, url: "https://leetcode.com/problems/rotate-image/" },
  { id: 49, title: "Group Anagrams", difficulty: "Medium", acceptance: 67.3, url: "https://leetcode.com/problems/group-anagrams/" },
  { id: 56, title: "Merge Intervals", difficulty: "Medium", acceptance: 46.8, url: "https://leetcode.com/problems/merge-intervals/" },
  { id: 62, title: "Unique Paths", difficulty: "Medium", acceptance: 63.2, url: "https://leetcode.com/problems/unique-paths/" },
  { id: 75, title: "Sort Colors", difficulty: "Medium", acceptance: 60.1, url: "https://leetcode.com/problems/sort-colors/" },
  { id: 78, title: "Subsets", difficulty: "Medium", acceptance: 76.5, url: "https://leetcode.com/problems/subsets/" },
  { id: 79, title: "Word Search", difficulty: "Medium", acceptance: 40.3, url: "https://leetcode.com/problems/word-search/" },
  { id: 98, title: "Validate Binary Search Tree", difficulty: "Medium", acceptance: 32.1, url: "https://leetcode.com/problems/validate-binary-search-tree/" },
  { id: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium", acceptance: 65.3, url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
  { id: 105, title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", acceptance: 62.5, url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/" },
  { id: 128, title: "Longest Consecutive Sequence", difficulty: "Medium", acceptance: 48.1, url: "https://leetcode.com/problems/longest-consecutive-sequence/" },
  { id: 139, title: "Word Break", difficulty: "Medium", acceptance: 46.2, url: "https://leetcode.com/problems/word-break/" },
  { id: 146, title: "LRU Cache", difficulty: "Medium", acceptance: 42.1, url: "https://leetcode.com/problems/lru-cache/" },
  { id: 200, title: "Number of Islands", difficulty: "Medium", acceptance: 57.8, url: "https://leetcode.com/problems/number-of-islands/" },
  { id: 207, title: "Course Schedule", difficulty: "Medium", acceptance: 46.3, url: "https://leetcode.com/problems/course-schedule/" },
  { id: 208, title: "Implement Trie (Prefix Tree)", difficulty: "Medium", acceptance: 64.2, url: "https://leetcode.com/problems/implement-trie-prefix-tree/" },
  { id: 215, title: "Kth Largest Element in an Array", difficulty: "Medium", acceptance: 66.8, url: "https://leetcode.com/problems/kth-largest-element-in-an-array/" },
  { id: 230, title: "Kth Smallest Element in a BST", difficulty: "Medium", acceptance: 71.5, url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/" },
  { id: 236, title: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium", acceptance: 61.3, url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/" },
  { id: 238, title: "Product of Array Except Self", difficulty: "Medium", acceptance: 65.1, url: "https://leetcode.com/problems/product-of-array-except-self/" },
  { id: 287, title: "Find the Duplicate Number", difficulty: "Medium", acceptance: 59.3, url: "https://leetcode.com/problems/find-the-duplicate-number/" },
  { id: 300, title: "Longest Increasing Subsequence", difficulty: "Medium", acceptance: 53.2, url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { id: 322, title: "Coin Change", difficulty: "Medium", acceptance: 43.1, url: "https://leetcode.com/problems/coin-change/" },
  { id: 347, title: "Top K Frequent Elements", difficulty: "Medium", acceptance: 64.3, url: "https://leetcode.com/problems/top-k-frequent-elements/" },
  { id: 416, title: "Partition Equal Subset Sum", difficulty: "Medium", acceptance: 47.2, url: "https://leetcode.com/problems/partition-equal-subset-sum/" },
  { id: 424, title: "Longest Repeating Character Replacement", difficulty: "Medium", acceptance: 52.1, url: "https://leetcode.com/problems/longest-repeating-character-replacement/" },
  { id: 435, title: "Non-overlapping Intervals", difficulty: "Medium", acceptance: 51.8, url: "https://leetcode.com/problems/non-overlapping-intervals/" },
  { id: 438, title: "Find All Anagrams in a String", difficulty: "Medium", acceptance: 49.8, url: "https://leetcode.com/problems/find-all-anagrams-in-a-string/" },
  { id: 621, title: "Task Scheduler", difficulty: "Medium", acceptance: 57.3, url: "https://leetcode.com/problems/task-scheduler/" },

  // Hard Problems
  { id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", acceptance: 37.8, url: "https://leetcode.com/problems/median-of-two-sorted-arrays/" },
  { id: 10, title: "Regular Expression Matching", difficulty: "Hard", acceptance: 28.1, url: "https://leetcode.com/problems/regular-expression-matching/" },
  { id: 23, title: "Merge k Sorted Lists", difficulty: "Hard", acceptance: 51.2, url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
  { id: 25, title: "Reverse Nodes in k-Group", difficulty: "Hard", acceptance: 56.8, url: "https://leetcode.com/problems/reverse-nodes-in-k-group/" },
  { id: 32, title: "Longest Valid Parentheses", difficulty: "Hard", acceptance: 33.1, url: "https://leetcode.com/problems/longest-valid-parentheses/" },
  { id: 37, title: "Sudoku Solver", difficulty: "Hard", acceptance: 58.3, url: "https://leetcode.com/problems/sudoku-solver/" },
  { id: 41, title: "First Missing Positive", difficulty: "Hard", acceptance: 37.2, url: "https://leetcode.com/problems/first-missing-positive/" },
  { id: 42, title: "Trapping Rain Water", difficulty: "Hard", acceptance: 60.1, url: "https://leetcode.com/problems/trapping-rain-water/" },
  { id: 44, title: "Wildcard Matching", difficulty: "Hard", acceptance: 27.8, url: "https://leetcode.com/problems/wildcard-matching/" },
  { id: 51, title: "N-Queens", difficulty: "Hard", acceptance: 66.3, url: "https://leetcode.com/problems/n-queens/" },
  { id: 72, title: "Edit Distance", difficulty: "Hard", acceptance: 54.2, url: "https://leetcode.com/problems/edit-distance/" },
  { id: 76, title: "Minimum Window Substring", difficulty: "Hard", acceptance: 41.1, url: "https://leetcode.com/problems/minimum-window-substring/" },
  { id: 84, title: "Largest Rectangle in Histogram", difficulty: "Hard", acceptance: 43.8, url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" },
  { id: 85, title: "Maximal Rectangle", difficulty: "Hard", acceptance: 45.3, url: "https://leetcode.com/problems/maximal-rectangle/" },
  { id: 124, title: "Binary Tree Maximum Path Sum", difficulty: "Hard", acceptance: 39.2, url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
  { id: 127, title: "Word Ladder", difficulty: "Hard", acceptance: 37.1, url: "https://leetcode.com/problems/word-ladder/" },
  { id: 212, title: "Word Search II", difficulty: "Hard", acceptance: 37.8, url: "https://leetcode.com/problems/word-search-ii/" },
  { id: 239, title: "Sliding Window Maximum", difficulty: "Hard", acceptance: 46.3, url: "https://leetcode.com/problems/sliding-window-maximum/" },
  { id: 295, title: "Find Median from Data Stream", difficulty: "Hard", acceptance: 51.2, url: "https://leetcode.com/problems/find-median-from-data-stream/" },
  { id: 297, title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", acceptance: 56.1, url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/" },
];

function LeetCodeTab() {
  const [randomProblems, setRandomProblems] = useState([]);

  const getRandomProblems = () => {
    const shuffled = [...LEETCODE_PROBLEMS].sort(() => Math.random() - 0.5);
    setRandomProblems(shuffled.slice(0, 3));
  };

  const difficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "#4ade80";
      case "Medium":
        return "#facc15";
      case "Hard":
        return "#f87171";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div>
      <h2>LeetCode / Interview Practice</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "16px" }}>
        Get 3 random LeetCode problems to practice. Click the button to generate
        a new set of challenges!
      </p>

      <button
        onClick={getRandomProblems}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "1px solid #22c55e",
          background: "#22c55e22",
          color: "#e5e7eb",
          fontSize: "0.9rem",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        🎲 Get 3 Random Problems
      </button>

      {randomProblems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {randomProblems.map((problem) => (
            <a
              key={problem.id}
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "16px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1f2937",
                textDecoration: "none",
                color: "#e5e7eb",
                display: "block",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#22c55e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1f2937";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1rem", marginBottom: "4px" }}>
                    {problem.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                    Problem #{problem.id}
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    background: `${difficultyColor(problem.difficulty)}22`,
                    color: difficultyColor(problem.difficulty),
                    border: `1px solid ${difficultyColor(problem.difficulty)}`,
                  }}
                >
                  {problem.difficulty}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
/** ---------- LINKEDIN TAB ---------- **/

function LinkedInTab() {
  return (
    <div>
      <h2>LinkedIn Networking</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "8px" }}>
        This tab is for anything around outreach: tracking who you messaged,
        templates for cold messages, and follow-up reminders.
      </p>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        It ties to your &quot;Send 2 networking messages on LinkedIn&quot;
        daily task.
      </p>
    </div>
  );
}

/** ---------- RESUME TAB (still placeholder) ---------- **/

function ResumeTab() {
  return (
    <div>
      <h2>Resume Checker (coming soon)</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        You’ll be able to upload a resume here and get feedback on links, action
        verbs, metrics, whitespace, and job-description keyword matches.
      </p>
    </div>
  );
}
