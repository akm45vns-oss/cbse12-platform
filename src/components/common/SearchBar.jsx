import { useState, useEffect, useRef } from "react";
import { CURRICULUM } from "../../constants/curriculum";
import { createDebouncedQuery } from "../../utils/queryOptimization";

export function SearchBar({ onSelectChapter, onSelectSubject }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchRef = useRef(null);

  useEffect(() => {
    debouncedSearchRef.current = createDebouncedQuery(
      async (searchQuery) => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const foundChapters = [];
        Object.entries(CURRICULUM).forEach(([subjectName, data]) => {
          data.units?.forEach((unit) => {
            unit.chapters?.forEach((chapter) => {
              if (chapter.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q)) {
                foundChapters.push({ subject: subjectName, chapter, unit: unit.name });
              }
            });
          });
        });
        return foundChapters.slice(0, 10);
      },
      300
    );
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    debouncedSearchRef.current(query).then(setResults).catch(() => setResults([]));
  }, [query]);

  const handleSelectChapter = (subject, chapter) => {
    onSelectSubject(subject);
    setTimeout(() => onSelectChapter(chapter), 100);
    setQuery(""); setResults([]); setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search chapters or topics..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={(e) => { setIsOpen(true); e.currentTarget.style.borderColor = "rgba(79,70,229,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.12)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
          style={{
            width: "100%",
            padding: "13px 20px",
            borderRadius: 999,
            border: "1.5px solid rgba(0,0,0,0.07)",
            background: "white",
            color: "#0f172a",
            fontSize: 15,
            fontWeight: 500,
            transition: "all 0.2s",
            outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          onKeyDown={(e) => { if (e.key === "Escape") { setIsOpen(false); setQuery(""); } }}
        />
        <style>{`input::placeholder { color: #94a3b8; }`}</style>
      </div>

      {isOpen && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1.5px solid rgba(79,70,229,0.15)",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(79,70,229,0.12)",
            maxHeight: 320,
            overflowY: "auto",
            zIndex: 50,
            padding: 8
          }}
        >
          {results.map((result, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectChapter(result.subject, result.chapter)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,70,229,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {result.subject}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 4 }}>
                {result.chapter}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 16,
            padding: "24px",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 500,
            color: "#64748b",
            boxShadow: "0 14px 40px rgba(148,163,184,0.2)",
          }}
        >
          No chapters found
        </div>
      )}

      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
