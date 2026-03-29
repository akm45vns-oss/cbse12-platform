import { Badge, LoadingScreen } from "../common";
import { useState, useEffect } from "react";
export function PapersListView({ subject, curriculumData, loading, loadMsg, loadEmoji, onSelectPaper }) {
  const S = curriculumData;
  const [papers, setPapers] = useState([]);
  const [papersLoading, setPapersLoading] = useState(true);

  useEffect(() => {
    const isPracticalSubject = ["Physics", "Chemistry", "Biology", "Computer Science", "Physical Education"].includes(subject);
    const marks = isPracticalSubject ? 70 : 80;
    setPapers([
      { set_number: 1, total_marks: marks },
      { set_number: 2, total_marks: marks },
      { set_number: 3, total_marks: marks },
      { set_number: 4, total_marks: marks },
      { set_number: 5, total_marks: marks }
    ]);
    setPapersLoading(false);
  }, [subject]);

  if (papersLoading || loading) {
    return <LoadingScreen message={loadMsg || `Loading sample papers...`} emoji={loadEmoji || "📄"} />;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 28,
        padding: "clamp(24px,4vw,36px)",
        marginBottom: 36,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
          {subject}
        </div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "#f8fafc", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Sample Board Exam Papers
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, fontWeight: 500 }}>
          5 comprehensive practice papers matching CBSE format & weightage
        </p>
      </div>

      {/* Papers Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
        {papers.map((paper) => (
          <button
            key={paper.set_number}
            onClick={() => onSelectPaper(paper.set_number)}
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              padding: "clamp(20px,3vw,28px)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              minHeight: 200
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${S?.accent || "#06b6d4"}`;
              e.currentTarget.style.background = `rgba(${parseInt(S?.accent?.slice(1, 3), 16)}, ${parseInt(S?.accent?.slice(3, 5), 16)}, ${parseInt(S?.accent?.slice(5, 7), 16)}, 0.1)`;
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = `0 20px 50px rgba(${parseInt(S?.accent?.slice(1, 3), 16)}, ${parseInt(S?.accent?.slice(3, 5), 16)}, ${parseInt(S?.accent?.slice(5, 7), 16)}, 0.2)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
            }}
          >
            <div style={{ fontSize: 48, filter: `drop-shadow(0 4px 12px rgba(${parseInt(S?.accent?.slice(1, 3), 16)}, ${parseInt(S?.accent?.slice(3, 5), 16)}, ${parseInt(S?.accent?.slice(5, 7), 16)}, 0.3))` }}>
              📄
            </div>
            <div style={{ fontWeight: 900, color: "#f8fafc", fontSize: 18, letterSpacing: "-0.01em" }}>
              Set {paper.set_number}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
              {paper.total_marks} Marks
            </div>
            <div style={{
              fontSize: 12,
              color: "#22d3ee",
              fontWeight: 700,
              background: "rgba(34, 211, 238, 0.15)",
              padding: "6px 12px",
              borderRadius: 12,
              marginTop: "auto"
            }}>
              ✓ Ready to Practice
            </div>
          </button>
        ))}
      </div>

      {papers.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: "rgba(15, 23, 42, 0.3)",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
          <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Papers Coming Soon</h3>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Sample papers for {subject} are being generated and will be available shortly.</p>
        </div>
      )}
    </div>
  );
}
