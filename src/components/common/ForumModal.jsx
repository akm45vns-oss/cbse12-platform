import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  getQuestions,
  getAnswers,
  postQuestion,
  postAnswer,
  markHelpful,
  searchQuestions,
  getTrendingQuestions,
  incrementViews,
  getForumStats,
  getQuestionsForChapter,
} from "../../utils/forum";
import { ImageUploader } from "./ImageUploader";

export function ForumModal({ isOpen, onClose, currentSubject = "", currentChapter = "", currentUser = "" }) {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const [activeTab, setActiveTab] = useState("recent"); // recent, trending, myChapter, search
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [questionImage, setQuestionImage] = useState(""); // Image URL for question
  const [answerImage, setAnswerImage] = useState(""); // Image URL for answer
  const [stats, setStats] = useState({ totalQuestions: 0, totalAnswers: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Prevent background scrolling while modal is open
  // SAFE approach: save scroll position, fix body temporarily.
  // Always restores on cleanup — even if modal unmounts mid-flight.
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [isOpen]);

  // Reset internal modal content scroll to top when opened
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Accessibility: Handle Escape key & trap keyboard focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    modalElement.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: wrap to last element if at the first element
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab: wrap to first element if at the last element
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleTabKey);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, onClose]);

  // Load forum stats
  useEffect(() => {
    const loadStats = async () => {
      const data = await getForumStats();
      setStats(data);
    };
    loadStats();
  }, []);

  // Load questions based on active tab
  useEffect(() => {
    if (!isOpen) return;

    const loadQuestions = async () => {
      setIsLoading(true);
      let loaded = [];
      if (activeTab === "recent") {
        loaded = await getQuestions(20);
      } else if (activeTab === "trending") {
        loaded = await getTrendingQuestions();
      } else if (activeTab === "myChapter" && currentSubject && currentChapter) {
        loaded = await getQuestionsForChapter(currentSubject, currentChapter);
      } else if (activeTab === "search" && searchQuery) {
        loaded = await searchQuestions(searchQuery);
      }
      setQuestions(loaded);
      setIsLoading(false);
    };
    loadQuestions();
  }, [isOpen, activeTab, searchQuery, currentSubject, currentChapter]);

  // Load answers when question is selected
  useEffect(() => {
    if (!selectedQuestion) return;

    const loadAnswers = async () => {
      const data = await getAnswers(selectedQuestion.id);
      setAnswers(data);
    };
    loadAnswers();
  }, [selectedQuestion]);

  const handlePostQuestion = async () => {
    if (!newQuestion.trim()) return;

    await postQuestion(newQuestion, currentSubject, currentChapter, questionImage, currentUser || "Anonymous Student");
    setNewQuestion("");
    setQuestionImage("");
    setShowPostForm(false);
    
    // Reload questions
    const reloaded = await getQuestions(20);
    setQuestions(reloaded);
    
    // Update stats
    const newStats = await getForumStats();
    setStats(newStats);
  };

  const handlePostAnswer = async () => {
    if (!newAnswer.trim() || !selectedQuestion) return;

    await postAnswer(selectedQuestion.id, newAnswer, answerImage, currentUser || "Anonymous Student");
    setNewAnswer("");
    setAnswerImage("");
    
    // Reload question with answers
    await incrementViews(selectedQuestion.id);
    const allQuestions = await getQuestions(100);
    const updated = allQuestions.find((q) => q.id === selectedQuestion.id);
    setSelectedQuestion(updated);
    
    // Update stats
    const newStats = await getForumStats();
    setStats(newStats);
  };

  const handleHelpful = async (answerId) => {
    if (!selectedQuestion) return;
    await markHelpful(selectedQuestion.id, answerId);
    
    // Reload answers
    const data = await getAnswers(selectedQuestion.id);
    setAnswers(data);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="forum-modal-overlay" onClick={onClose}>
      <style>{`
        .forum-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .forum-modal-content {
          background: white;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1.5px solid #dbeafe;
          overflow: hidden;
          outline: none;
          transition: all 0.2s ease;
        }
        /* Mobile: < 768px */
        @media (max-width: 767px) {
          .forum-modal-content {
            width: 100% !important;
            max-width: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            padding-top: env(safe-area-inset-top, 0px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }
        /* Tablet: 768px - 1024px */
        @media (min-width: 768px) and (max-width: 1024px) {
          .forum-modal-content {
            width: min(90%, 700px) !important;
            max-width: 700px !important;
            border-radius: 20px !important;
            max-height: 90vh !important;
          }
        }
        /* Desktop: > 1024px */
        @media (min-width: 1025px) {
          .forum-modal-content {
            width: min(90%, 900px) !important;
            max-width: 900px !important;
            border-radius: 20px !important;
            max-height: 85vh !important;
          }
        }
      `}</style>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="forum-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0f9fc, #dbeafe)",
            borderBottom: "1.5px solid #dbeafe",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: "20px 20px 0 0",
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#064e78", margin: 0, marginBottom: 4 }}>
              💬 Community Q&A Forum
            </h2>
            <div style={{ fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
              {stats.totalQuestions} Questions • {stats.totalAnswers} Answers
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#064e78",
              minHeight: "44px",
              minWidth: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              flexShrink: 0,
            }}
            aria-label="Close forum"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #dbeafe",
            overflowX: "auto",
          }}
        >
          {[
            { id: "recent", label: "📌 Recent", show: true },
            { id: "trending", label: "🔥 Trending", show: true },
            {
              id: "myChapter",
              label: "📖 This Chapter",
              show: currentSubject && currentChapter,
            },
            { id: "search", label: "🔍 Search", show: true },
          ].map(
            (tab) =>
              tab.show && (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedQuestion(null);
                  }}
                  style={{
                    background:
                      activeTab === tab.id ? "#0891b2" : "transparent",
                    color: activeTab === tab.id ? "white" : "#0369a1",
                    border:
                      activeTab === tab.id
                        ? "none"
                        : "1.5px solid #dbeafe",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    minHeight: "44px",
                  }}
                >
                  {tab.label}
                </button>
              )
          )}
        </div>

        {/* Content Area */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            minHeight: 0,
          }}
        >
          {!selectedQuestion ? (
            <>
              {/* Search Bar (if search tab) */}
              {activeTab === "search" && (
                <input
                  type="text"
                  placeholder="🔍 Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #dbeafe",
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                />
              )}

              {/* Post Question Button */}
              {!showPostForm && (
                <button
                  onClick={() => setShowPostForm(true)}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "linear-gradient(135deg, #0891b2, #0284c7)",
                    border: "none",
                    borderRadius: 10,
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    marginBottom: 16,
                  }}
                >
                  ✏️ Ask a Question
                </button>
              )}

              {/* Post Form */}
              {showPostForm && (
                <div
                  style={{
                    background: "#f0f9fc",
                    border: "1.5px solid #dbeafe",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <textarea
                    placeholder="Ask your question... (e.g., How to derive equations of motion?)"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #dbeafe",
                      fontSize: 13,
                      fontFamily: "inherit",
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                  
                  {/* Image Uploader */}
                  <div style={{ marginTop: 10, marginBottom: 10 }}>
                    <ImageUploader onImageUpload={setQuestionImage} />
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={handlePostQuestion}
                      style={{
                        flex: 1,
                        padding: 8,
                        background: "#0891b2",
                        border: "none",
                        borderRadius: 8,
                        color: "white",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Post
                    </button>
                    <button
                      onClick={() => {
                        setShowPostForm(false);
                        setNewQuestion("");
                        setQuestionImage("");
                      }}
                      style={{
                        flex: 1,
                        padding: 8,
                        background: "white",
                        border: "1.5px solid #dbeafe",
                        borderRadius: 8,
                        color: "#0369a1",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {questions.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#94a3b8",
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      No questions yet. Be the first to ask!
                    </div>
                  </div>
                ) : (
                  questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={async () => {
                        setSelectedQuestion(q);
                        await incrementViews(q.id);
                      }}
                      style={{
                        background: "white",
                        border: "1.5px solid #dbeafe",
                        borderRadius: 10,
                        padding: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontSize: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#f9a8d4";
                        e.currentTarget.style.background = "#f0f9fc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#dbeafe";
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                        {q.question}
                      </div>
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt="Question"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 100,
                            borderRadius: 6,
                            marginBottom: 8,
                            border: "1px solid #dbeafe",
                          }}
                        />
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          fontSize: 11,
                          color: "#94a3b8",
                          fontWeight: 500,
                          flexWrap: "wrap",
                        }}
                      >
                        {q.subject && (
                          <span
                            style={{
                              background: "#dbeafe",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {q.subject}
                          </span>
                        )}
                        {q.chapter && (
                          <span
                            style={{
                              background: "#dbeafe",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {q.chapter}
                          </span>
                        )}
                        <span>💬 {q.answers?.length || 0} answers</span>
                        <span>👁️ {q.views || 0} views</span>
                        {q.imageUrl && <span>🖼️ Image</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Question Detail View */}
              <button
                onClick={() => setSelectedQuestion(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0891b2",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                ← Back to Questions
              </button>

              <div
                style={{
                  background: "linear-gradient(135deg, #f0f9fc, #dbeafe)",
                  border: "1.5px solid #dbeafe",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                  {selectedQuestion.question}
                </div>
                {selectedQuestion.imageUrl && (
                  <img
                    src={selectedQuestion.imageUrl}
                    alt="Question"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 300,
                      borderRadius: 8,
                      marginBottom: 12,
                      border: "1.5px solid #dbeafe",
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    fontWeight: 500,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <span>Posted by {selectedQuestion.author}</span>
                  <span>👁️ {selectedQuestion.views || 0} views</span>
                  <span>
                    {new Date(selectedQuestion.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Answers */}
              <div style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#064e78",
                    marginBottom: 10,
                  }}
                >
                  💭 Answers ({answers.length})
                </h3>
                {answers.length === 0 ? (
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#94a3b8",
                    }}
                  >
                    No answers yet. Be the first to help!
                  </div>
                ) : (
                  answers.map((ans) => (
                    <div
                      key={ans.id}
                      style={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 8 }}>
                        {ans.text}
                      </div>
                      {ans.imageUrl && (
                        <img
                          src={ans.imageUrl}
                          alt="Answer"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 200,
                            borderRadius: 6,
                            marginBottom: 8,
                            border: "1px solid #e2e8f0",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          display: "flex",
                          gap: 12,
                        }}
                      >
                        <span>Posted by {ans.author}</span>
                        <button
                          onClick={() => handleHelpful(ans.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0891b2",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        >
                          👍 Helpful ({ans.helpful || 0})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Post Answer Form */}
              <div
                style={{
                  background: "#f0f9fc",
                  border: "1.5px solid #dbeafe",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#064e78",
                    marginBottom: 10,
                  }}
                >
                  ✏️ Your Answer
                </h4>
                <textarea
                  placeholder="Share your answer to help the community..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #dbeafe",
                    fontSize: 12,
                    fontFamily: "inherit",
                    minHeight: 80,
                    resize: "vertical",
                    marginBottom: 10,
                  }}
                />

                {/* Image Uploader for Answer */}
                <div style={{ marginBottom: 10 }}>
                  <ImageUploader onImageUpload={setAnswerImage} />
                </div>

                <button
                  onClick={handlePostAnswer}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#0891b2",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Post Answer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
