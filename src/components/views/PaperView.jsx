import { Badge, LoadingScreen, ExamTimer } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { useEffect } from "react";
import { startSession, endSession } from "../../utils/sessionTracking";

export function PaperView({ subject, paper, loading, loadMsg, loadEmoji, curriculumData, onRegenerate }) {
  const S = curriculumData;

  // Track paper session
  useEffect(() => {
    const sessionId = startSession(subject, "Sample Paper", "paper");
    
    return () => {
      endSession(true); // Mark as completed when leaving paper view
    };
  }, [subject]);
  
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
      {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : (
        <div id="printable-content" style={{ background: "white", borderRadius: 20, border: "1px solid #dbeafe", padding: "clamp(16px, 4vw, 32px)" }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #dbeafe", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge color={S?.accent || "#6366f1"}>{subject}</Badge>
              <ExamTimer initialSeconds={10800} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "8px 0 0" }}>Sample Board Exam Paper</h2>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => window.print()} style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 9, padding: "8px 16px", color: "#334155", fontSize: 13, fontWeight: 600 }}>📥 Save PDF</button>
              <button onClick={onRegenerate} style={{ background: "#dbeafe", border: "none", borderRadius: 9, padding: "8px 16px", color: "#0369a1", fontSize: 13, fontWeight: 600 }}>🔄 Regenerate</button>
            </div>
          </div>
          {/* Professionally Formatted Paper */}
          <div className="prose-paper-block" style={{ background: "#f8fafc", padding: "clamp(20px, 4vw, 40px)", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "inset 0 2px 20px rgba(0,0,0,0.02)", marginTop: 24 }}>
            <div className="prose-paper" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: "15.5px", color: "#1e293b" }}>
              {paper.split('\n').map((line, i) => {
                if (line.trim() === '') return <div key={i} style={{ height: 12 }} />;

                // 1. Convert bold markdown **text** to actual bold text
                let formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

                // 2. Convert horizontal lines
                if (line.includes('━━━') || line.includes('---')) {
                  return <hr key={i} style={{ border: "none", borderTop: "2px solid #cbd5e1", margin: "24px 0" }} />;
                }

                // 3. Center the main headings (CBSE, SAMPLE PAPER)
                if (line.includes('CENTRAL BOARD') || line.includes('SAMPLE QUESTION PAPER')) {
                  return <h3 key={i} style={{ textAlign: "center", fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px", fontFamily: "system-ui, sans-serif" }}>{line}</h3>;
                }

                // 4. Style Section Headers and Instructions beautifully with Subject Colors
                if (/^(\*\*|)Section\s[A-Z]/i.test(line.trim()) || line.toLowerCase().includes('general instructions')) {
                  return (
                    <h4 key={i} style={{
                      fontFamily: "system-ui, sans-serif", fontSize: "16px", fontWeight: "800",
                      color: S?.text || "#1d4ed8", background: S?.light || "#eff6ff",
                      padding: "10px 16px", borderRadius: "8px", margin: "32px 0 16px",
                      borderLeft: `4px solid ${S?.accent || "#3b82f6"}`, letterSpacing: "0.03em"
                    }} dangerouslySetInnerHTML={{ __html: formatted }} />
                  );
                }

                // 5. Regular questions and text
                return <p key={i} style={{ margin: "0 0 8px", lineHeight: "1.7" }} dangerouslySetInnerHTML={{ __html: formatted }} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
