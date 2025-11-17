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
          label="Networking"
          active={activeTab === TABS.APPLY}
          onClick={() => setActiveTab(TABS.APPLY)}
        />
        <TabButton
          label="LeetCode"
          active={activeTab === TABS.LEETCODE}
          onClick={() => setActiveTab(TABS.LEETCODE)}
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
            let statusLabel = "0% done";
            let statusColor = "#9ca3af";
            let bg = "#111827";

            if (day.percent === 100) {
              statusLabel = "100% done";
              statusColor = "#4ade80";
              bg = "#16a34a22";
            } else if (day.percent > 0) {
              statusLabel = `${day.percent}% done`;
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
                <option value="custom">Custom</option>
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
  const [jobs, setJobs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    postUrl: '',
    description: '',
    status: 'saved',
    contacts: []
  });
  const [newContact, setNewContact] = useState({ name: '', linkedin: '', status: 'none' });

  // Helper function to ensure URL has proper protocol
  const ensureHttps = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return 'https://' + url;
  };

  // Load jobs from localStorage on mount
  useEffect(() => {
    try {
      const savedJobs = window.localStorage.getItem('job_applications');
      if (savedJobs) {
        setJobs(JSON.parse(savedJobs));
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  }, []);

  // Save jobs to localStorage whenever they change
  useEffect(() => {
    window.localStorage.setItem('job_applications', JSON.stringify(jobs));
  }, [jobs]);

  const addJob = () => {
    if (!newJob.title || !newJob.company) {
      alert('Please fill in job title and company name');
      return;
    }

    const job = {
      ...newJob,
      id: Date.now()
    };

    setJobs([...jobs, job]);
    resetForm();
  };

  const startEdit = (job) => {
    setEditingJob(job.id);
    setNewJob({ ...job });
    setShowAddForm(true);
  };

  const saveEdit = () => {
    if (!newJob.title || !newJob.company) {
      alert('Please fill in job title and company name');
      return;
    }

    setJobs(jobs.map(job => job.id === editingJob ? newJob : job));
    resetForm();
  };

  const resetForm = () => {
    setNewJob({
      title: '',
      company: '',
      location: '',
      postUrl: '',
      description: '',
      status: 'saved',
      contacts: []
    });
    setShowAddForm(false);
    setEditingJob(null);
  };

  const removeJob = (id) => {
    if (window.confirm('Are you sure you want to remove this job application?')) {
      setJobs(jobs.filter(job => job.id !== id));
    }
  };

  const updateJobStatus = (id, newStatus) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: newStatus } : job
    ));
  };

  const toggleExpanded = (id) => {
    setExpandedJobs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const addContactToJob = (jobId) => {
    if (!newContact.name) {
      alert('Please enter a contact name');
      return;
    }

    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          contacts: [...(job.contacts || []), { ...newContact, id: Date.now() }]
        };
      }
      return job;
    }));

    setNewContact({ name: '', linkedin: '', status: 'none' });
  };

  const updateContactStatus = (jobId, contactId, newStatus) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          contacts: job.contacts.map(contact =>
            contact.id === contactId ? { ...contact, status: newStatus } : contact
          )
        };
      }
      return job;
    }));
  };

  const removeContact = (jobId, contactId) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          contacts: job.contacts.filter(contact => contact.id !== contactId)
        };
      }
      return job;
    }));
  };

  const stages = ['saved', 'applied', 'screen', 'interview', 'offer'];
  const stageLabels = {
    saved: 'Saved',
    applied: 'Applied',
    screen: 'Screen',
    interview: 'Interview',
    offer: 'Offer'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Job Applications</h2>
        <button
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #22c55e',
            background: '#22c55e22',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Job'}
        </button>
      </div>

      {showAddForm && (
        <div
          style={{
            padding: '16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: '#020617',
            border: '1px solid #1f2937',
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>
            {editingJob ? 'Edit Job Application' : 'Add New Job Application'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>
                Job Title *
              </label>
              <input
                type="text"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="e.g. Software Engineer"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #4b5563',
                  background: '#0f172a',
                  color: '#e5e7eb',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>
                Company *
              </label>
              <input
                type="text"
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                placeholder="e.g. Google"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #4b5563',
                  background: '#0f172a',
                  color: '#e5e7eb',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>
                Location
              </label>
              <input
                type="text"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="e.g. Remote, New York, NY"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #4b5563',
                  background: '#0f172a',
                  color: '#e5e7eb',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>
                Job Post URL
              </label>
              <input
                type="text"
                value={newJob.postUrl}
                onChange={(e) => setNewJob({ ...newJob, postUrl: e.target.value })}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #4b5563',
                  background: '#0f172a',
                  color: '#e5e7eb',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>
                Job Description
              </label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Paste job description here..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #4b5563',
                  background: '#0f172a',
                  color: '#e5e7eb',
                  resize: 'vertical',
                }}
              />
            </div>
            <button
              onClick={editingJob ? saveEdit : addJob}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #22c55e',
                background: '#22c55e',
                color: '#000',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500',
                marginTop: '8px',
              }}
            >
              {editingJob ? 'Save Changes' : 'Add Job Application'}
            </button>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.9rem',
          }}
        >
          No job applications yet. Click "Add Job" to get started!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#020617',
                border: '1px solid #1f2937',
              }}
            >
              {/* Job Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#e5e7eb', marginBottom: '4px' }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '2px' }}>
                    {job.company}
                  </div>
                  {job.location && (
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '2px' }}>
                      {job.location}
                    </div>
                  )}
                  {job.postUrl && (
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      <a
                        href={ensureHttps(job.postUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#22c55e', textDecoration: 'none' }}
                      >
                        View Job Post
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleExpanded(job.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #4b5563',
                      background: '#1f2937',
                      color: '#e5e7eb',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedJobs[job.id] ? 'Collapse' : 'Expand'}
                  </button>
                  <button
                    onClick={() => startEdit(job)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #3b82f6',
                      background: '#1e3a8a22',
                      color: '#93c5fd',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeJob(job.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #dc2626',
                      background: '#7f1d1d22',
                      color: '#fca5a5',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Status Radio Buttons */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px' }}>Status:</div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {stages.map((stage) => (
                    <label
                      key={stage}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: job.status === stage ? '#22c55e' : '#9ca3af',
                      }}
                    >
                      <input
                        type="radio"
                        name={`status-${job.id}`}
                        checked={job.status === stage}
                        onChange={() => updateJobStatus(job.id, stage)}
                        style={{ cursor: 'pointer' }}
                      />
                      {stageLabels[stage]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Expandable Section */}
              {expandedJobs[job.id] && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#0f172a',
                    borderRadius: '6px',
                    border: '1px solid #1f2937',
                  }}
                >
                  {/* Job Description */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#e5e7eb' }}>
                      Job Description
                    </h4>
                    {job.description ? (
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'pre-wrap' }}>
                        {job.description}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>
                        No description added
                      </div>
                    )}
                  </div>

                  {/* Networking Contacts */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#e5e7eb' }}>
                      Networking Contacts
                    </h4>
                    
                    {/* Contact List */}
                    {job.contacts && job.contacts.length > 0 ? (
                      <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {job.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            style={{
                              padding: '10px',
                              background: '#020617',
                              borderRadius: '4px',
                              border: '1px solid #1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <div style={{ fontSize: '0.9rem', color: '#e5e7eb', marginBottom: '2px' }}>
                                {contact.name}
                              </div>
                              {contact.linkedin && (
                                <a
                                  href={ensureHttps(contact.linkedin)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '0.8rem', color: '#22c55e', textDecoration: 'none' }}
                                >
                                  LinkedIn Profile
                                </a>
                              )}
                            </div>
                            <select
                              value={contact.status}
                              onChange={(e) => updateContactStatus(job.id, contact.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #4b5563',
                                background: '#0f172a',
                                color: '#e5e7eb',
                                fontSize: '0.85rem',
                              }}
                            >
                              <option value="none">No action</option>
                              <option value="connected">Connected</option>
                              <option value="messaged">Messaged</option>
                              <option value="responded">They responded</option>
                            </select>
                            <button
                              onClick={() => removeContact(job.id, contact.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #dc2626',
                                background: '#7f1d1d22',
                                color: '#fca5a5',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '12px' }}>
                        No contacts added yet
                      </div>
                    )}

                    {/* Add Contact Form */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                          Name
                        </label>
                        <input
                          type="text"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          placeholder="Contact name"
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #4b5563',
                            background: '#020617',
                            color: '#e5e7eb',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>
                      <div style={{ flex: '1 1 200px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          value={newContact.linkedin}
                          onChange={(e) => setNewContact({ ...newContact, linkedin: e.target.value })}
                          placeholder="linkedin.com/in/..."
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #4b5563',
                            background: '#020617',
                            color: '#e5e7eb',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>
                      <button
                        onClick={() => addContactToJob(job.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #22c55e',
                          background: '#22c55e22',
                          color: '#22c55e',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Add Contact
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/** ---------- LEETCODE TAB ---------- **/
function LeetCodeTab() {
  const [randomProblems, setRandomProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allProblems, setAllProblems] = useState([]);

  // Helper function to convert problem name to URL slug
  const titleToSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Normalize difficulty to standard format
  const normalizeDifficulty = (diff) => {
    if (diff.toLowerCase().includes('easy')) return 'Easy';
    if (diff.toLowerCase().includes('med')) return 'Medium';
    if (diff.toLowerCase().includes('hard')) return 'Hard';
    return diff;
  };

  // Load problems from JSON file on component mount
  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/leetcode-problems.json'); // Adjust path as needed
        if (!response.ok) {
          throw new Error('Failed to load problems file');
        }
        const data = await response.json();
        
        // Transform the data to include URLs
        const problemsWithUrls = data.map(problem => ({
          id: problem.number,
          title: problem.name,
          difficulty: normalizeDifficulty(problem.difficulty),
          url: `https://leetcode.com/problems/${titleToSlug(problem.name)}/`
        }));
        
        setAllProblems(problemsWithUrls);
      } catch (err) {
        setError(err.message);
        console.error('Error loading problems:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProblems();
  }, []);

  const getRandomProblems = () => {
    if (allProblems.length === 0) {
      setError('No problems loaded yet');
      return;
    }

    const shuffled = [...allProblems].sort(() => Math.random() - 0.5);
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
        {allProblems.length > 0 
          ? `Get 3 random LeetCode problems to practice.`
          : "Loading problems..."}
      </p>

      <button
        onClick={getRandomProblems}
        disabled={loading || allProblems.length === 0}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "1px solid #22c55e",
          background: (loading || allProblems.length === 0) ? "#1f2937" : "#22c55e22",
          color: (loading || allProblems.length === 0) ? "#9ca3af" : "#e5e7eb",
          fontSize: "0.9rem",
          cursor: (loading || allProblems.length === 0) ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "Loading problems..." : "Get 3 Random Problems"}
      </button>

      {error && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#7f1d1d22",
            border: "1px solid #dc2626",
            color: "#fca5a5",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          ! {error}
        </div>
      )}

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
/** ---------- RESUME TAB (AI keywords + job title sanity) ---------- **/

function ResumeTab() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // store API key in localStorage so user only pastes once
  const [userGeminiKey, setUserGeminiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("jobhunter_gemini_key") || "";
  });

  const actionVerbs = [
    "led",
    "built",
    "created",
    "implemented",
    "designed",
    "developed",
    "improved",
    "optimized",
    "managed",
    "organized",
    "increased",
    "reduced",
    "launched",
    "owned",
    "collaborated",
    "automated",
  ];

  const handleSaveKey = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jobhunter_gemini_key", userGeminiKey.trim());
    }
    setErrorMsg("");
    alert("Saved API key locally in this browser.");
  };

  const handleDeleteKey = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("jobhunter_gemini_key");
    }
    setUserGeminiKey("");
    setErrorMsg("");
    alert("API key deleted from this browser.");
  };

  const analyze = async () => {
    const text = resumeText || "";
    const lower = text.toLowerCase();
    setErrorMsg("");
    setLoading(true);

    try {
      // --- AI job title suggestions ---
      let jobTitleSuggestions = [];
      let jobTitleAIMessage = "";

      if (!text.trim()) {
        jobTitleAIMessage = "Paste your resume above to run job title checks.";
      } else if (!userGeminiKey || !userGeminiKey.trim()) {
        jobTitleAIMessage =
          "Add a Gemini API key above to get AI-based suggestions for clearer job titles.";
      } else {
        try {
          const suggestions = await suggestJobTitleImprovementsBrowser(
            text,
            userGeminiKey
          );
          if (!suggestions || suggestions.length === 0) {
            jobTitleAIMessage =
              "No obviously confusing or overly internal job titles were detected.";
          } else {
            jobTitleSuggestions = suggestions;
          }
        } catch (titleErr) {
          console.error("Job title AI error:", titleErr);
          jobTitleAIMessage =
            "Job title AI check failed. Other checks still ran. Double-check your API key and quota.";
        }
      }

      // --- Links / GitHub / portfolio ---
      const urlRegex = /https?:\/\/[^\s)]+/gi;
      const allLinks = text.match(urlRegex) || [];
      const hasGithub = /github\.com/i.test(text);
      const hasPortfolio = allLinks.some(
        (link) =>
          !/github\.com/i.test(link) &&
          !/linkedin\.com/i.test(link) &&
          !/leetcode\.com/i.test(link)
      );

      // --- Bullets & metrics ---
      const lines = text.split(/\r?\n/);
      const bulletLines = lines.filter((line) =>
        /^[\s]*[-*•]/.test(line)
      );

      const bulletsWithMetrics = bulletLines.filter((line) =>
        /(\d|\bpercent\b|%|increase|decrease|improved|reduced|saved|grew|boosted)/i.test(
          line
        )
      );

      // --- Action verb at start of bullet ---
      const bulletsNeedingStrongerVerb = [];
      for (const line of bulletLines) {
        const withoutBullet = line.replace(/^[\s]*[-*•]\s*/, "");
        const firstWordMatch = withoutBullet.match(/^([A-Za-z']+)/);
        if (!firstWordMatch) continue;

        const firstWord = firstWordMatch[1].toLowerCase();
        const isActionVerb = actionVerbs.includes(firstWord);
        if (!isActionVerb) {
          bulletsNeedingStrongerVerb.push(line.trim());
        }
      }

      // --- Job description keyword coverage (AI, browser-only) ---
      let keywordCoverage = null;
      let aiMessage = ""; // message specifically for keyword AI

      if (jobText.trim().length > 0) {
        if (!userGeminiKey || !userGeminiKey.trim()) {
          aiMessage =
            "Add a Gemini API key above to see AI keyword coverage for this job description.";
        } else {
          try {
            const keywords = await extractKeywordsFromJobDescriptionBrowser(
              jobText,
              userGeminiKey
            );

            if (!keywords || keywords.length === 0) {
              console.warn(
                "AI keyword extraction returned no keywords. Skipping coverage section."
              );
              aiMessage =
                "AI keyword extraction returned no keywords. Check your key and Gemini quota.";
            } else {
              const resumeLower = lower;
              const matched = [];
              const missing = [];

              for (const kw of keywords) {
                if (resumeLower.includes(kw.toLowerCase())) {
                  matched.push(kw);
                } else {
                  missing.push(kw);
                }
              }

              const total = keywords.length || 1;
              const percent = Math.round((matched.length / total) * 100);

              keywordCoverage = {
                matched,
                missing,
                percent,
                total,
              };
            }
          } catch (aiErr) {
            console.error("AI keyword extraction failed:", aiErr);
            aiMessage =
              "AI keyword extraction failed. Other checks still ran. Double-check your API key and quota.";
          }
        }
      }

      setResults({
        jobTitleSuggestions,
        jobTitleAIMessage,
        allLinks,
        hasGithub,
        hasPortfolio,
        bulletCount: bulletLines.length,
        bulletsWithMetricsCount: bulletsWithMetrics.length,
        bulletsWithMetrics,
        bulletsNeedingStrongerVerb,
        keywordCoverage,
        aiMessage,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err?.message || "Something went wrong running the checks."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Resume Checker</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "12px" }}>
        Paste your resume text below. Optionally paste a job description and a
        Gemini API key to compare keywords (AI in browser).
      </p>

      {/* Gemini API key input */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <label
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Gemini API key (stored only in this browser)
        </label>
        <input
          type="password"
          value={userGeminiKey}
          onChange={(e) => setUserGeminiKey(e.target.value)}
          placeholder="AIzaSyD-..."
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            padding: "6px 8px",
            fontSize: "0.85rem",
            marginBottom: "6px",
          }}
        />
        <button
          onClick={handleSaveKey}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid #22c55e",
            background: "#22c55e22",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Save key locally
        </button>
        <button
          onClick={handleDeleteKey}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid #ef4444",
            background: "#ef444433",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          Delete key
        </button>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            marginTop: "4px",
          }}
        >
          Your key is stored only in this browser’s localStorage and is never
          sent to any server you control.
        </p>
      </div>

      {/* Resume input */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <label
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Resume text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={10}
          placeholder="Paste your resume content here..."
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </div>

      {/* Job description input */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <label
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Job description (optional, used for AI keywords)
        </label>
        <textarea
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={6}
          placeholder="Paste a job description here..."
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </div>

      {errorMsg && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#f97316",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          {errorMsg}
        </p>
      )}

      <button
        onClick={analyze}
        disabled={!resumeText.trim() || loading}
        style={{
          padding: "8px 14px",
          borderRadius: "999px",
          border: "1px solid #22c55e",
          background:
            !resumeText.trim() || loading ? "#111827" : "#22c55e22",
          color: "#e5e7eb",
          fontSize: "0.9rem",
          cursor:
            !resumeText.trim() || loading ? "not-allowed" : "pointer",
          marginBottom: "16px",
        }}
      >
        {loading ? "Running checks..." : "Run checks"}
      </button>

      {results && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Job titles (AI suggestions) */}
<div
  style={{
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#020617",
    border: "1px solid #1f2937",
  }}
>
  <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
    Job titles (AI suggestions)
  </h3>

  {results.jobTitleSuggestions &&
  results.jobTitleSuggestions.length > 0 ? (
    <>
      <p
        style={{
          fontSize: "0.9rem",
          color: "#9ca3af",
          marginBottom: 6,
        }}
      >
        These titles may be overly internal or unclear. Consider using the
        suggested version:
      </p>

      <ul
        style={{
          margin: 0,
          paddingLeft: "1.2rem",
          fontSize: "0.85rem",
          color: "#e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {results.jobTitleSuggestions.map((t, i) => (
          <li key={i}>
            <div>
              <span style={{ color: "#9ca3af" }}>Original:</span>{" "}
              {t.original}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Suggested:</span>{" "}
              <strong>{t.suggested}</strong>
            </div>
          </li>
        ))}
      </ul>
    </>
  ) : (
    <p
      style={{
        fontSize: "0.9rem",
        color: "#9ca3af",
        margin: 0,
      }}
    >
      {results.jobTitleAIMessage ||
        "No obviously unclear or overly internal job titles detected."}
    </p>
  )}
</div>

          {/* Links section */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Links</h3>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>
              GitHub link:{" "}
              {results.hasGithub ? "Found" : "Not detected"}
              <br />
              Portfolio / personal site:{" "}
              {results.hasPortfolio
                ? "Found"
                : "Not clearly detected"}
              <br />
              Total links: {results.allLinks.length}
            </p>
          </div>

          {/* Metrics section */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
              Metrics in bullets
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#9ca3af",
                marginBottom: 8,
              }}
            >
              Bullets with numbers/metrics:{" "}
              {results.bulletsWithMetricsCount} / {results.bulletCount}
            </p>
            {results.bulletsWithMetricsCount === 0 && (
              <p
                style={{ fontSize: "0.85rem", color: "#facc15", margin: 0 }}
              >
                Try adding numbers like &quot;increased X by 20%&quot;,
                &quot;reduced latency by 50ms&quot;, etc.
              </p>
            )}
          </div>

          {/* Action verb section */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
              Bullet action verbs
            </h3>
            {results.bulletsNeedingStrongerVerb.length === 0 ? (
              <p
                style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}
              >
                All detected bullets start with a strong verb (based on the
                current list).
              </p>
            ) : (
              <>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#facc15",
                    marginBottom: 6,
                  }}
                >
                  These bullets might benefit from a stronger starting verb:
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.2rem",
                    fontSize: "0.85rem",
                    color: "#e5e7eb",
                  }}
                >
                  {results.bulletsNeedingStrongerVerb.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Keyword coverage section (if job description given) */}
          {results.keywordCoverage && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
                Job description keywords (AI, in browser)
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                  marginBottom: 6,
                }}
              >
                Coverage: {results.keywordCoverage.percent}% (
                {results.keywordCoverage.matched.length} /{" "}
                {results.keywordCoverage.total} keywords)
              </p>
              {results.keywordCoverage.missing.length > 0 && (
                <>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#facc15",
                      marginBottom: 4,
                    }}
                  >
                    Some keywords not found in your resume (you might weave
                    these in if they truly apply to you):
                  </p>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#e5e7eb",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {results.keywordCoverage.missing
                      .slice(0, 20)
                      .map((kw, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "999px",
                            border: "1px solid #4b5563",
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    {results.keywordCoverage.missing.length > 20 && (
                      <span style={{ color: "#9ca3af" }}>…</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* If user provided job description but AI coverage is unavailable, show a helpful message */}
          {!results.keywordCoverage && jobText.trim().length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
                Job description keywords (AI)
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#facc15",
                  marginBottom: 6,
                }}
              >
                {results.aiMessage ||
                  "Add a Gemini API key above to unlock AI keyword comparison for this job description."}
              </p>
              {!userGeminiKey && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  Your resume checks (titles, links, metrics, action verbs)
                  still ran normally. The AI keyword comparison is optional.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Browser-only Gemini call for job description keywords */
async function extractKeywordsFromJobDescriptionBrowser(jobText, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    console.warn("No Gemini API key set; skipping AI keyword extraction.");
    return [];
  }

  const modelName = "gemini-2.5-flash-lite";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelName +
    ":generateContent?key=" +
    encodeURIComponent(apiKey.trim());

  const prompt = `
Read the following software job description and extract 10 to 30 of the most
important SKILLS or KEYWORDS.

Return ONLY valid JSON in this exact shape:

{
  "keywords": ["keyword1", "keyword2", "keyword3", ...]
}

Rules:
- Each keyword must be short (1–3 words).
- DO NOT group multiple keywords into one string.
- DO NOT add any explanation text, only JSON.

Job description:
---
${jobText}
---
`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Gemini HTTP error:", res.status, txt);
    throw new Error("Gemini API error: HTTP " + res.status);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("\n") || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  const rawKeywords = parsed.keywords;
  if (!rawKeywords) {
    return [];
  }

  let keywords = [];
  if (typeof rawKeywords === "string") {
    keywords = rawKeywords
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(rawKeywords)) {
    keywords = rawKeywords.flatMap((item) => {
      if (typeof item !== "string") return [];
      return item
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    });
  }

  const unique = Array.from(new Set(keywords));
  return unique.slice(0, 40);
}

/** Browser-only Gemini call for job title suggestions */
async function suggestJobTitleImprovementsBrowser(resumeText, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    console.warn("No Gemini API key set; skipping job title AI suggestions.");
    return [];
  }

  const modelName = "gemini-2.5-flash-lite";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelName +
    ":generateContent?key=" +
    encodeURIComponent(apiKey.trim());

  const prompt = `
Extract job titles from the resume text below.

Identify any titles that:
- are overly internal (e.g., "DOE-SULI Intern", "Research Aide II")
- are unclear to a typical tech recruiter
- do not use standard industry phrasing

For each unclear title, suggest a clearer, more standard job title.

Return ONLY valid JSON in this exact format:

{
  "titles": [
    {
      "original": "Original title exactly as written",
      "suggested": "Clearer, more standard title"
    }
  ]
}

If all titles are fine, return:

{ "titles": [] }

Resume:
---
${resumeText}
---
`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Gemini job title API error:", res.status, txt);
    throw new Error("Gemini job title API error: HTTP " + res.status);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("\n") || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  if (!parsed.titles || !Array.isArray(parsed.titles)) return [];

  return parsed.titles
    .map((t) => ({
      original: String(t.original || "").trim(),
      suggested: String(t.suggested || "").trim(),
    }))
    .filter((t) => t.original && t.suggested);
}
