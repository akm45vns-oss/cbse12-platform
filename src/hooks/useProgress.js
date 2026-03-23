import { useState } from "react";
import { loadProgress, saveProgressItem } from "../utils/supabase";
import { CURRICULUM, totalChapters } from "../constants/curriculum";

export function useProgress() {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const load = async (username) => {
    setCurrentUser(username);
    if (!username) return;
    setIsLoading(true);
    const loadedData = await loadProgress(username);
    setData(loadedData);
    setIsLoading(false);
  };

  const save = async (key, val) => {
    const newData = { ...data, [key]: val };
    setData(newData);
    
    if (!currentUser) return;
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

  const getOverallPercentage = () => {
    const stats = getStats();
    return Math.round((stats.notesRead + stats.quizDone) / (totalChapters * 2) * 100);
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
