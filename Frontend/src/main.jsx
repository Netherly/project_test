import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { FieldsProvider } from "./context/FieldsContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <FieldsProvider>
        <App />
      </FieldsProvider>
    </ThemeProvider>
  </BrowserRouter>
);
