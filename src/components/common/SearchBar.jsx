import { useState, useEffect, useRef } from "react";
import { CURRICULUM } from "../../constants/curriculum";
import { createDebouncedQuery } from "../../utils/queryOptimization";

export function SearchBar({ onSelectChapter, onSelectSubject }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchRef = useRef(null);

  // Create debounced search function on mount
  useEffect(() => {
    debouncedSearchRef.current = createDebouncedQuery(
      async (searchQuery) => {
        if (!searchQuery.trim()) {
          return [];
        }

        const q = searchQuery.toLowerCase();
        const foundChapters = [];

        // Search across all subjects and chapters
        Object.entries(CURRICULUM).forEach(([subjectName, data]) => {
          data.units?.forEach((unit) => {
            unit.chapters?.forEach((chapter) => {
              if (
                chapter.toLowerCase().includes(q) ||
                subjectName.toLowerCase().includes(q)
              ) {
                foundChapters.push({
                  subject: subjectName,
                  chapter,
                  unit: unit.name,
                });
              }
            });
          });
        });

        return foundChapters.slice(0, 10);
      },
      300 // 300ms debounce delay
    );
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    debouncedSearchRef.current(query)
      .then(setResults)
      .catch(() => setResults([]));
  }, [query]);

  const handleSelectChapter = (subject, chapter) => {
    onSelectSubject(subject);
    setTimeout(() => onSelectChapter(chapter), 100);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Search chapters..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1.5px solid #dbeafe",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 0.2s",
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              setQuery("");
            }
          }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1.5px solid #dbeafe",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            boxShadow: "0 8px 20px rgba(236, 72, 153, 0.15)",
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {results.map((result, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectChapter(result.subject, result.chapter)}
              style={{
                padding: "12px 14px",
                borderBottom: idx < results.length - 1 ? "1px solid #dbeafe" : "none",
                cursor: "pointer",
                transition: "background 0.2s",
                background: "white",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9fc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1" }}>
                {result.subject}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 2 }}>
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
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1.5px solid #dbeafe",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: "16px",
            textAlign: "center",
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          No chapters found
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
