import { useState } from "react";
import { ForumModal } from "./ForumModal";

export function FloatingForumButton({ currentSubject = "", currentChapter = "" }) {
  const [isForumOpen, setIsForumOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsForumOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0891b2, #0284c7)",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(236, 72, 153, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(236, 72, 153, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(236, 72, 153, 0.4)";
        }}
        title="Community Forum - Ask questions and get answers"
      >
        💬
      </button>

      {/* Forum Modal */}
      <ForumModal
        isOpen={isForumOpen}
        onClose={() => setIsForumOpen(false)}
        currentSubject={currentSubject}
        currentChapter={currentChapter}
      />
    </>
  );
}
