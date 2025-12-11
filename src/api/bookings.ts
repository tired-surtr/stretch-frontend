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

function getToken() {
  return localStorage.getItem("APP_TOKEN");
}

export async function createBooking(
  sessionId: number,
  seatNumber: number
): Promise<BookingResponse> {
  const token = getToken();

  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      session_id: sessionId,
      seat_number: seatNumber,
    }),
  });

  if (!res.ok) {
    let message = "Failed to create booking";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    return {
      status: "FAILED",
      message,
    };
  }

  return res.json();
}
