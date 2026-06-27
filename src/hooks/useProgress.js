import { useState, useCallback } from "react";
import { loadProgress, saveProgressItem } from "../utils/supabase";
import { CURRICULUM, totalChapters } from "../constants/curriculum";

export function useProgress() {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const load = useCallback(async (username) => {
    setCurrentUser(username);
    if (!username) return;
    setIsLoading(true);
    const loadedData = await loadProgress(username);
    setData(loadedData);
    setIsLoading(false);
  }, []);

  const save = useCallback(async (key, val) => {
    setData(prev => {
      const newData = { ...prev, [key]: val };
      if (currentUser) {
        const [subject, chapter, type] = key.split("||");
        saveProgressItem(currentUser, subject, chapter, type, val);
      }
      return newData;
    });
  }, [currentUser]);

  const getStats = (curriculumOverride) => {
    const activeCurriculum = curriculumOverride || CURRICULUM;
    let notesRead = 0, quizDone = 0;
    const bySubject = {};

    Object.entries(activeCurriculum).forEach(([s, d]) => {
      let sN = 0, sQ = 0, sT = 0;
      d.units.forEach(u =>
        u.chapters.forEach(ch => {
          sT++;
          if (data[`${s}||${ch}||notes`]?.read) {
            notesRead++;
            sN++;
          }
          if ((data[`${s}||${ch}||quiz`]?.attempts?.length || 0) > 0) {
            quizDone++;
            sQ++;
          }
        })
      );
      bySubject[s] = { n: sN, q: sQ, t: sT };
    });

    return { notesRead, quizDone, bySubject };
  };

  const getOverallPercentage = (curriculumOverride, totalOverride) => {
    const total = totalOverride || totalChapters;
    const stats = getStats(curriculumOverride);
    return Math.round((stats.notesRead + stats.quizDone) / (total * 2) * 100);
  };

  return {
    data,
    load,
    save,
    getStats,
    getOverallPercentage,
    isLoading,
  };
}
