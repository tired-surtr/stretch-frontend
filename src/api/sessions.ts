const API_BASE = process.env.REACT_APP_BACKEND_URL!;

export type Session = {
  id: number;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  capacity: number;
  created_at: string;
};

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/api/sessions`);
  if (!res.ok) {
    throw new Error("Failed to fetch sessions");
  }
  return res.json();
}

export async function fetchSessionById(id: number): Promise<Session & { bookedSeats: number[] }> {
  const res = await fetch(`${API_BASE}/api/sessions/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch session");
  }
  return res.json();
}

export type CreateSessionPayload = {
  title: string;
  description?: string;
  session_date: string; // "2025-12-11"
  start_time: string;   // "18:00"
  duration_minutes: number;
  capacity: number;
};

export async function createSession(payload: CreateSessionPayload) {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create session");
  }

  return res.json();
}
