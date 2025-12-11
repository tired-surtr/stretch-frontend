// src/components/AvatarPicker.tsx
import React from "react";

type Avatar = { id: string; label?: string; svg: string };

const AVATARS: Avatar[] = [
  // inline SVGs as strings keep this simple. You can replace with file URLs if you prefer.
  { id: "a1", label: "Stretch", svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 21c1.5-4 4.5-7 8-7s6.5 3 8 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>` },
  { id: "a2", label: "Pose", svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a4 4 0 110 8 4 4 0 010-8zM6 14c1-2 3-3 6-3s5 1 6 3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>` },
  { id: "a3", label: "Leaf", svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 3c-6 6-12 6-18 12 0 0 6-1 12-7 6-6 6-6 6-6z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>` },
  { id: "a4", label: "Sparkle", svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l1.6 3.4L17 7l-3.4 1.6L12 12l-1.6-3.4L7 7l3.4-1.6L12 2z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>` },
];

export default function AvatarPicker({
  onSelect,
  onClose,
  selectedId,
}: {
  onSelect: (id: string) => void;
  onClose: () => void;
  selectedId?: string | null;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {AVATARS.map((a) => {
            const isSelected = a.id === selectedId;
            return (
              <button
                key={a.id}
                onClick={() => onSelect(a.id)}
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
                <span
                  style={{ width: 36, height: 36, display: "inline-block", color: "var(--accent-dark)" }}
                  // dangerouslySetInnerHTML is ok here for inline SVG strings controlled by us
                  dangerouslySetInnerHTML={{ __html: a.svg }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
