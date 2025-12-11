// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import BookingPage from "./components/BookingPage";
import AdminPage from "./components/AdminPage";
import BookingHistory from "./components/BookingHistory";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";
import SignupPage from "./pages/SignupPage";
import { useAuth } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import SessionTiles from "./components/SessionTiles";

function App() {
  const { sessions, loading } = useAppContext();
  const { user } = useAuth();

  if (loading) {
    return <p>Loading sessions...</p>;
  }

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    if ((user.role || "").toUpperCase() !== "ADMIN") return <Navigate to="/" replace />;
    return <>{children}</>;
  };

  return (
    <div>
      <NavBar />

      <main style={{ padding: "28px", maxWidth: 900, margin: "0 auto" }}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h2 style={{ marginBottom: 16 }}>Available Sessions</h2>
                <SessionTiles />
              </div>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                <BookingHistory />
              </RequireAuth>
            }
          />

          <Route path="/booking/:id" element={<BookingPage />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
