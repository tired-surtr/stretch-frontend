// src/components/NavBar.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

type AvatarItem = { id: string; label: string; node: React.ReactNode };

const AVATARS: AvatarItem[] = [
  { id: "happy", label: "Happy", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😀</span> },
  { id: "grin", label: "Grinning", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😄</span> },
  { id: "smile", label: "Smile", node: <span style={{ fontSize: 20, lineHeight: 1 }}>🙂</span> },
  { id: "relaxed", label: "Relaxed", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😌</span> },
  { id: "love", label: "Love", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😍</span> },
  { id: "surprised", label: "Surprised", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😮</span> },
  { id: "confused", label: "Confused", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😕</span> },
  { id: "sleepy", label: "Sleepy", node: <span style={{ fontSize: 20, lineHeight: 1 }}>😴</span> },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // wrapper for pointer events
  const wrapperRef = useRef<HTMLElement | null>(null);
  // now points to the text div (not an image)
  const logoRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("selectedAvatar");
      if (v) setSelectedAvatar(v);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  function chooseAvatar(id: string) {
    try {
      localStorage.setItem("selectedAvatar", id);
    } catch {
      // ignore
    }
    setSelectedAvatar(id);
    setPickerOpen(false);
  }

  function renderAvatarNode(id?: string | null) {
    const match = AVATARS.find((a) => a.id === id);
    if (match) {
      return <span style={{ display: "inline-block", color: "var(--accent-dark)" }}>{match.node}</span>;
    }
    return <span style={{ display: "inline-block", color: "var(--accent-dark)" }}>{AVATARS[0].node}</span>;
  }

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const MAX_DIST = 350;
    const lastMove = { x: 0, y: 0 };

    function updateGlowFromPointer(clientX: number, clientY: number) {
      const logoEl = logoRef.current;
      if (!logoEl) return;

      const rect = logoEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const intensity = Math.max(0, 1 - Math.min(dist, MAX_DIST) / MAX_DIST);
      const eased = Math.pow(intensity, 0.9);

      logoEl.style.setProperty("--logo-glow", String(eased));
      const nx = (dx / MAX_DIST) * 6;
      const ny = (dy / MAX_DIST) * 4;
      logoEl.style.setProperty("--logo-offset-x", `${nx}px`);
      logoEl.style.setProperty("--logo-offset-y", `${ny}px`);
    }

    function handlePointerMove(e: PointerEvent) {
      lastMove.x = e.clientX;
      lastMove.y = e.clientY;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => updateGlowFromPointer(lastMove.x, lastMove.y));
    }

    function handlePointerLeave() {
      const logoEl = logoRef.current;
      if (!logoEl) return;
      logoEl.style.setProperty("--logo-glow", "0");
      logoEl.style.setProperty("--logo-offset-x", `0px`);
      logoEl.style.setProperty("--logo-offset-y", `0px`);
    }

    wrapper.addEventListener("pointermove", handlePointerMove, { passive: true });
    wrapper.addEventListener("pointerleave", handlePointerLeave);
    wrapper.addEventListener("touchend", handlePointerLeave);

    return () => {
      wrapper.removeEventListener("pointermove", handlePointerMove);
      wrapper.removeEventListener("pointerleave", handlePointerLeave);
      wrapper.removeEventListener("touchend", handlePointerLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <header className="nav-wrapper" ref={wrapperRef}>
      <div className="logo-bar" aria-hidden>
        {/* plain text wordmark (no image) */}
        <div
          className="stretch-logo-text"
          ref={logoRef}
          style={{ ["--logo-glow" as any]: 0 } as React.CSSProperties}
        >
          Stretch
        </div>
      </div>

      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/my-bookings" className="nav-link">My bookings</Link>
          <Link to="/admin" className="nav-link">Admin</Link>
        </div>

        <div className="nav-right">
          {!user && (
            <>
              <Link to="/login" className="nav-link">Sign in</Link>
              <Link to="/signup" className="nav-link">Sign up</Link>
            </>
          )}

          {user && (
            <div className="profile-area">
              <button
                type="button"
                className="profile-icon"
                onClick={() => setPickerOpen(true)}
                aria-haspopup="dialog"
                aria-label="Choose avatar"
                title="Choose avatar"
                style={{ padding: 6 }}
              >
                {renderAvatarNode(selectedAvatar)}
              </button>

              <span className="username">{user.name || user.email}</span>

              <button className="logout-btn" onClick={logout}>
                Logout
              </button>

              {pickerOpen && (
                <div
                  role="dialog"
                  aria-modal="true"
                  onClick={() => setPickerOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2200,
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: 420,
                      maxWidth: "92%",
                      borderRadius: 12,
                      padding: 18,
                      background: "#fff",
                      boxShadow: "0 20px 60px rgba(10,20,40,0.18)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <strong style={{ fontSize: 16 }}>Choose an avatar</strong>
                      <button onClick={() => setPickerOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                      {AVATARS.map((a) => {
                        const isSelected = a.id === selectedAvatar;
                        return (
                          <button
                            key={a.id}
                            onClick={() => chooseAvatar(a.id)}
                            aria-pressed={isSelected}
                            style={{
                              height: 64,
                              borderRadius: 10,
                              border: isSelected ? "2px solid var(--accent-dark)" : "1px solid rgba(0,0,0,0.06)",
                              background: isSelected ? "linear-gradient(180deg, rgba(139,110,247,0.12), rgba(139,110,247,0.06))" : "rgba(255,255,255,0.9)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title={a.label}
                          >
                            <span style={{ width: 36, height: 36, display: "inline-block", color: "var(--accent-dark)" }}>
                              {a.node}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
