import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchSessions, type Session } from "../api/sessions";

type Role = "USER" | "ADMIN";

type AppContextValue = {
  sessions: Session[];
  loading: boolean;
  role: Role;
  setRole: (role: Role) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("USER");

  useEffect(() => {
    fetchSessions()
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading sessions:", err);
        setLoading(false);
      });
  }, []);

  return (
    <AppContext.Provider value={{ sessions, loading, role, setRole }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
