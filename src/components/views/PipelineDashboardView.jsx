import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabase";
import { CURRICULUM_11, totalChapters11 } from "../../constants/curriculum11";

// Total possible items = chapters × 15 content types
const TOTAL_POSSIBLE = totalChapters11 * 15;

const CONTENT_TYPES = [
  "detailed_notes", "short_notes", "key_definitions", "formula_sheet",
  "important_concepts", "ncert_summary", "mcqs", "assertion_reason",
  "case_based", "short_answer", "long_answer", "pyq_style",
  "difficulty_tags", "learning_objectives", "estimated_study_time",
];

const SUBJECT_EMOJI = Object.fromEntries(
  Object.entries(CURRICULUM_11).map(([s, d]) => [s, d.emoji])
);

function HealthBar({ value, max = 100, color = "#4f46e5" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: pct > 70 ? "#22c55e" : pct > 40 ? "#f59e0b" : "#ef4444",
          borderRadius: 99, transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", minWidth: 35 }}>{pct}%</span>
    </div>
  );
}

function StatCard({ icon, label, value, color = "#4f46e5", sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "18px 20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color }}>{value.toLocaleString()}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function KeyHealthRow({ keyNum, health, active, cooldownSec, disabled }) {
  const bar = Math.floor((health || 0) / 10);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: disabled ? "#fee2e2" : cooldownSec > 0 ? "#fef3c7" : "#d1fae5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: disabled ? "#dc2626" : cooldownSec > 0 ? "#92400e" : "#065f46",
        flexShrink: 0,
      }}>
        K{keyNum}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <HealthBar value={health || 0} />
      </div>
      <div style={{ fontSize: 11, color: "#64748b", flexShrink: 0, minWidth: 90, textAlign: "right" }}>
        {disabled ? "🔴 Disabled" :
         cooldownSec > 0 ? `❄️ ${cooldownSec}s` :
         active > 0 ? `🔄 ${active} active` : "✅ Ready"}
      </div>
    </div>
  );
}

export function PipelineDashboardView() {
  const [stats, setStats]       = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch aggregate counts from Supabase with pagination to overcome 1000 limit
      const bySubject = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await supabase
          .from("content_library")
          .select("subject, content_type, is_valid")
          .eq("class_level", "11")
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (err) throw new Error(err.message);

        if (data && data.length > 0) {
          bySubject.push(...data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Compute aggregates
      const total      = bySubject.length;
      const valid      = bySubject.filter(r => r.is_valid).length;
      const invalid    = total - valid;

      // By subject
      const subjectMap = {};
      for (const row of bySubject) {
        if (!subjectMap[row.subject]) subjectMap[row.subject] = { generated: 0, total: 0 };
        subjectMap[row.subject].generated += 1;
      }

      // Fill in total possible for each subject
      for (const [subject, data] of Object.entries(CURRICULUM_11)) {
        const chapters = data.units.reduce((a, u) => a + u.chapters.length, 0);
        if (!subjectMap[subject]) subjectMap[subject] = { generated: 0, total: 0 };
        subjectMap[subject].total = chapters * 15;
      }

      setStats({ total, valid, invalid, bySubject: subjectMap });
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load local progress.json if available (written by Node pipeline)
  const fetchLocalProgress = useCallback(async () => {
    // In a browser context we can't read filesystem directly.
    // The pipeline writes progress to Supabase or we poll the DB.
    // For now, we show DB-sourced stats only.
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 15_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  const generated   = stats?.valid || 0;
  const pending     = Math.max(0, TOTAL_POSSIBLE - generated);
  const pct         = TOTAL_POSSIBLE > 0 ? Math.round((generated / TOTAL_POSSIBLE) * 100) : 0;

  return (
    <div style={{ animation: "fadeInUp 0.4s ease", paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>
              🔬 Content Pipeline
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
              Class 11 — AI Content Generation Dashboard
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={fetchStats}
              style={{
                background: "#4f46e5", color: "#fff", border: "none",
                borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(a => !a)}
              style={{
                background: autoRefresh ? "#d1fae5" : "#f1f5f9",
                color: autoRefresh ? "#065f46" : "#64748b",
                border: "1px solid " + (autoRefresh ? "#a7f3d0" : "#e2e8f0"),
                borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {autoRefresh ? "⏸ Auto" : "▶ Manual"}
            </button>
          </div>
        </div>
        {lastUpdated && (
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14,
          padding: "14px 18px", marginBottom: 20, color: "#dc2626", fontSize: 13,
        }}>
          ⚠️ {error} — Make sure the Supabase migration has been applied.
        </div>
      )}

      {/* ── Overall Progress Bar ────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: 24, marginBottom: 20,
        boxShadow: "0 4px 20px rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Overall Progress</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {generated.toLocaleString()} / {TOTAL_POSSIBLE.toLocaleString()} content items generated
            </div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#4f46e5" }}>{pct}%</div>
        </div>
        <div style={{ height: 14, background: "#ede9fe", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #4f46e5, #818cf8)",
            borderRadius: 99, transition: "width 1s ease",
          }} />
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard icon="✅" label="Generated" value={generated} color="#16a34a" sub={`of ${TOTAL_POSSIBLE.toLocaleString()} total`} />
        <StatCard icon="⏳" label="Pending" value={pending} color="#f59e0b" sub="awaiting generation" />
        <StatCard icon="📚" label="Total Chapters" value={totalChapters11} color="#4f46e5" sub="Class 11 CBSE" />
        <StatCard icon="🔬" label="Content Types" value={15} color="#0ea5e9" sub="per chapter" />
      </div>

      {/* ── Subject Progress ────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: 24, marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 18, marginTop: 0 }}>
          📊 Subject Progress
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>Loading...</div>
        ) : stats?.bySubject ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(stats.bySubject)
              .sort(([, a], [, b]) => (b.generated / b.total) - (a.generated / a.total))
              .map(([subject, data]) => {
                const subPct = data.total > 0 ? Math.round((data.generated / data.total) * 100) : 0;
                const d = CURRICULUM_11[subject];
                return (
                  <div key={subject}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{SUBJECT_EMOJI[subject] || "📚"}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{subject}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                        {data.generated} / {data.total}
                      </span>
                    </div>
                    <HealthBar value={subPct} color={d?.accent || "#4f46e5"} />
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ color: "#94a3b8", textAlign: "center" }}>No data yet — start the pipeline!</div>
        )}
      </div>

      {/* ── How to Run the Pipeline ─────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        borderRadius: 20, padding: 24, color: "#e2e8f0",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 0, marginBottom: 16 }}>
          🚀 How to Run the Pipeline
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { cmd: "npm run generate-class11", desc: "Generate all Class 11 content" },
            { cmd: "npm run generate-class11 -- --dry-run", desc: "Preview tasks without generating" },
            { cmd: "npm run generate-class11 -- --subject Physics", desc: "Only Physics chapters" },
            { cmd: "npm run retry-failed", desc: "Retry all failed tasks" },
            { cmd: "npm run export-class11", desc: "Export all content to JSON files" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px" }}>
              <code style={{ fontSize: 13, color: "#a5f3fc", fontFamily: "monospace" }}>{cmd}</code>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(245,158,11,0.15)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.3)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>⚠️ Before running:</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            Apply the SQL migration in Supabase Dashboard → SQL Editor → open <code style={{ color: "#a5f3fc" }}>supabase/migrations/add_class_level.sql</code>
          </div>
        </div>
      </div>

    </div>
  );
}
