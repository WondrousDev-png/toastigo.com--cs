import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Change this to 'false' to start in normal mode by default
  const [isValentine, setIsValentine] = useState(true);

  const toggleTheme = () => setIsValentine(!isValentine);

  return (
    <ThemeContext.Provider value={{ isValentine, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);