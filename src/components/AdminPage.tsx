import React, { useState } from "react";
import { createSession } from "../api/sessions";
import { Link } from "react-router-dom";

function AdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [capacity, setCapacity] = useState(6);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createSession({
        title,
        description,
        session_date: sessionDate,
        start_time: startTime,
        duration_minutes: duration,
        capacity,
      });

      setMessage("Session created successfully!");
      setTitle("");
      setDescription("");
      setSessionDate("");
      setStartTime("");
      setDuration(30);
      setCapacity(6);

    } catch (err) {
      setMessage("Failed to create session.");
    }
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Create a new physio session</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxWidth: "300px", gap: "10px" }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          required
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <label>Date:</label>
        <input
          type="date"
          value={sessionDate}
          required
          onChange={(e) => setSessionDate(e.target.value)}
        />

        <label>Start Time:</label>
        <input
          type="time"
          value={startTime}
          required
          onChange={(e) => setStartTime(e.target.value)}
        />

        <label>Duration (minutes):</label>
        <input
          type="number"
          value={duration}
          required
          onChange={(e) => setDuration(Number(e.target.value))}
        />

        <label>Capacity:</label>
        <input
          type="number"
          value={capacity}
          required
          onChange={(e) => setCapacity(Number(e.target.value))}
        />

        <button type="submit">Create Session</button>
      </form>

      {message && <p>{message}</p>}

      <div style={{ marginTop: "20px" }}>
        <Link to="/">Back to sessions</Link>
      </div>
    </div>
  );
}

export default AdminPage;
