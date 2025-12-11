// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:5000";

/**
 * AuthContext aligned to your backend:
 * - POST /api/auth/register  => { ok: true, user }
 * - POST /api/auth/login     => { token, user }
 *
 * User fields follow your DB schema: id, name, email, role, (optional) profile_pic_url
 */

interface User {
  id: number;
  name?: string | null;
  email: string;
  role?: string | null; // e.g. 'USER' or 'ADMIN'
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

  // keep axios auth header and localStorage in sync
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
        localStorage.setItem("token", token);
      } catch {}
    } else {
      delete axios.defaults.headers.common["Authorization"];
      try {
        localStorage.removeItem("token");
      } catch {}
    }

    if (user) {
      try {
        localStorage.setItem("user", JSON.stringify(user));
      } catch {}
    } else {
      try {
        localStorage.removeItem("user");
      } catch {}
    }
  }, [token, user]);

  /**
   * Register -> backend returns { ok: true, user }
   * We then call login() to get token and set user/token in context.
   */
  const signup = async (data: { name?: string; email: string; password: string }) => {
    // call register
    const res = await axios.post<{ ok: boolean; user: User }>("/api/auth/register", data);
    // if backend returned user but not token, sign them in automatically
    if (res.data?.user) {
      // call login to get token
      await login({ email: data.email, password: data.password });
      return;
    }
    throw new Error("Registration failed");
  };

  /**
   * Login -> backend returns { token, user }
   */
  const login = async (data: { email: string; password: string }) => {
    const res = await axios.post<{ token: string; user: User }>("/api/auth/login", data);
    setToken(res.data.token);
    setUser(res.data.user);
  };

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

// Convenience hook for components that previously imported `useAuth`
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
