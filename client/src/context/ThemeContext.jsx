import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Options: 'light', 'dark', 'system' (System is now "Dim/Hybrid")
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mxshare-theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Reset classes
    root.classList.remove('light', 'dark', 'dim');
    root.removeAttribute('data-theme');

    if (theme === 'system') {
      // "System" is now our "Dim" mode (Between Light and Dark)
      // We add 'dark' class so text turns white (utilizing Tailwind's dark:text-white)
      // We add 'dim' class to handle specific background overrides
      root.classList.add('dark', 'dim');
      root.setAttribute('data-theme', 'dim');
    } else {
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
    }

    localStorage.setItem('mxshare-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);