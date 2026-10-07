import { useEffect, useState } from 'react';

function readTheme() {
  try {
    return window.localStorage.getItem('reviewsense-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem('reviewsense-theme', theme);
    } catch {
      // Theme still applies for this session if local storage is disabled.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
