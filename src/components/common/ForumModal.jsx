import { useState, useEffect } from "react";
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

export function ForumModal({ isOpen, onClose, currentSubject = "", currentChapter = "" }) {
  const [activeTab, setActiveTab] = useState("recent"); // recent, trending, myChapter, search
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [questionImage, setQuestionImage] = useState(""); // Image URL for question
  const [answerImage, setAnswerImage] = useState(""); // Image URL for answer
  const stats = getForumStats();

  // Load questions based on active tab
  useEffect(() => {
    if (!isOpen) return;

    let loaded = [];
    if (activeTab === "recent") {
      loaded = getQuestions(20);
    } else if (activeTab === "trending") {
      loaded = getTrendingQuestions();
    } else if (activeTab === "myChapter" && currentSubject && currentChapter) {
      loaded = getQuestionsForChapter(currentSubject, currentChapter);
    } else if (activeTab === "search" && searchQuery) {
      loaded = searchQuestions(searchQuery);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestions(loaded);
  }, [isOpen, activeTab, searchQuery, currentSubject, currentChapter]);

  const handlePostQuestion = () => {
    if (!newQuestion.trim()) return;

    postQuestion(newQuestion, currentSubject, currentChapter, questionImage);
    setNewQuestion("");
    setQuestionImage("");
    setShowPostForm(false);
    
    // Reload questions
    setQuestions(getQuestions(20));
  };

  const handlePostAnswer = () => {
    if (!newAnswer.trim() || !selectedQuestion) return;

    postAnswer(selectedQuestion.id, newAnswer, answerImage);
    setNewAnswer("");
    setAnswerImage("");
    
    // Reload question with answers
    incrementViews(selectedQuestion.id);
    const updated = getQuestions(100).find((q) => q.id === selectedQuestion.id);
    setSelectedQuestion(updated);
  };

  const handleHelpful = (answerId) => {
    if (!selectedQuestion) return;
    markHelpful(selectedQuestion.id, answerId);
    
    // Reload question
    const updated = getQuestions(100).find((q) => q.id === selectedQuestion.id);
    setSelectedQuestion(updated);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          width: "90%",
          maxWidth: 700,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1.5px solid #dbeafe",
        }}
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
            }}
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
                  }}
                >
                  {tab.label}
                </button>
              )
          )}
        </div>

        {/* Content Area */}
        <div
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
                      onClick={() => {
                        setSelectedQuestion(q);
                        incrementViews(q.id);
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
                  💭 Answers ({getAnswers(selectedQuestion.id).length})
                </h3>
                {getAnswers(selectedQuestion.id).length === 0 ? (
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
                  getAnswers(selectedQuestion.id).map((ans) => (
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
                        <span>{ans.author}</span>
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
    </div>
  );
}
