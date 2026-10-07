import { useEffect, useState } from 'react';

const STORAGE_KEY = 'reviewsense-analysis-history-v1';
const MAX_HISTORY = 12;

function readHistory() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item) => item && typeof item.review === 'string' && item.timestamp)
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function useReviewHistory() {
  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage can be unavailable in private browsing; current-session history still works.
    }
  }, [history]);

  const addEntry = (entry) => {
    setHistory((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, MAX_HISTORY));
  };

  const clearHistory = () => setHistory([]);

  return { history, addEntry, clearHistory };
}
