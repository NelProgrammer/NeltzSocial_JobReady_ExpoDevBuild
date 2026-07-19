// @ts-nocheck
// src/components/RecruitmentApp.js

/*
  RecruitmentApp – UI for sharing CV sections with recruiters.
  Implements the premium design system defined in the core pseudo‑plan:
  - Uses CSS variables (e.g., --color-primary, --glass-bg) for theming.
  - Glass‑morphism panel, gradient button, subtle hover animations.
  - Responsive: column layout on desktop, stacked on mobile.
*/

import React, { useState, useEffect } from "react";

// Helper to call the backend API (adjust base URL if needed)
const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || "API error");
  }
  return response.json();
};

export default function RecruitmentApp() {
  // UI state
  const [sections, setSections] = useState({
    personal_details: true,
    work_experience: true,
    education: true,
    skills: true,
    references: true,
  });
  const [recruiters, setRecruiters] = useState([]);
  const [allowAll, setAllowAll] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load existing preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/recruitment/preferences");
        setAllowAll(data.allow_all);
        setRecruiters(data.recruiter_ids || []);
        setSections(data.section_shares || sections);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addRecruiter = () => {
    if (newRecruiter.trim() && !recruiters.includes(newRecruiter.trim())) {
      setRecruiters((prev) => [...prev, newRecruiter.trim()]);
      setNewRecruiter("");
    }
  };

  const removeRecruiter = (idx) => {
    setRecruiters((prev) => prev.filter((_, i) => i !== idx));
  };

  const savePreferences = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/recruitment/preferences", {
        method: "POST",
        body: JSON.stringify({
          allow_all: allowAll,
          recruiter_ids: recruiters,
          section_shares: sections,
        }),
      });
      alert("Preferences saved!");
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="glass-panel" style={{ padding: "var(--space-md)" }}>Loading…</div>;
  }

  return (
    <div className="glass-panel" style={{ maxWidth: "800px", margin: "2rem auto", padding: "var(--space-lg)" }}>
      <h2 style={{ fontFamily: "var(--font-head)", color: "var(--color-primary)" }}>Share Your CV</h2>

      {error && (
        <div className="alert" style={{ color: "var(--color-accent)", marginBottom: "var(--space-sm)" }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: "var(--space-lg)" }}>
        <label>
          <input type="checkbox" checked={allowAll} onChange={(e) => setAllowAll(e.target.checked)} />
          <span style={{ marginLeft: "0.5rem" }}>Allow all recruiters to view my CV</span>
        </label>
      </section>

      {!allowAll && (
        <section style={{ marginBottom: "var(--space-lg)" }}>
          <h3 style={{ fontFamily: "var(--font-head)", marginBottom: "var(--space-sm)" }}>Select Recruiters</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {recruiters.map((r, i) => (
              <span
                key={i}
                className="badge"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {r}
                <button
                  onClick={() => removeRecruiter(i)}
                  style={{
                    marginLeft: "0.4rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-accent)",
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add recruiter…"
              value={newRecruiter}
              onChange={(e) => setNewRecruiter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecruiter()}
              style={{ flex: "1 0 150px", padding: "0.4rem" }}
            />
            <button className="btn-primary" onClick={addRecruiter} disabled={!newRecruiter.trim()}>
              Add
            </button>
          </div>
        </section>
      )}

      <section style={{ marginBottom: "var(--space-lg)" }}>
        <h3 style={{ fontFamily: "var(--font-head)", marginBottom: "var(--space-sm)" }}>Select Sections to Share</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-sm)" }}>
          {Object.entries(sections).map(([key, checked]) => (
            <label key={key} style={{ display: "flex", alignItems: "center" }}>
              <input type="checkbox" checked={checked} onChange={() => toggleSection(key)} />
              <span style={{ marginLeft: "0.5rem", textTransform: "capitalize" }}>{key.replace("_", " ")}</span>
            </label>
          ))}
        </div>
      </section>

      <button className="btn-primary" onClick={savePreferences} disabled={saving} style={{ width: "100%" }}>
        {saving ? "Saving…" : "Save Preferences"}
      </button>
    </div>
  );
}
