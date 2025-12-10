import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import BookingPage from "./components/BookingPage";
import AdminPage from "./components/AdminPage";

function App() {
  const { sessions, loading, role, setRole } = useAppContext();

  if (loading) {
    return <p>Loading sessions...</p>;
  }

  return (
    <div>
      <h1>Stretch</h1>
      <p>Welcome. View your upcoming physio sessions.</p>

      <div style={{ marginBottom: "12px" }}>
        <span style={{ marginRight: "8px" }}>
          Viewing as: <strong>{role}</strong>
        </span>
        <button onClick={() => setRole("USER")} style={{ marginRight: "4px" }}>
          User
        </button>
        <button onClick={() => setRole("ADMIN")}>Admin</button>
      </div>

      <nav style={{ marginBottom: "16px" }}>
        <Link to="/" style={{ marginRight: "12px" }}>
          User view
        </Link>
        <Link to="/admin">Admin</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h2>Available Sessions</h2>
              {sessions.length === 0 ? (
                <p>No sessions found.</p>
              ) : (
                <ul>
                  {sessions.map((s) => (
                    <li key={s.id}>
                      <Link to={`/booking/${s.id}`}>
                        <strong>{s.title}</strong>
                      </Link>{" "}
                      – {s.start_time} on{" "}
                      {new Date(s.session_date).toDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
        />
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
