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
    <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Search chapters..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={(e) => { setIsOpen(true); e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6, 182, 212, 0.15)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; }}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#f8fafc",
            fontSize: 14,
            fontWeight: 500,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            outline: "none",
          }}
          onKeyDown={(e) => { if (e.key === "Escape") { setIsOpen(false); setQuery(""); } }}
        />
        <style>{`input::placeholder { color: #64748b; }`}</style>
      </div>

      {isOpen && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            boxShadow: "0 14px 40px rgba(0, 0, 0, 0.5)",
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.transform = "translateX(4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateX(0)"; }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {result.subject}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", marginTop: 4 }}>
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
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "24px",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 500,
            color: "#94a3b8",
            boxShadow: "0 14px 40px rgba(0, 0, 0, 0.5)",
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
