import { useState, useEffect } from "react";

export default function LeetCodeTab() {
  const [randomProblems, setRandomProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allProblems, setAllProblems] = useState([]);

  const titleToSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') 
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const normalizeDifficulty = (diff) => {
    if (diff.toLowerCase().includes('easy')) return 'Easy';
    if (diff.toLowerCase().includes('med')) return 'Medium';
    if (diff.toLowerCase().includes('hard')) return 'Hard';
    return diff;
  };

  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/leetcode-problems.json');
        if (!response.ok) throw new Error('Failed to load problems file');
        const data = await response.json();
        
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
      case "Easy": return "#4ade80";
      case "Medium": return "#facc15";
      case "Hard": return "#f87171";
      default: return "#9ca3af";
    }
  };

  return (
    <div>
      <h2>LeetCode / Interview Practice</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "16px" }}>
        {allProblems.length > 0 ? `Get 3 random LeetCode problems to practice.` : "Loading problems..."}
      </p>

      <button
        onClick={getRandomProblems}
        disabled={loading || allProblems.length === 0}
        style={{
          padding: "10px 20px", borderRadius: "8px", border: "1px solid #22c55e",
          background: (loading || allProblems.length === 0) ? "#1f2937" : "#22c55e22",
          color: (loading || allProblems.length === 0) ? "#9ca3af" : "#e5e7eb",
          fontSize: "0.9rem", cursor: (loading || allProblems.length === 0) ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "Loading problems..." : "Get 3 Random Problems"}
      </button>

      {error && (
        <div style={{ padding: "12px", borderRadius: "8px", background: "#7f1d1d22", border: "1px solid #dc2626", color: "#fca5a5", marginBottom: "16px", fontSize: "0.9rem" }}>
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
                padding: "16px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937",
                textDecoration: "none", color: "#e5e7eb", display: "block", transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#22c55e"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1f2937"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1rem", marginBottom: "4px" }}>{problem.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Problem #{problem.id}</div>
                </div>
                <div style={{
                    padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "500",
                    background: `${difficultyColor(problem.difficulty)}22`,
                    color: difficultyColor(problem.difficulty),
                    border: `1px solid ${difficultyColor(problem.difficulty)}`,
                  }}>
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