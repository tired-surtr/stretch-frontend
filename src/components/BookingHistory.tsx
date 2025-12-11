import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * BookingHistory.tsx
 * - Fetches bookings for the current user (GET /api/bookings)
 * - Sends Authorization: Bearer <token>
 * - Shows each booking with session info
 * - If the session is in the past, draws a line-through on that row
 */

type Booking = {
  id: number;
  session_id: number;
  seat_number: number;
  status: string;
  created_at: string;
  updated_at?: string;
  session?: {
    id: number;
    title: string;
    session_date: string;
    start_time: string;
  };
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const token = localStorage.getItem("APP_TOKEN");
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL ?? ""}/api/bookings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!mounted) return;

        if (res.status === 401) {
          setError("You must be signed in to view bookings.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch bookings");
        }

        const data: Booking[] = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        if (mounted) setError("Failed to load bookings.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Loading your bookings...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!bookings || bookings.length === 0)
    return (
      <div>
        <h2>Your bookings</h2>
        <p>No bookings found.</p>
        <p>
          <Link to="/">Browse sessions</Link>
        </p>
      </div>
    );

  const now = new Date();

  return (
    <div>
      <h2>Your bookings</h2>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {bookings.map((b) => {
          const session = b.session;
          const sessionDate = session ? new Date(`${session.session_date}T${session.start_time}`) : null;
          const isPast = sessionDate ? sessionDate.getTime() < now.getTime() : false;

          return (
            <li
              key={b.id}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.06)",
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: isPast ? 0.8 : 1,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    textDecoration: isPast ? "line-through" : "none",
                    color: isPast ? "#666" : "#000",
                  }}
                >
                  {session ? session.title : `Session #${b.session_id}`}
                </div>

                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                  {session && (
                    <>
                      {new Date(session.session_date).toDateString()} at {session.start_time} —{" "}
                    </>
                  )}
                  Seat: {b.seat_number} • Status: {b.status}
                </div>

                <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                  Booked on: {new Date(b.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ marginLeft: 12, textAlign: "right" }}>
                {isPast ? (
                  <div style={{ fontSize: 12, color: "#999" }}>Completed</div>
                ) : (
                  <div>
                    <Link to={`/booking/${b.session_id}`} style={{ marginRight: 8 }}>
                      View session
                    </Link>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
