// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/api"; // <-- correct api instance

/**
 * User interface (matches your backend user structure)
 */
interface User {
  id: number;
  name?: string | null;
  email: string;
  role?: string | null;
  profile_pic_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  signup: (data: { name?: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const defaultValue: AuthContextType = {
  user: null,
  token: null,
  signup: async () => {},
  login: async () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });

  /**
   * Keep API Authorization header and localStorage synced
   */
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  /**
   * SIGNUP
   * Calls /auth/register (NOT /api/auth/register because api baseURL already includes /api)
   */
  const signup = async (data: { name?: string; email: string; password: string }) => {
    const res = await api.post<{ ok: boolean; user: User }>(
      "/auth/register",
      data,
      { withCredentials: true }
    );

    if (res.data?.user) {
      // log them in immediately
      await login({ email: data.email, password: data.password });
      return;
    }

    throw new Error("Registration failed");
  };

  /**
   * LOGIN
   * Calls /auth/login
   * Backend returns: { token, user }
   */
  const login = async (data: { email: string; password: string }) => {
    const res = await api.post<{ token?: string; user: User }>(
      "/auth/login",
      data,
      { withCredentials: true }
    );

    if (res.data?.token) {
      setToken(res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    } else {
      setToken(null);
      delete api.defaults.headers.common["Authorization"];
    }

    if (res.data?.user) {
      setUser(res.data.user);
    } else {
      setUser(null);
    }
  };

  /**
   * LOGOUT
   */
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => useContext(AuthContext);
