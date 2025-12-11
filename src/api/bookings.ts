const API_BASE = process.env.REACT_APP_BACKEND_URL!;


export type BookingResponse =
  | {
      status: "CONFIRMED";
      booking: {
        id: number;
        session_id: number;
        seat_number: number;
        status: "CONFIRMED";
        created_at: string;
        updated_at: string;
      };
    }
  | {
      status: "FAILED";
      message: string;
    };

export async function createBooking(
  sessionId: number,
  seatNumber: number
): Promise<BookingResponse> {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      seat_number: seatNumber,
    }),
  });

  if (!res.ok) {
    // if conflict or other error
    let message = "Failed to create booking";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore JSON parse errors
    }
    return {
      status: "FAILED",
      message,
    };
  }

  return res.json();
}
