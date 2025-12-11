// src/components/BookingPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import "./BookingPage.css";

type Session = {
  id: number;
  title?: string;
  session_date?: string | number | null;
  start_time?: string | null;
  capacity?: number | string | null;
  bookedSeats?: number[];
  [k: string]: any;
};

type BookingResult = {
  status: "CONFIRMED" | "FAILED" | string;
};

async function fetchSessionByIdRemote(sessionId: number): Promise<any> {
  const res = await api.get(`/sessions/${sessionId}`);
  return res.data;
}

async function createBookingRemote(sessionId: number, seat: number): Promise<BookingResult> {
  const payload = { session_id: sessionId, seat_number: seat };
  const res = await api.post("/bookings", payload);
  return res.data as BookingResult;
}

/* Helpers */
function toNumberSafe(val: any, fallback = 0) {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeBookedSeatsFromApi(data: any): number[] {
  let result: number[] = [];
  if (Array.isArray(data.bookedSeats)) {
    result = data.bookedSeats.map((b: any) => toNumberSafe(b, NaN)).filter(Number.isFinite);
  } else if (Array.isArray(data.booked_seats)) {
    result = data.booked_seats.map((b: any) => toNumberSafe(b, NaN)).filter(Number.isFinite);
  } else if (Array.isArray(data.bookings)) {
    result = data.bookings
      .map((b: any) => {
        if (typeof b === "number") return toNumberSafe(b, NaN);
        if (b && (b.seat_number || b.seat)) return toNumberSafe(b.seat_number ?? b.seat, NaN);
        return NaN;
      })
      .filter(Number.isFinite);
  } else if (Array.isArray(data.attendees)) {
    result = data.attendees
      .map((a: any) => toNumberSafe(a.seat_number ?? a.seat ?? a.id, NaN))
      .filter(Number.isFinite);
  }
  return result;
}

function normalizeCapacityFromApi(data: any): number {
  const raw = data.capacity ?? data.max_capacity ?? data.size ?? data.totalSeats ?? data.total_seats;
  return toNumberSafe(raw, 0);
}

function formatSessionDateDisplay(s: any) {
  const candidates = [
    s?.session_date,
    s?.start_time,
    s?.startTime,
    s?.date,
    s?.datetime,
    s?.startsAt,
  ];
  const raw = candidates.find((c) => c !== undefined && c !== null && c !== "");
  if (!raw) return "Invalid Date";
  let d = new Date(raw as any);
  if (Number.isNaN(d.getTime()) && typeof raw === "number") {
    d = new Date((raw as number) * 1000);
  }
  if (Number.isNaN(d.getTime())) return "Invalid Date";
  return d.toDateString();
}

function formatSessionTimeDisplay(s: any) {
  const timeCandidate = s?.start_time ?? s?.startTime ?? s?.time ?? s?.startsAt;
  if (!timeCandidate) return "Unknown time";
  try {
    const maybeDate = new Date(timeCandidate);
    if (!Number.isNaN(maybeDate.getTime())) {
      return maybeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch {}
  return String(timeCandidate);
}

function BookingModal({
  seats,
  session,
  open,
  mounting,
  onConfirm,
  onCancel,
  loading,
}: {
  seats: number[];
  session: Session;
  open: boolean;
  mounting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  useEffect(() => {
    if (!mounting) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounting, onCancel]);

  if (!mounting) return null;

  return (
    <div
      className={`bp-modal-overlay ${open ? "open" : ""}`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm booking"
    >
      <div className={`bp-modal-panel ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Confirm booking</h3>
        <p style={{ marginTop: 0, marginBottom: 12, color: "#555" }}>
          {session?.title}
          <br />
          {formatSessionDateDisplay(session)} at {formatSessionTimeDisplay(session)}
        </p>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Seats ({seats.length})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {seats.map((s) => (
              <div key={s} className="bp-modal-seat">
                {s}
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "#333", marginBottom: 12 }}>
          {loading ? "Booking in progress..." : "Click confirm to book selected seats."}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} className="bp-btn bp-btn-ghost" disabled={loading}>
            Cancel
          </button>

          <button onClick={onConfirm} className="bp-btn bp-btn-primary" disabled={loading}>
            {loading ? "Booking..." : `Confirm (${seats.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const sessionId = Number(id);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const maxSelectable = 3;
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  const [modalMounted, setModalMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(sessionId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSessionByIdRemote(sessionId)
      .then((data) => {
        console.log("Fetched session raw:", data);

        const bookedSeatsArray = normalizeBookedSeatsFromApi(data);
        const capacityNum = normalizeCapacityFromApi(data);

        const normalizedSession: Session = {
          ...data,
          capacity: capacityNum,
          bookedSeats: bookedSeatsArray,
        };

        setSession(normalizedSession);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching session:", err);
        setLoading(false);
      });
  }, [id, sessionId]);

  function handleSeatToggle(seat: number) {
    if (confirmLoading) return;
    if (!session) return;
    if ((session.bookedSeats || []).includes(seat)) return;

    setBookingStatus(null);

    setSelectedSeats((prev) => {
      if (prev.includes(seat)) {
        return prev.filter((s) => s !== seat);
      } else {
        if (prev.length >= maxSelectable) return prev;
        return [...prev, seat];
      }
    });
  }

  function handleSeatKey(e: React.KeyboardEvent, seat: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSeatToggle(seat);
    }
  }

  function openConfirmModal() {
    if (selectedSeats.length === 0) return;
    setModalMounted(true);
    window.requestAnimationFrame(() => {
      setModalOpen(true);
    });
  }

  function closeConfirmModal() {
    setModalOpen(false);
    setTimeout(() => setModalMounted(false), 220);
  }

  async function handleConfirmBookingFromModal() {
    if (!session || selectedSeats.length === 0) return;

    const alreadyBooked = selectedSeats.filter((s) => (session.bookedSeats || []).includes(s));
    if (alreadyBooked.length > 0) {
      setBookingStatus(`FAILED: seat(s) ${alreadyBooked.join(", ")} taken.`);
      closeConfirmModal();
      return;
    }

    setConfirmLoading(true);
    setBookingStatus(null);

    const successSeats: number[] = [];
    const failedSeats: number[] = [];

    for (const seat of selectedSeats) {
      try {
        const res = await createBookingRemote(sessionId, seat);

        if (res && res.status === "CONFIRMED") {
          successSeats.push(seat);

          setSession((prev) => {
            if (!prev) return prev;
            const newBooked = Array.from(new Set([...(prev.bookedSeats || []), seat]));
            return { ...prev, bookedSeats: newBooked };
          });
        } else {
          failedSeats.push(seat);
        }
      } catch (err) {
        console.error("Booking error for seat", seat, err);
        failedSeats.push(seat);
      }
    }

    if (successSeats.length > 0) {
      setBookingStatus(`CONFIRMED: ${successSeats.join(", ")}`);
    }
    if (failedSeats.length > 0) {
      setBookingStatus((prev) =>
        prev ? `${prev} — FAILED: ${failedSeats.join(", ")}` : `FAILED: ${failedSeats.join(", ")}`
      );
    }

    setSelectedSeats((prev) => prev.filter((s) => failedSeats.includes(s)));

    setConfirmLoading(false);

    if (failedSeats.length === 0) {
      setTimeout(() => {
        closeConfirmModal();
      }, 350);
    }
  }

  if (loading) return <p>Loading session...</p>;
  if (!session) return <p>Session not found.</p>;

  const slotsLeft = (() => {
    const cap = toNumberSafe(session.capacity, 0);
    const booked = Array.isArray(session.bookedSeats) ? session.bookedSeats.length : 0;
    const remaining = cap - booked;
    return Number.isFinite(remaining) ? remaining : 0;
  })();

  return (
    <div className="bp-page">
      <div className="bp-header">
        <div>
          <h1 style={{ margin: 0 }}>Booking: {session.title}</h1>
          <p style={{ margin: "4px 0 0 0", color: "#555" }}>
            {formatSessionDateDisplay(session)} at {formatSessionTimeDisplay(session)}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Slots left</div>
          <div style={{ fontWeight: 700 }}>{slotsLeft}</div>
        </div>
      </div>

      <h2 style={{ marginTop: 18 }}>Choose your spot (up to {maxSelectable})</h2>

      <div className="seat-grid" aria-label="Seat selection">
        {Array.from({ length: toNumberSafe(session.capacity, 0) }).map((_, i) => {
          const seatNum = i + 1;
          const isBooked = (session.bookedSeats || []).includes(seatNum);
          const isSelected = selectedSeats.includes(seatNum);
          const tileStatus = isBooked ? "booked" : isSelected ? "selected" : "available";

          return (
            <button
              key={seatNum}
              className={`seat-tile ${tileStatus}`}
              role="button"
              tabIndex={isBooked || confirmLoading ? -1 : 0}
              aria-pressed={isSelected}
              aria-label={isBooked ? `Seat ${seatNum} already booked` : `Seat ${seatNum} ${isSelected ? "selected" : ""}`}
              onClick={() => (isBooked || confirmLoading ? undefined : handleSeatToggle(seatNum))}
              onKeyDown={(e) => (isBooked || confirmLoading ? undefined : handleSeatKey(e, seatNum))}
              title={isBooked ? "Already booked" : `Spot ${seatNum}`}
              disabled={isBooked || confirmLoading}
            >
              <span className="seat-label">{seatNum}</span>

              {isSelected && !isBooked && <span className="seat-badge" aria-hidden>
                ✓
              </span>}
              {isBooked && (
                <span className="seat-badge seat-badge-booked" aria-hidden>
                  ×
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedSeats.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <button onClick={openConfirmModal} className="bp-btn bp-btn-primary" disabled={confirmLoading} aria-disabled={confirmLoading}>
            Confirm seat{selectedSeats.length > 1 ? "s" : ""} ({selectedSeats.join(", ")})
          </button>
        </div>
      )}

      {bookingStatus && (
        <p style={{ color: bookingStatus.startsWith("CONFIRMED") ? "green" : "red", fontWeight: 700, marginTop: 12 }}>
          {bookingStatus}
        </p>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link to="/">Back to sessions</Link>
      </div>

      <BookingModal
        seats={selectedSeats}
        session={session}
        mounting={modalMounted}
        open={modalOpen}
        onConfirm={handleConfirmBookingFromModal}
        onCancel={closeConfirmModal}
        loading={confirmLoading}
      />
    </div>
  );
}
