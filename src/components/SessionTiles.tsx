// src/components/SessionTiles.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

import { useAppContext } from "../context/AppContext";

/**
 * SessionTiles — robust isSessionOver + disabled past sessions
 */

type SessionSummary = {
  id: number | string;
  title?: string;
  session_date?: string;
  start_time?: string;
  duration_minutes?: number | string;
  capacity?: number | string;
  bookedSeats?: number[] | string[] | number;
  booked_count?: number;
  bookings?: any[];
  end_time?: string;
  end_timestamp?: number | string;
  [k: string]: any;
};

type SessionDetail = {
  id: number;
  capacity?: number | string;
  bookedSeats?: number[] | string[] | number;
  booked_count?: number;
  bookedCount?: number;
  bookings?: any[];
  duration_minutes?: number | string;
  end_time?: string;
  end_timestamp?: number | string;
  [k: string]: any;
};

function tryParseTimestamp(value: any): Date | null {
  if (value == null) return null;
  if (typeof value === "number") {
    if (value > 1e12) return new Date(value);
    if (value > 1e11) return new Date(value);
    if (value > 1e9) return new Date(value * 1000);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^-?\d+$/.test(trimmed)) {
      try {
        const n = Number(trimmed);
        if (n > 1e12) return new Date(n);
        if (n > 1e11) return new Date(n);
        if (n > 1e9) return new Date(n * 1000);
      } catch {}
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

function parseYMD(dateStr: string): { year: number; month: number; day: number } | null {
  const m = String(dateStr).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function parseTimeHM(t: string): { hour: number; minute: number; second: number } | null {
  const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]), second: Number(m[3] ?? "0") };
}

function isSessionOver(s: any): boolean {
  if (!s) return false;

  // 1) if explicit end timestamp present, parse and compare
  if (s.end_timestamp != null) {
    const endTry = tryParseTimestamp(s.end_timestamp);
    if (endTry) return Date.now() > endTry.getTime();
  }
  // 2) if explicit end_time field (like "18:00:00") plus date, try parse ISO-ish
  if (s.end_time && s.session_date) {
    const tryEnd = tryParseTimestamp(`${String(s.session_date)}T${String(s.end_time)}`);
    if (tryEnd) return Date.now() > tryEnd.getTime();
  }

  // 3) parse start date/time
  const dateRaw = s.session_date ?? "";
  const timeRaw = s.start_time ?? "";
  const durationMin = Number(s.duration_minutes ?? s.duration ?? 60) || 60;

  // if start is a timestamp-like field e.g. s.start_timestamp or s.start
  if (s.start_timestamp) {
    const startTry = tryParseTimestamp(s.start_timestamp);
    if (startTry) {
      const end = new Date(startTry.getTime() + durationMin * 60 * 1000);
      return Date.now() > end.getTime();
    }
  }

  // try if dateRaw itself is a full datetime (ISO or human readable)
  const fullAttempt = tryParseTimestamp(String(dateRaw).trim());
  if (fullAttempt && timeRaw) {
    const ymd = parseYMD(String(dateRaw).trim());
    const tm = parseTimeHM(String(timeRaw).trim());
    if (ymd) {
      const hh = tm ? tm.hour : 0;
      const mm = tm ? tm.minute : 0;
      const ss = tm ? tm.second : 0;
      const startDate = new Date(ymd.year, ymd.month - 1, ymd.day, hh, mm, ss);
      if (!Number.isNaN(startDate.getTime())) {
        const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
        return Date.now() > endDate.getTime();
      }
    } else {
      const end = new Date(fullAttempt.getTime() + durationMin * 60 * 1000);
      return Date.now() > end.getTime();
    }
  }

  // If we have YMD (YYYY-MM-DD), construct local start time using start_time if present,
  // otherwise assume session ends at the end of that day
  const ymd = parseYMD(String(dateRaw).trim());
  const tm = parseTimeHM(String(timeRaw).trim());

  if (ymd) {
    if (tm) {
      const start = new Date(ymd.year, ymd.month - 1, ymd.day, tm.hour, tm.minute, tm.second);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start.getTime() + durationMin * 60 * 1000);
        return Date.now() > end.getTime();
      }
    } else {
      const endOfDay = new Date(ymd.year, ymd.month - 1, ymd.day, 23, 59, 59);
      return Date.now() > endOfDay.getTime();
    }
  }

  // if dateRaw wasn't YYYY-MM-DD, try to parse combined "date + time" string
  if (String(dateRaw || "").trim() || String(timeRaw || "").trim()) {
    const combined = (String(dateRaw) + (timeRaw ? " " + String(timeRaw) : "")).trim();
    const parsed = tryParseTimestamp(combined);
    if (parsed) {
      const end = new Date(parsed.getTime() + durationMin * 60 * 1000);
      return Date.now() > end.getTime();
    }
  }

  const parsedDateOnly = tryParseTimestamp(String(dateRaw));
  if (parsedDateOnly) {
    const maybeYmd = parseYMD(String(dateRaw).trim());
    if (maybeYmd) {
      const endOfDay = new Date(maybeYmd.year, maybeYmd.month - 1, maybeYmd.day, 23, 59, 59);
      return Date.now() > endOfDay.getTime();
    }
    const end = new Date(parsedDateOnly.getTime() + durationMin * 60 * 1000);
    return Date.now() > end.getTime();
  }

  return false;
}

