import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * FloatingHandoverButton
 *
 * Renders a fixed "Generate Handover" button ONLY when the current
 * route matches /ward/:id. Uses React Router's useParams so it is
 * already scoped — it only mounts inside the /ward/:id route.
 *
 * Usage: place <FloatingHandoverButton /> inside WardDetailPage, OR
 * render it as a sibling route element inside the /ward/:id Route in App.jsx.
 */
export default function FloatingHandoverButton() {
  const navigate = useNavigate();
  const { id }   = useParams();  // populated only when inside /ward/:id route
  const [hover, setHover]     = useState(false);
  const [pressed, setPressed] = useState(false);

  // Fallback: parse wardId from window.location if useParams gives nothing
  const wardId = id || (() => {
    const parts = window.location.pathname.split("/");
    const idx   = parts.indexOf("ward");
    return idx !== -1 ? parts[idx + 1] : null;
  })();

  if (!wardId) return null;

  const handleClick = () => {
    setPressed(true);
    console.log("Navigating to:", `/handover/${wardId}`);
    setTimeout(() => {
      navigate(`/handover/${wardId}`);
    }, 120);
  };

  const baseStyle = {
    position:     "fixed",
    bottom:       "32px",
    right:        "32px",
    padding:      "14px 22px",
    background:   hover
      ? "linear-gradient(135deg, #2fa898, #5b5ff0)"
      : "linear-gradient(135deg, #3dbdaa, #6366f1)",
    color:        "white",
    border:       "none",
    borderRadius: "14px",
    fontWeight:   "700",
    fontSize:     "14px",
    cursor:       "pointer",
    zIndex:       9999,
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
    boxShadow:    hover
      ? "0 12px 36px rgba(61,189,170,0.5)"
      : "0 8px 28px rgba(61,189,170,0.35)",
    transform:    pressed ? "scale(0.96)" : hover ? "translateY(-2px)" : "translateY(0)",
    transition:   "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
    fontFamily:   "'Inter', 'Segoe UI', sans-serif",
    letterSpacing: "-0.01em",
  };

  return (
    <button
      id="ww-handover-btn"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={baseStyle}
      title={`Generate handover summary for ward ${wardId}`}
    >
      <span style={{ fontSize: "16px" }}>📋</span>
      Generate Handover
    </button>
  );
}
