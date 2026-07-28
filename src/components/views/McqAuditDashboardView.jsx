import React, { useState, useEffect } from 'react';
import { CURRICULUM, totalChapters } from '../../constants/curriculum';
import { CURRICULUM_11, totalChapters11 } from '../../constants/curriculum11';

// We fetch live checkpoint data from our backend
const fetchLiveProgress = async () => {
  try {
    // Dynamically use localhost in dev, or relative path in production
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const baseUrl = isDev ? "http://localhost:5001" : "";
    const res = await fetch(`${baseUrl}/api/v1/audit/progress`);
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json();
  } catch (err) {
    console.error("Audit dashboard fetch error:", err);
    return null;
  }
};

export const McqAuditDashboardView = () => {
  const [data, setData] = useState(null);
  const [lastData, setLastData] = useState(null);
  const [speedPerMin, setSpeedPerMin] = useState(0);

  useEffect(() => {
    let speedInterval;
    const loadData = async () => {
      const liveData = await fetchLiveProgress();
      if (liveData) {
        setLastData(prev => {
          if (prev) {
            const prevTotal = prev.stats.total_checked + (prev.in_progress?.last_index || 0);
            const currTotal = liveData.stats.total_checked + (liveData.in_progress?.last_index || 0);
            if (prevTotal < currTotal) {
              const diff = currTotal - prevTotal;
              setSpeedPerMin(diff * (60000 / 5000)); // extrapolated to 1 min if polled every 5s
            }
          }
          return liveData;
        });
        setData(liveData);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Loading Audit Matrix...</div>
      </div>
    );
  }

  const { stats, completed_chapters, in_progress, started_at } = data;
  
  // Calculate total questions remaining based on an average of 115 questions per chapter
  const totalGlobalChapters = totalChapters + totalChapters11;
  const chaptersRemaining = totalGlobalChapters - completed_chapters.length;
  const estimatedRemainingQuestions = chaptersRemaining * 115;
  
  let timeRemainingStr = "Calculating...";
  if (speedPerMin > 0) {
    const minsRemaining = estimatedRemainingQuestions / speedPerMin;
    if (minsRemaining > 60 * 24) {
      timeRemainingStr = `${(minsRemaining / (60 * 24)).toFixed(1)} Days`;
    } else if (minsRemaining > 60) {
      timeRemainingStr = `${(minsRemaining / 60).toFixed(1)} Hours`;
    } else {
      timeRemainingStr = `${Math.round(minsRemaining)} Minutes`;
    }
  }

  const getSubjectStatus = (cls, subject, totalSubjectChapters) => {
    const completed = completed_chapters.filter(c => c.startsWith(`${cls}||${subject}||`)).length;
    const isWorking = in_progress?.chapterKey?.startsWith(`${cls}||${subject}||`);
    const pct = Math.round((completed / totalSubjectChapters) * 100);
    return { completed, pct, isWorking };
  };

  const renderSubjectGrid = (cls, curriculumObj) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
      {Object.entries(curriculumObj).map(([subject, info]) => {
        const totalSubjChap = info.units.reduce((acc, u) => acc + u.chapters.length, 0);
        const status = getSubjectStatus(cls, subject, totalSubjChap);
        return (
          <div key={subject} style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden'
          }}>
            {status.isWorking && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#10b981', animation: 'pulse 2s infinite' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 28, background: info.gradient, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                {info.emoji}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{subject}</h3>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{status.completed} / {totalSubjChap} Chapters</span>
              </div>
            </div>
            <div style={{ width: '100%', background: 'rgba(0,0,0,0.3)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${status.pct}%`, background: status.pct === 100 ? '#10b981' : '#3b82f6', height: '100%', transition: 'width 1s' }} />
            </div>
            {status.isWorking && <div style={{ marginTop: 12, fontSize: 12, color: '#10b981', fontWeight: 600 }}>Currently Auditing...</div>}
            {status.pct === 100 && <div style={{ marginTop: 12, fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Verified Complete</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', padding: '40px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              A.I. Audit Matrix
            </h1>
            <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: 16 }}>Live validation feed across all CBSE chapters.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#10b981', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', animation: 'pulse 1.5s infinite' }} />
              LIVE CONNECTION
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Last pulse: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Error Banner */}
        {in_progress?.report?.error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, padding: 20, marginBottom: 20, color: '#fca5a5' }}>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ FATAL API ERROR
            </h3>
            <p style={{ margin: 0 }}>{in_progress.report.error}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#f87171' }}>The audit has safely halted. Progress is saved.</p>
          </div>
        )}

        {/* Global Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
          <StatBox title="Total Questions Checked" value={(stats.total_checked + (in_progress?.last_index || 0)).toLocaleString()} color="#3b82f6" />
          <StatBox title="Corrections & Fixes" value={(stats.explanation_fixed + stats.regenerated + (in_progress?.report?.explanation_fixed || 0) + (in_progress?.report?.regenerated || 0)).toLocaleString()} color="#f59e0b" />
          <StatBox title="Chapters Mastered" value={`${completed_chapters.length} / ${totalGlobalChapters}`} color="#10b981" />
          <StatBox title="Est. Time Remaining" value={timeRemainingStr} color="#8b5cf6" sub={`${speedPerMin > 0 ? Math.round(speedPerMin) : '~'} Q/min`} />
        </div>

        {/* Global Syllabus Progress Bar */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 16 }}>Overall Syllabus Completion</div>
            <div style={{ color: '#10b981', fontWeight: 900, fontSize: 20 }}>{((completed_chapters.length / totalGlobalChapters) * 100).toFixed(1)}%</div>
          </div>
          <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', height: 16, borderRadius: 8, overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
            <div style={{ width: `${(completed_chapters.length / totalGlobalChapters) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #38bdf8, #10b981)', height: '100%', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
          </div>
        </div>

        {/* In Progress Banner */}
        {in_progress && (
          <div style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))', border: '1px solid rgba(59,130,246,0.2)', padding: 24, borderRadius: 20, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Currently Auditing</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>{in_progress.chapterKey.replace(/\|\|/g, ' ➔ ')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#38bdf8' }}>Q{in_progress.last_index}</div>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 24, fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 24 }}>Class 12 Progress</h2>
        {renderSubjectGrid("12", CURRICULUM)}

        <h2 style={{ fontSize: 24, fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginTop: 48, marginBottom: 24 }}>Class 11 Progress</h2>
        {renderSubjectGrid("11", CURRICULUM_11)}

      </div>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

const StatBox = ({ title, value, color, sub }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: 20 }}>
    <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color, marginTop: 8 }}>{value}</div>
    {sub && <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
  </div>
);
