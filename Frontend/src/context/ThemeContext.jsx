import React, { createContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const [theme, setThemeState] = useState(localStorage.getItem("theme") || "dark");
  const [backgroundImage, setBackgroundImage] = useState(
    localStorage.getItem("backgroundImage") || "/gsse-cover.png"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (location.pathname === "/") {
      document.body.style.backgroundImage = `url(/gsse-cover.png)`;
      document.body.style.backgroundColor = "transparent";
      return;
    }

    
    if (backgroundImage && backgroundImage !== "null") {
      document.body.style.backgroundImage = `url(${backgroundImage})`;
    } else {
      document.body.style.backgroundImage = `url(/gsse-cover.png)`;
    }
    document.body.style.backgroundColor = "transparent";

    if (backgroundImage) {
        localStorage.setItem("backgroundImage", backgroundImage);
    }
  }, [backgroundImage, location.pathname]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, backgroundImage, setBackgroundImage }}>
      {children}
    </ThemeContext.Provider>
  );
};
