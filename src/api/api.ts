// src/api/api.ts
import axios from "axios";

/**
 * Use REACT_APP_API_URL if set (preferred).
 * Fallback to REACT_APP_BACKEND_URL for older code or local .env files.
 * Trim trailing slashes so callers can use "/auth/login" consistently.
 */
const raw =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "";

const base = raw ? raw.replace(/\/+$/, "") : "";

const api = axios.create({
  baseURL: base || "/", // if empty (dev with proxy) fall back to "/"
  timeout: 15000,
  withCredentials: true,
});

export default api;
