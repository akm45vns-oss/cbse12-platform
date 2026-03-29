// Community Forum Utility - Manage questions, answers, and voting
import { supabase } from "./supabase";

const FORUM_KEY = "akmedu_forum_posts";
const ANSWERS_KEY = "akmedu_forum_answers";

/**
 * Post a new question
 * @param {string} question - Question text
 * @param {string} subject - Subject context (optional)
 * @param {string} chapter - Chapter context (optional)
 * @param {string} imageUrl - Image URL (optional)
 * @param {string} currentUser - Current user posting the question
 * @returns {object} Posted question with ID
 */
export async function postQuestion(question, subject = "", chapter = "", imageUrl = "", currentUser = "Anonymous Student") {
  if (!question.trim()) return null;

  try {
    // Try to save to Supabase first
    const { data, error } = await supabase
      .from("forum_posts")
      .insert([
        {
          question: question.trim(),
          author: currentUser,
          subject: subject || null,
          chapter: chapter || null,
          image_url: imageUrl || null,
          views: 0,
          helpful_count: 0,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        question: data.question,
        subject: data.subject,
        chapter: data.chapter,
        imageUrl: data.image_url,
        author: data.author,
        timestamp: new Date(data.created_at).getTime(),
        views: data.views,
        answers: [],
        helpfulCount: data.helpful_count,
      };
    }
  } catch (err) {
    console.error("Error posting to Supabase:", err);
  }

  // Fallback to localStorage if Supabase fails
  const posts = getQuestions();
  const newPost = {
    id: Date.now(),
    question: question.trim(),
    subject,
    chapter,
    imageUrl,
    author: currentUser,
    timestamp: Date.now(),
    views: 0,
    answers: [],
    helpfulCount: 0,
  };

  posts.push(newPost);
  localStorage.setItem(FORUM_KEY, JSON.stringify(posts.slice(-100)));
  return newPost;
}

/**
 * Get all questions
 * @param {number} limit - Number of questions to return
 * @returns {array} Array of questions, sorted by recent first
 */
export async function getQuestions(limit = 20) {
  try {
    // Fetch from Supabase with answers
    const { data: posts, error } = await supabase
      .from("forum_posts")
      .select(`
        id,
        question,
        subject,
        chapter,
        image_url,
        author,
        views,
        helpful_count,
        created_at,
        forum_answers (
          id,
          text,
          author,
          image_url,
          helpful,
          is_selected,
          created_at
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && posts) {
      return posts.map((post) => ({
        id: post.id,
        question: post.question,
        subject: post.subject,
        chapter: post.chapter,
        imageUrl: post.image_url,
        author: post.author,
        timestamp: new Date(post.created_at).getTime(),
        views: post.views,
        answers: (post.forum_answers || []).map((a) => ({
          id: a.id,
          questionId: post.id,
          text: a.text,
          author: a.author,
          imageUrl: a.image_url,
          helpful: a.helpful,
          isSelected: a.is_selected,
          timestamp: new Date(a.created_at).getTime(),
        })),
        helpfulCount: post.helpful_count,
      }));
    }
  } catch (err) {
    console.error("Error fetching from Supabase:", err);
  }

  // Fallback to localStorage if Supabase is unavailable
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  return posts.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Get questions for a specific subject/chapter
 * @param {string} subject - Subject filter
 * @param {string} chapter - Chapter filter
 * @returns {array} Filtered questions
 */
export async function getQuestionsForChapter(subject, chapter) {
  try {
    // Fetch filtered from Supabase
    const { data: posts, error } = await supabase
      .from("forum_posts")
      .select(`
        id,
        question,
        subject,
        chapter,
        image_url,
        author,
        views,
        helpful_count,
        created_at,
        forum_answers (
          id,
          text,
          author,
          image_url,
          helpful,
          is_selected,
          created_at
        )
      `)
      .eq("subject", subject)
      .eq("chapter", chapter)
      .order("created_at", { ascending: false });

    if (!error && posts) {
      return posts.map((post) => ({
        id: post.id,
        question: post.question,
        subject: post.subject,
        chapter: post.chapter,
        imageUrl: post.image_url,
        author: post.author,
        timestamp: new Date(post.created_at).getTime(),
        views: post.views,
        answers: (post.forum_answers || []).map((a) => ({
          id: a.id,
          questionId: post.id,
          text: a.text,
          author: a.author,
          imageUrl: a.image_url,
          helpful: a.helpful,
          isSelected: a.is_selected,
          timestamp: new Date(a.created_at).getTime(),
        })),
        helpfulCount: post.helpful_count,
      }));
    }
  } catch (err) {
    console.error("Error fetching from Supabase:", err);
  }

  // Fallback to localStorage
  return (await getQuestions(100)).filter(
    (p) => p.subject === subject && p.chapter === chapter
  );
}

/**
 * Post an answer to a question
 * @param {number} questionId - ID of question
 * @param {string} answer - Answer text
 * @param {string} imageUrl - Image URL (optional)
 * @param {string} currentUser - Current user posting the answer
 * @returns {object} Posted answer with ID
 */
export async function postAnswer(questionId, answer, imageUrl = "", currentUser = "Anonymous Student") {
  if (!answer.trim()) return null;

  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from("forum_answers")
      .insert([
        {
          question_id: questionId,
          text: answer.trim(),
          author: currentUser,
          image_url: imageUrl || null,
          helpful: 0,
          is_selected: false,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        text: data.text,
        author: data.author,
        imageUrl: data.image_url,
        timestamp: new Date(data.created_at).getTime(),
        helpful: data.helpful,
        isSelected: data.is_selected,
      };
    }
  } catch (err) {
    console.error("Error posting answer to Supabase:", err);
  }

  // Fallback to localStorage
  const posts = JSON.parse(localStorage.getItem(FORUM_KEY) || "[]");
  const question = posts.find((p) => p.id === questionId);

  if (!question) return null;

  const newAnswer = {
    id: Date.now(),
    text: answer.trim(),
    imageUrl,
    author: currentUser,
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
export async function getAnswers(questionId) {
  try {
    // Try Supabase first
    const { data: answers, error } = await supabase
      .from("forum_answers")
      .select("*")
      .eq("question_id", questionId)
      .order("helpful", { ascending: false });

    if (!error && answers) {
      return answers.map((a) => ({
        id: a.id,
        text: a.text,
        author: a.author,
        imageUrl: a.image_url,
        helpful: a.helpful,
        isSelected: a.is_selected,
        timestamp: new Date(a.created_at).getTime(),
      }));
    }
  } catch (err) {
    console.error("Error fetching answers from Supabase:", err);
  }

  // Fallback to localStorage
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
export async function markHelpful(questionId, answerId) {
  try {
    // Try Supabase first
    const { data: answer, error } = await supabase
      .from("forum_answers")
      .select("helpful")
      .eq("id", answerId)
      .single();

    if (!error && answer) {
      const { error: updateError } = await supabase
        .from("forum_answers")
        .update({ helpful: answer.helpful + 1 })
        .eq("id", answerId);

      if (!updateError) {
        return answer.helpful + 1;
      }
    }
  } catch (err) {
    console.error("Error marking answer as helpful in Supabase:", err);
  }

  // Fallback to localStorage
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
export async function searchQuestions(query) {
  const posts = await getQuestions(100);
  const q = query.toLowerCase();
  return posts.filter(
    (p) =>
      p.question.toLowerCase().includes(q) ||
      (p.subject && p.subject.toLowerCase().includes(q)) ||
      (p.chapter && p.chapter.toLowerCase().includes(q))
  );
}

/**
 * Get trending questions (most viewed/answered)
 * @returns {array} Top 5 questions by activity
 */
export async function getTrendingQuestions() {
  const posts = await getQuestions(100);
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
export async function incrementViews(questionId) {
  try {
    // Try Supabase first
    const { data: question, error } = await supabase
      .from("forum_posts")
      .select("views")
      .eq("id", questionId)
      .single();

    if (!error && question) {
      await supabase
        .from("forum_posts")
        .update({ views: question.views + 1 })
        .eq("id", questionId);
      return;
    }
  } catch (err) {
    console.error("Error incrementing views in Supabase:", err);
  }

  // Fallback to localStorage
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
export async function getForumStats() {
  try {
    // Try Supabase first
    const { data: questions, error: qError } = await supabase
      .from("forum_posts")
      .select("id, views");

    const { data: answers, error: aError } = await supabase
      .from("forum_answers")
      .select("id");

    if (!qError && !aError) {
      const totalViews = (questions || []).reduce((sum, p) => sum + (p.views || 0), 0);
      return {
        totalQuestions: (questions || []).length,
        totalAnswers: (answers || []).length,
        totalViews,
        averageAnswersPerQuestion:
          (questions || []).length > 0
            ? ((answers || []).length / (questions || []).length).toFixed(1)
            : 0,
      };
    }
  } catch (err) {
    console.error("Error fetching stats from Supabase:", err);
  }

  // Fallback to localStorage
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
  console.log("Forum cleared from localStorage");
}

