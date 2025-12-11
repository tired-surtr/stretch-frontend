// src/components/AdminPage.tsx
import React, { useState } from "react";
import api from "../api/api"; // <-- use api instance (not axios)

import { useAuth } from "../context/AuthContext";

/**
 * AdminPage – allows admin users to create sessions.
 * Matches backend:
 * POST /api/sessions expects:
 *   { title, description, session_date, start_time, duration_minutes, capacity }
 */

export default function AdminPage() {
  const { user, token } = useAuth();

  // Accept role values in any case, backend stores e.g. 'ADMIN' or 'USER'
  const isAdmin = (user?.role || "").toString().toUpperCase() === "ADMIN";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [capacity, setCapacity] = useState<number>(20);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 720, margin: "32px auto", padding: 18 }}>
        <h2>Admin</h2>
        <p>
          You must be signed in as an <strong>admin</strong> to access this page.
        </p>

        <p>
          Your account:{" "}
          {user ? `${user.name || user.email} (${user.role ?? "USER"})` : "Not signed in"}
        </p>
      </div>
    );
  }

  const submitSession = async () => {
    setLoading(true);
    setErr(null);
    setMsg(null);

    // Basic client-side validation
    if (!title || !sessionDate || !startTime || !capacity) {
      setErr("Title, date, time and capacity are required.");
      setLoading(false);
      return;
    }

    try {
      // Use field names the server expects
      const payload = {
        title,
        description: description || null,
        session_date: sessionDate,
        start_time: startTime,
        duration_minutes: durationMinutes,
        capacity,
      };

      // Use api instance which already has baseURL and Authorization header
      await api.post("/sessions", payload);

      setMsg("Session created successfully!");
      setTitle("");
      setDescription("");
      setSessionDate("");
      setStartTime("");
      setDurationMinutes(60);
      setCapacity(20);
    } catch (e: any) {
      setErr(e.response?.data?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "32px auto", padding: 16 }}>
      <h2>Create New Session</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: 8 }}
          placeholder="Session title"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: 8, minHeight: 80 }}
          placeholder="Session description"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Duration (minutes)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            style={{ width: "100%", padding: 8 }}
            min={1}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Capacity</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            style={{ width: "100%", padding: 8 }}
            min={1}
          />
        </div>
      </div>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      <button onClick={submitSession} disabled={loading} style={{ padding: "8px 14px", borderRadius: 6 }}>
        {loading ? "Creating..." : "Create Session"}
      </button>
    </div>
  );
}
