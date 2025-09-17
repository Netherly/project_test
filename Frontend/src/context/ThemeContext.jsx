import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [backgroundImage, setBackgroundImage] = useState(localStorage.getItem("backgroundImage") || "");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (backgroundImage) {
      document.body.style.backgroundImage = `url(${backgroundImage})`;
      document.body.style.backgroundColor = "transparent"; 
    } else {
      document.body.style.backgroundImage = "none"; 
      document.body.style.backgroundColor = "var(--bg-color)"; 
    }
    localStorage.setItem("backgroundImage", backgroundImage);
  }, [backgroundImage]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, backgroundImage, setBackgroundImage }}>
      {children}
    </ThemeContext.Provider>
  );
};