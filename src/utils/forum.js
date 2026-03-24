// Community Forum Utility - Manage questions, answers, and voting

const FORUM_KEY = "akmedu_forum_posts";
const ANSWERS_KEY = "akmedu_forum_answers";

/**
 * Post a new question
 * @param {string} question - Question text
 * @param {string} subject - Subject context (optional)
 * @param {string} chapter - Chapter context (optional)
 * @returns {object} Posted question with ID
 */
export function postQuestion(question, subject = "", chapter = "") {
  if (!question.trim()) return null;

  const posts = getQuestions();
  const newPost = {
    id: Date.now(),
    question: question.trim(),
    subject,
    chapter,
    author: "Anonymous Student", // Could be extended with actual usernames
    timestamp: Date.now(),
    views: 0,
    answers: [],
    helpfulCount: 0,
  };

  posts.push(newPost);
  localStorage.setItem(FORUM_KEY, JSON.stringify(posts.slice(-100))); // Keep last 100 questions
  return newPost;
}

/**
 * Get all questions
 * @param {number} limit - Number of questions to return
 * @returns {array} Array of questions, sorted by recent first
 */
export function getQuestions(limit = 20) {
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  return posts.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Get questions for a specific subject/chapter
 * @param {string} subject - Subject filter
 * @param {string} chapter - Chapter filter
 * @returns {array} Filtered questions
 */
export function getQuestionsForChapter(subject, chapter) {
  const posts = getQuestions(100);
  return posts.filter(
    (p) => p.subject === subject && p.chapter === chapter
  );
}

/**
 * Post an answer to a question
 * @param {number} questionId - ID of question
 * @param {string} answer - Answer text
 * @returns {object} Posted answer with ID
 */
export function postAnswer(questionId, answer) {
  if (!answer.trim()) return null;

  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  const question = posts.find((p) => p.id === questionId);

  if (!question) return null;

  const newAnswer = {
    id: Date.now(),
    text: answer.trim(),
    author: "Anonymous Student",
    timestamp: Date.now(),
    helpful: 0,
    isSelected: false,
  };

  question.answers = question.answers || [];
  question.answers.push(newAnswer);
  localStorage.setItem(FORUM_KEY, JSON.stringify(posts));

  return newAnswer;
}

/**
 * Get answers for a question
 * @param {number} questionId - Question ID
 * @returns {array} Answers sorted by helpfulness
 */
export function getAnswers(questionId) {
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  const question = posts.find((p) => p.id === questionId);
  
  if (!question) return [];
  
  return (question.answers || []).sort((a, b) => b.helpful - a.helpful);
}

/**
 * Mark answer as helpful
 * @param {number} questionId - Question ID
 * @param {number} answerId - Answer ID
 */
export function markHelpful(questionId, answerId) {
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  const question = posts.find((p) => p.id === questionId);

  if (question) {
    const answer = question.answers?.find((a) => a.id === answerId);
    if (answer) {
      answer.helpful = (answer.helpful || 0) + 1;
      localStorage.setItem(FORUM_KEY, JSON.stringify(posts));
      return answer.helpful;
    }
  }
  return 0;
}

/**
 * Search questions by text
 * @param {string} query - Search query
 * @returns {array} Matching questions
 */
export function searchQuestions(query) {
  const posts = getQuestions(100);
  const q = query.toLowerCase();
  return posts.filter(
    (p) =>
      p.question.toLowerCase().includes(q) ||
      p.subject.toLowerCase().includes(q) ||
      p.chapter.toLowerCase().includes(q)
  );
}

/**
 * Get trending questions (most viewed/answered)
 * @returns {array} Top 5 questions by activity
 */
export function getTrendingQuestions() {
  const posts = getQuestions(100);
  return posts
    .sort((a, b) => {
      const scoreA = (a.views || 0) + (a.answers?.length || 0) * 2;
      const scoreB = (b.views || 0) + (b.answers?.length || 0) * 2;
      return scoreB - scoreA;
    })
    .slice(0, 5);
}

/**
 * Increment question view count
 * @param {number} questionId - Question ID
 */
export function incrementViews(questionId) {
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  const question = posts.find((p) => p.id === questionId);

  if (question) {
    question.views = (question.views || 0) + 1;
    localStorage.setItem(FORUM_KEY, JSON.stringify(posts));
  }
}

/**
 * Get forum stats
 * @returns {object} Forum statistics
 */
export function getForumStats() {
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  const totalAnswers = posts.reduce((sum, p) => sum + (p.answers?.length || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  return {
    totalQuestions: posts.length,
    totalAnswers,
    totalViews,
    averageAnswersPerQuestion:
      posts.length > 0 ? (totalAnswers / posts.length).toFixed(1) : 0,
  };
}

/**
 * Clear all forum data (debug utility)
 */
export function clearForum() {
  localStorage.removeItem(FORUM_KEY);
  console.log("Forum cleared");
}
