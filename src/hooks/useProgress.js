import { useState, useEffect } from "react";
import { loadProgress, saveProgressItem } from "../utils/supabase";
import { CURRICULUM, totalChapters } from "../constants/curriculum";

export function useProgress(currentUser) {
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserProgress();
    }
  }, [currentUser]);

  const loadUserProgress = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const data = await loadProgress(currentUser);
    setProgress(data);
    setIsLoading(false);
  };

  const saveProgress = async (key, val) => {
    const newProgress = { ...progress, [key]: val };
    setProgress(newProgress);
    
    const [subject, chapter, type] = key.split("||");
    await saveProgressItem(currentUser, subject, chapter, type, val);
  };

  const getStats = () => {
    let notesRead = 0, quizDone = 0;
    const bySubject = {};

    Object.entries(CURRICULUM).forEach(([s, d]) => {
      let sN = 0, sQ = 0, sT = 0;
      d.units.forEach(u =>
        u.chapters.forEach(ch => {
          sT++;
          if (progress[`${s}||${ch}||notes`]?.read) {
            notesRead++;
            sN++;
          }
          if ((progress[`${s}||${ch}||quiz`]?.attempts?.length || 0) > 0) {
            quizDone++;
            sQ++;
          }
        })
      );
      bySubject[s] = { n: sN, q: sQ, t: sT };
    });

    return { notesRead, quizDone, bySubject };
  };

  const stats = getStats();

  return {
    progress,
    setProgress,
    saveProgress,
    stats,
    isLoading,
    overallPct: Math.round((stats.notesRead + stats.quizDone) / (totalChapters * 2) * 100),
  };
}
