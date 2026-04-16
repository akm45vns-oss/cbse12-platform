import { useState } from "react";
import { useScrollDirection } from "../../hooks";
import { ForumModal } from "./ForumModal";

export function FloatingForumButton({ currentSubject = "", currentChapter = "", currentUser = "" }) {
  const [isForumOpen, setIsForumOpen] = useState(false);
  const { isScrollingUp, isAtTop } = useScrollDirection();

  return (
    <>
      {/* Floating Button - Positioned at top-right for easy access */}
      <button
        onClick={() => setIsForumOpen(true)}
        style={{
          position: "fixed",
          top: 80,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0891b2, #0284c7)",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(8, 145, 178, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          transition: "all 0.3s",
          transform: isScrollingUp || isAtTop ? "translateX(0)" : "translateX(100px)",
          opacity: isScrollingUp || isAtTop ? 1 : 0,
          pointerEvents: isScrollingUp || isAtTop ? "auto" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(8, 145, 178, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(8, 145, 178, 0.3)";
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
        currentUser={currentUser}
      />
    </>
  );
}
