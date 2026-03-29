// ===== WEAK TOPICS ANALYSIS =====

export function recordQuizSubmission(subject, chapter, answers, quiz) {
  try {
    const submissions = getQuizSubmissions();
    
    // Calculate which questions were wrong
    const wrongQuestions = [];
    const wrongTopics = new Set();
    
    quiz.forEach((q, idx) => {
      if (answers[idx] !== q.ans) {
        wrongQuestions.push({
          qIdx: idx + 1,
          question: q.q,
          correctAns: q.ans,
          userAns: answers[idx],
        });
        // Extract possible topic from question
        const topic = extractTopicFromQuestion(q.q);
        if (topic) wrongTopics.add(topic);
      }
    });

    const score = quiz.filter((q, idx) => answers[idx] === q.ans).length;
    const accuracy = Math.round((score / quiz.length) * 100);

    const submission = {
      id: Date.now(),
      subject,
      chapter,
      date: new Date().toISOString(),
      score,
      total: quiz.length,
      accuracy,
      wrongQuestions,
      wrongTopics: Array.from(wrongTopics),
    };

    submissions.push(submission);
    localStorage.setItem("akmedu_quiz_submissions", JSON.stringify(submissions.slice(-100))); // Keep last 100
    return submission;
  } catch (e) {
    console.warn("Failed to record quiz submission:", e);
    return null;
  }
}

export function getQuizSubmissions() {
  try {
    const saved = localStorage.getItem("akmedu_quiz_submissions");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function getWeakTopics(limit = 5) {
  const submissions = getQuizSubmissions();
  const topicMap = {};
  const ignoreWords = new Set(["Which", "What", "Why", "How", "When", "Who", "Where", "The", "A", "An", "In", "On", "At", "To", "Is", "Are", "Do", "Does", "Did", "As", "If", "Identify", "Consider", "According"]);

  // Aggregate wrong topics across all submissions
  submissions.forEach(sub => {
    sub.wrongTopics.forEach(topic => {
      if (topic && topic.length > 2 && !ignoreWords.has(topic.split(' ')[0])) {
        topicMap[topic] = (topicMap[topic] || 0) + 1;
      }
    });
  });

  // Sort by frequency and return top N
  return Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, mistakeCount: count }));
}

export function getWeakChapters(limit = 5) {
  const submissions = getQuizSubmissions();
  const chapterMap = {};

  // Track average accuracy per chapter
  submissions.forEach(sub => {
    const key = `${sub.subject}||${sub.chapter}`;
    if (!chapterMap[key]) {
      chapterMap[key] = { accuracies: [], subject: sub.subject, chapter: sub.chapter };
    }
    chapterMap[key].accuracies.push(sub.accuracy);
  });

  // Calculate average accuracy and return lowest performers
  return Object.values(chapterMap)
    .map(ch => ({
      subject: ch.subject,
      chapter: ch.chapter,
      avgAccuracy: Math.round(ch.accuracies.reduce((a, b) => a + b) / ch.accuracies.length),
      attempts: ch.accuracies.length,
    }))
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
    .slice(0, limit);
}

export function getRecentWeakQuestions(limit = 5) {
  const submissions = getQuizSubmissions();
  const allWrongQuestions = [];

  submissions.slice(-10).forEach(sub => {
    if (sub.wrongQuestions) {
      allWrongQuestions.push(
        ...sub.wrongQuestions.map(q => ({
          ...q,
          chapter: sub.chapter,
          subject: sub.subject,
          date: sub.date,
        }))
      );
    }
  });

  return allWrongQuestions.slice(-limit).reverse();
}

export function getQuizReport(subject, chapter) {
  const submissions = getQuizSubmissions().filter(s => s.subject === subject && s.chapter === chapter);

  if (submissions.length === 0) {
    return {
      chapter,
      subject,
      totalAttempts: 0,
      avgAccuracy: 0,
      bestScore: 0,
      attempts: [],
    };
  }

  const accuracies = submissions.map(s => s.accuracy);
  return {
    chapter,
    subject,
    totalAttempts: submissions.length,
    avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b) / accuracies.length),
    bestScore: Math.max(...accuracies),
    worstScore: Math.min(...accuracies),
    attempts: submissions.map(s => ({ date: s.date, score: s.score, total: s.total, accuracy: s.accuracy })),
  };
}

function extractTopicFromQuestion(questionText) {
  // Extract possible topic by finding capitalized words (simple heuristic)
  const ignoreWords = new Set(["Which", "What", "Why", "How", "When", "Who", "Where", "The", "A", "An", "In", "On", "At", "To", "Is", "Are", "Do", "Does", "Did", "As", "If", "Identify", "Consider", "According"]);
  const matches = questionText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
  
  if (matches) {
    const validTopics = matches.filter(m => !ignoreWords.has(m.split(' ')[0]));
    if (validTopics.length > 0) return validTopics[0];
    
    // Fallback: extract the longest word in the question that isn't a stopword
    const words = questionText.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4 && w[0] === w[0].toUpperCase());
    if (words.length > 0) {
      return words.reduce((a, b) => a.length > b.length ? a : b);
    }
  }
  
  return null;
}

export function clearAllSubmissions() {
  try {
    localStorage.removeItem("akmedu_quiz_submissions");
  } catch (e) {
    console.warn("Failed to clear submissions:", e);
  }
}