function deriveBookedCount(s: SessionDetail | SessionSummary | null | undefined): number {
  if (!s) return 0;
  if (Array.isArray((s as any).bookedSeats)) return (s as any).bookedSeats.length;
  if (Array.isArray((s as any).bookings)) return (s as any).bookings.length;
  if (typeof (s as any).booked_count === "number") return (s as any).booked_count;
  if (typeof (s as any).bookedCount === "number") return (s as any).bookedCount;
  if (typeof (s as any).bookedSeats === "number") return (s as any).bookedSeats;
  if (typeof (s as any).seatsTaken === "number") return (s as any).seatsTaken;
  if (typeof (s as any).attendees === "number") return (s as any).attendees;
  if (typeof (s as any).bookedSeats === "string" && (s as any).bookedSeats.trim() !== "") {
    const n = Number((s as any).bookedSeats);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

export default function SessionTiles(): React.ReactElement {
  const ctx = useAppContext() as { sessions?: SessionSummary[] | undefined } | undefined;
  const sessions = ctx?.sessions;

  const [remainingById, setRemainingById] = useState<Record<number, number | null>>({});

  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      setRemainingById({});
      return;
    }

    const sessionsSnapshot = sessions.slice();
    let cancelled = false;

    async function fetchAllDetails() {
      const ids = sessionsSnapshot
        .map((s) => {
          const idNum = Number(s.id);
          return Number.isNaN(idNum) ? null : idNum;
        })
        .filter((n): n is number => n !== null);

      if (ids.length === 0) return;

      const init: Record<number, number | null> = {};
      ids.forEach((id) => (init[id] = null));
      setRemainingById((prev) => ({ ...prev, ...init }));

      try {
        // <-- USE shared `api` instance here (was axios.get before)
        const promises = ids.map((id) => api.get<SessionDetail>(`/sessions/${id}`));
        const results = await Promise.allSettled(promises);

        const newMap: Record<number, number | null> = {};

        results.forEach((res, idx) => {
          const id = ids[idx];
          if (res.status === "fulfilled") {
            const detail = res.value.data as SessionDetail;
            const capacity = Number(detail.capacity ?? 0) || 0;
            const booked = deriveBookedCount(detail);
            newMap[id] = Math.max(0, capacity - booked);
          } else {
            const summary = sessionsSnapshot.find((x) => Number(x.id) === id) ?? null;
            const cap = Number(summary?.capacity ?? 0) || 0;
            const bookedFromSummary = deriveBookedCount(summary);
            newMap[id] = Math.max(0, cap - bookedFromSummary);
          }
        });

        if (!cancelled) setRemainingById((prev) => ({ ...prev, ...newMap }));
      } catch (err) {
        if (!cancelled) {
          const fallback: Record<number, number | null> = {};
          sessionsSnapshot.forEach((s) => {
            const id = Number(s.id);
            if (!Number.isNaN(id)) {
              const cap = Number(s.capacity ?? 0) || 0;
              const booked = deriveBookedCount(s);
              fallback[id] = Math.max(0, cap - booked);
            }
          });
          setRemainingById((prev) => ({ ...prev, ...fallback }));
        }
      }
    }

    fetchAllDetails();
    return () => {
      cancelled = true;
    };
  }, [sessions]);

  if (!sessions || sessions.length === 0) {
    return <p>No sessions found.</p>;
  }

  return (
    <div className="session-tiles-wrap">
      <div className="session-grid">
        {sessions.map((s) => {
          const id = Number(s.id);
          const remaining =
            !Number.isNaN(id) && Object.prototype.hasOwnProperty.call(remainingById, id)
              ? remainingById[id]
              : null;
          const pillClass = remaining === 0 ? "seats-pill zero" : "seats-pill";
          const title = s.title ?? "Untitled session";
          const sessionDate = s.session_date ?? "";
          const startTime = s.start_time ?? "";
          const over = isSessionOver(s);

          // For past sessions: render non-clickable, dimmed tile.
          // For future/active sessions: render regular link + interactive tile.
          if (over) {
            return (
              <div key={String(s.id)} className="session-link past" aria-hidden>
                <div
                  className="session-tile-glass past"
                  role="group"
                  aria-disabled="true"
                  tabIndex={-1}
                  title={`${title} — session over`}
                >
                  <div className="session-tile-content">
                        <div
                          className="session-title"
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "var(--accent-dark, #5e3be0)",
                            textDecoration: "line-through",
                            opacity: 0.9,
                          }}
                        >
                          {title}
                        </div>

                    <div className="session-sub" style={{ opacity: 0.85 }}>
                      {sessionDate ? new Date(sessionDate).toDateString() : ""}{" "}
                      {startTime ? `• ${startTime}` : ""}
                    </div>
                  </div>

                  <div className={pillClass} aria-hidden>
                    <div className="seats-count">{remaining === null ? "—" : remaining}</div>
                    <div className="seats-label">{remaining === 0 ? "full" : "left"}</div>
                  </div>
                </div>
              </div>
            );
          }

          // active / clickable session
          return (
            <Link
              key={String(s.id)}
              to={`/booking/${id}`}
              aria-label={`Open booking for ${title}`}
              className="session-link"
            >
              <div className="session-tile-glass" role="button" tabIndex={0}>
                <div className="session-tile-content">
                  <div
                    className="session-title"
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--accent-dark, #5e3be0)",
                      textDecoration: "none",
                      opacity: 1,
                    }}
                  >
                    {title}
                  </div>

                  <div className="session-sub">
                    {sessionDate ? new Date(sessionDate).toDateString() : ""}{" "}
                    {startTime ? `• ${startTime}` : ""}
                  </div>
                </div>

                <div className={pillClass} aria-hidden>
                  <div className="seats-count">{remaining === null ? "—" : remaining}</div>
                  <div className="seats-label">{remaining === 0 ? "full" : "left"}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .session-tiles-wrap { width: 100%; display: flex; justify-content: center; }
        .session-grid { width: 100%; max-width: 960px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; padding: 6px 0; }
        .session-link { text-decoration: none; display: block; width: 100%; }

        /* base glass tile */
        .session-tile-glass { height: 96px; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; position: relative; overflow: hidden; cursor: pointer; background: linear-gradient(135deg, rgba(255,255,255,0.72), rgba(245,248,255,0.58)); border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 5px 0 rgba(200,200,200,0.5), 0 14px 30px rgba(0,0,0,0.08); backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px); transition: transform 260ms cubic-bezier(.2,.9,.2,1), box-shadow 260ms, border-color 260ms; }
        .session-tile-glass::before { content: ""; position: absolute; top: -40%; left: -20%; width: 80%; height: 180%; background: linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1)); opacity: 0.5; transform: rotate(-18deg); filter: blur(16px); pointer-events: none; }
        .session-tile-glass::after { content: ""; position: absolute; left: 8%; right: 8%; bottom: -6%; height: 20%; border-radius: 8px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.07)); opacity: 0.9; pointer-events: none; }
        .session-tile-glass:hover, .session-link:focus .session-tile-glass, .session-tile-glass:focus { transform: translateY(-8px) scale(1.01); box-shadow: 0 28px 56px rgba(0, 0, 0, 0.12), 0 10px 0 rgba(220,220,220,0.45); border-color: rgba(0, 0, 0, 0.1); outline: none; }
        .session-tile-glass:hover::before { opacity: 0.7; transform: rotate(-16deg) translateY(-6px); }

        .session-tile-content { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 6px; width: calc(100% - 110px); padding-right: 12px; }
        .session-title { /* kept for legacy selectors */ }
        .session-sub { font-size: 13px; color: var(--accent-dark, #5e3be0); opacity: 0.8; font-weight: 500; }
        .seats-pill { width: 88px; min-width: 88px; height: 64px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(139,110,247,0.14), rgba(139,110,247,0.08)); border: 1px solid rgba(139,110,247,0.12); box-shadow: 0 6px 16px rgba(94,59,224,0.06); color: var(--accent-dark, #5e3be0); font-weight: 700; }
        .seats-count { font-size: 20px; line-height: 1; font-weight: 800; color: var(--accent-dark, #5e3be0); }
        .seats-label { font-size: 12px; opacity: 0.9; color: var(--accent-dark, #5e3be0); margin-top: 2px; font-weight: 600; text-transform: lowercase; }
        .seats-pill.zero { background: linear-gradient(180deg, rgba(255,230,230,0.95), rgba(255,220,220,0.95)); border: 1px solid rgba(220,80,80,0.9); color: #c62828; box-shadow: 0 6px 16px rgba(198,48,48,0.06); }

        /* ---- PAST / disabled session styles ---- */
        .session-link.past { pointer-events: none; }
        .session-tile-glass.past {
          pointer-events: none;
          cursor: default;
          /* keep tile visible but slightly muted rather than heavily greyed */
          opacity: 0.95;
          transform: none !important;
          /* subtle shadow to keep tile defined */
          box-shadow: 0 5px 6px rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.04) !important;
        }
        /* make sheen lighter and less blurry for past tiles so text stays crisp */
        .session-link.past .session-tile-glass::before { opacity: 0.18; filter: blur(6px); }
        .session-link.past .session-tile-content,
        .session-link.past .seats-pill { opacity: 0.95; }

        @media (max-width: 720px) {
          .session-grid { grid-template-columns: 1fr; }
          .session-tile-glass { height: 88px; padding: 12px 14px; }
          .session-tile-content { width: calc(100% - 90px); }
          .seats-pill { width: 80px; height: 56px; min-width: 80px; }
          .seats-count { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
