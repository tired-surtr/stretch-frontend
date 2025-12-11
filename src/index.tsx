import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import api from "./api/api";        // <-- added
import "./global.css";

/* -----------------------------------------------------
   FIX: Always attach token from localStorage on startup
----------------------------------------------------- */
try {
  const existing = localStorage.getItem("token");
  if (existing) {
    api.defaults.headers.common["Authorization"] = `Bearer ${existing}`;
    console.log("Auth token restored at startup");
  } else {
    console.log("No stored token at startup");
  }
} catch (err) {
  console.warn("Could not read token from localStorage:", err);
}
/* ----------------------------------------------------- */

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <AuthProvider>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </AuthProvider>
);
