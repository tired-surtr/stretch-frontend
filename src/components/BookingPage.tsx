import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSessionById } from "../api/sessions";
import { createBooking } from "../api/bookings";

function BookingPage() {
  const { id } = useParams();
  const sessionId = Number(id);

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionById(sessionId)
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [sessionId]);

  function handleSeatClick(seat: number) {
    if (session.bookedSeats.includes(seat)) return; // already booked
    setSelectedSeat(seat);
  }

  async function handleConfirmBooking() {
    if (!selectedSeat) return;
    const result = await createBooking(sessionId, selectedSeat);

    if (result.status === "CONFIRMED") {
      setBookingStatus("CONFIRMED");
    } else {
      setBookingStatus("FAILED");
    }
  }

  if (loading) return <p>Loading session...</p>;

  if (!session) return <p>Session not found.</p>;

  return (
    <div>
      <h1>Booking: {session.title}</h1>
      <p>
        {new Date(session.session_date).toDateString()} at{" "}
        {session.start_time}
      </p>

      <h2>Choose your seat</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", maxWidth: "300px" }}>
        {Array.from({ length: session.capacity }).map((_, i) => {
          const seatNum = i + 1;
          const isBooked = session.bookedSeats.includes(seatNum);
          const isSelected = seatNum === selectedSeat;

          return (
            <div
              key={seatNum}
              onClick={() => handleSeatClick(seatNum)}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                cursor: isBooked ? "not-allowed" : "pointer",
                backgroundColor: isBooked
                  ? "#ff7070"
                  : isSelected
                  ? "#4caf50"
                  : "#ddd",
                color: "#000",
                userSelect: "none",
              }}
            >
              {seatNum}
            </div>
          );
        })}
      </div>

      {selectedSeat && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleConfirmBooking}>Confirm Booking</button>
        </div>
      )}

      {bookingStatus === "CONFIRMED" && (
        <p style={{ color: "green", fontWeight: "bold", marginTop: "20px" }}>
          Booking Confirmed! 🎉
        </p>
      )}

      {bookingStatus === "FAILED" && (
        <p style={{ color: "red", fontWeight: "bold", marginTop: "20px" }}>
          Seat already booked. Try another one.
        </p>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link to="/">Back to sessions</Link>
      </div>
    </div>
  );
}

export default BookingPage;
