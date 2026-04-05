import React, { useState, useEffect } from 'react';
import { CURRICULUM } from '../../constants/curriculum';
import { getLeaderboardData, getUserRank, getChapterLeaderboards } from '../../utils/leaderboard';
import { useAuth } from '../../hooks';
import '../../styles/LeaderboardView.css';

export default function LeaderboardView() {
  const { currentUser: username } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState(Object.keys(CURRICULUM)[0] || '');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('subject'); // 'subject' or 'chapter'

  // Get chapters for selected subject
  useEffect(() => {
    const subjectData = CURRICULUM[selectedSubject];
    if (subjectData && subjectData.units) {
      const allChapters = subjectData.units.flatMap(unit => unit.chapters);
      setChapters(allChapters);
      setSelectedChapter(null); // Reset chapter selection when subject changes
    }
  }, [selectedSubject]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        if (viewType === 'chapter' && selectedChapter) {
          // Get leaderboard for specific chapter
          const data = await getLeaderboardData(selectedSubject, selectedChapter, 25);
          setLeaderboard(data);

          // Get user's rank for this chapter
          if (username) {
            const rank = await getUserRank(username, selectedSubject, selectedChapter);
            setUserRank(rank);
          }
        } else {
          // Get leaderboard for entire subject
          const data = await getLeaderboardData(selectedSubject, null, 25);
          setLeaderboard(data);

          // Get user's rank for this subject
          if (username) {
            const rank = await getUserRank(username, selectedSubject, null);
            setUserRank(rank);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
        setUserRank(null);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSubject) {
      fetchLeaderboard();
    }
  }, [selectedSubject, selectedChapter, viewType, username]);

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(selectedChapter === chapter ? null : chapter);
  };

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}.`;
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>📊 Leaderboard</h1>
        <p className="subtitle">Compete with learners across India</p>
      </div>

      {/* View Type Selector */}
      <div className="leaderboard-tabs">
        <button
          className={`tab-button ${viewType === 'subject' ? 'active' : ''}`}
          onClick={() => setViewType('subject')}
        >
          Subject-wise
        </button>
        <button
          className={`tab-button ${viewType === 'chapter' ? 'active' : ''}`}
          onClick={() => setViewType('chapter')}
        >
          Chapter-wise
        </button>
      </div>

      {/* Subject Selector */}
      <div className="leaderboard-selector">
        <label htmlFor="subject-select">Subject:</label>
        <select
          id="subject-select"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="subject-select"
        >
          {Object.keys(CURRICULUM).map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Chapter Selector (visible only in chapter-wise view) */}
      {viewType === 'chapter' && chapters.length > 0 && (
        <div className="chapter-selector">
          <p className="chapter-label">Select Chapter:</p>
          <div className="chapters-grid">
            {chapters.map((chapter, index) => (
              <button
                key={index}
                className={`chapter-button ${
                  selectedChapter === chapter ? 'active' : ''
                }`}
                onClick={() => handleChapterSelect(chapter)}
              >
                {chapter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User's Current Rank Card */}
      {username && userRank && (
        <div className="user-rank-card">
          <div className="rank-badge">#{userRank.rank}</div>
          <div className="rank-info">
            <div className="rank-username">{userRank.name}</div>
            <div className="rank-score">{userRank.avgPercentage}%</div>
            <div className="rank-meta">
              {viewType === 'chapter' && selectedChapter
                ? `Rank in ${selectedChapter}`
                : `Rank in ${selectedSubject}`}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>No quiz submissions yet for this {viewType === 'chapter' ? 'chapter' : 'subject'}.</p>
            <p className="empty-hint">Complete some quizzes to appear on the leaderboard!</p>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col">Rank</th>
                <th className="username-col">Name</th>
                <th className="score-col">Average %</th>
                <th className="best-col">Best Score</th>
                <th className="attempts-col">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.username}
                  className={`leaderboard-row ${
                    entry.username === username ? 'current-user' : ''
                  }`}
                >
                  <td className="rank-col medal">{getMedalIcon(entry.rank)}</td>
                  <td className="username-col">
                    <span className="username-badge">{entry.name}</span>
                    {entry.username === username && (
                      <span className="you-badge">YOU</span>
                    )}
                  </td>
                  <td className="score-col">
                    <span className="percentage">{entry.avgPercentage}%</span>
                  </td>
                  <td className="best-col">{entry.bestScore}</td>
                  <td className="attempts-col">{entry.totalAttempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Summary */}
      {leaderboard.length > 0 && (
        <div className="leaderboard-stats">
          <div className="stat-card">
            <div className="stat-label">Top Score</div>
            <div className="stat-value">{leaderboard[0]?.avgPercentage}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Competitors</div>
            <div className="stat-value">{leaderboard.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Your Position</div>
            <div className="stat-value">
              {userRank ? `#${userRank.rank}/${userRank.totalUsers}` : 'Not Ranked'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
