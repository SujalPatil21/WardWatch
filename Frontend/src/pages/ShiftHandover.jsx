import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useLiveData } from "../context/LiveDataContext";

// ─── Status config (matches WardDetailPage) ────────────────────────────────────
const STATUS_CFG = {
  OCCUPIED:          { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)",  color: "#ef4444" },
  AVAILABLE:         { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.4)",  color: "#22c55e" },
  CLEANING:          { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.4)",  color: "#eab308" },
  RESERVED:          { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.4)", color: "#6366f1" },
  WAITING:           { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.4)", color: "#60a5fa" },
  DISCHARGE_PENDING: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.4)", color: "#c084fc" },
};
const FALLBACK_CFG = { bg: "rgba(100,100,100,0.1)", border: "rgba(255,255,255,0.15)", color: "#94a3b8" };

function StatusBadge({ status = "" }) {
  const key = (status || "").toUpperCase();
  const cfg = STATUS_CFG[key] || FALLBACK_CFG;
  return (
    <span className="status-badge" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      {key || "UNKNOWN"}
    </span>
  );
}

function EmptyState({ msg }) {
  return <p className="empty-state">{msg}</p>;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ShiftHandover() {
  const { wardId } = useParams();
  const [printHover, setPrintHover] = useState(false);

  const { beds = [], wards = [], queue = [], alerts = {} } = useLiveData() || {};

  // Find current ward
  const currentWard = wards.find(w => String(w.id) === String(wardId));

  // Filter beds for this ward
  const wardBeds = beds.filter(
    b => String(b.wardId) === String(wardId)
  );

  // Calculate stats
  const totalBeds = wardBeds.length;

  const occupiedBeds = wardBeds.filter(
    b => b.status?.trim().toUpperCase() === "OCCUPIED"
  ).length;

  const availableBeds = wardBeds.filter(
    b => b.status?.trim().toUpperCase() === "AVAILABLE"
  ).length;

  const cleaningBeds = wardBeds.filter(
    b => b.status?.trim().toUpperCase() === "CLEANING"
  ).length;

  // Alert mapping
  const wardAlertsData = alerts[wardId] || [];
  
  // Also include general alerts that might apply to this ward
  const capAlerts = (alerts.capacityAlerts || []).filter(a => String(a.wardId) === String(wardId));
  const clnAlerts = (alerts.cleaningAlerts || []).filter(a => {
    const bed = beds.find(b => String(b.id) === String(a.bedId));
    return bed && String(bed.wardId) === String(wardId);
  });

  const wardAlerts = [...wardAlertsData, ...capAlerts, ...clnAlerts];

  const criticalAlerts = wardAlerts.filter(a =>
    String(a.level || a.type || "").toUpperCase().includes("CRITICAL")
  );

  const pendingAdmissions = queue.filter(q =>
    String(q.wardId) === String(wardId) && q.status?.toUpperCase() === "WAITING"
  );
  const pendingDischarges = queue.filter(q =>
    String(q.wardId) === String(wardId) && q.status?.toUpperCase() === "DISCHARGE_PENDING"
  );

  // Debug (Mandatory)
  console.log("WARD ID:", wardId);
  console.log("ALL BEDS:", beds.length);
  console.log("WARD BEDS:", wardBeds.length);
  console.log("WARD DATA:", currentWard);

  const occupancyPct   = wardBeds.length > 0
    ? Math.round((occupiedBeds.length / wardBeds.length) * 100) : 0;
  const occupancyColor = occupancyPct >= 95 ? "#ef4444" : occupancyPct >= 80 ? "#eab308" : "#22c55e";

  const generatedAt = new Date().toLocaleString("en-IN", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      {/* ══ All styles in one block ═══════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ── Screen base ── */
        .print-root {
          background: #0f172a;
          color: #fff;
          padding: 40px 60px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .print-root-inner {
          max-width: 960px;
          margin: 0 auto;
        }

        /* Cards */
        .print-card {
          background: rgba(30,41,59,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px 28px;
          margin-bottom: 20px;
        }

        /* Header card */
        .header-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f2a4a 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px 36px;
          margin-bottom: 24px;
        }

        /* Section label */
        .section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .stat-box {
          background: rgba(30,41,59,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }
        .stat-value { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
        .stat-label { font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }

        /* Table */
        .ho-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ho-table th {
          background: rgba(255,255,255,0.04);
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #475569;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ho-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #cbd5e1;
        }
        .ho-table tr:last-child td { border-bottom: none; }

        /* Status badge */
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Alert box */
        .alert-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-left: 4px solid #ef4444;
          padding: 14px 16px;
          border-radius: 4px 12px 12px 4px;
          margin-bottom: 10px;
          color: #fca5a5;
          font-size: 13px;
        }
        .alert-type {
          font-size: 11px;
          font-weight: 700;
          color: #ef4444;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        /* Success state */
        .alert-ok {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(34,197,94,0.06);
          border: 1px solid rgba(34,197,94,0.15);
          color: #4ade80;
          font-size: 13px;
          font-weight: 500;
        }

        /* Queue rows */
        .queue-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          margin-bottom: 8px;
          font-size: 13px;
          color: #cbd5e1;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 20px;
          color: #475569;
          font-size: 13px;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border: 1px dashed rgba(255,255,255,0.06);
          margin: 0;
        }

        /* Occupancy bar */
        .occ-track {
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 6px;
        }

        /* Print button */
        .print-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          background: linear-gradient(135deg, #3dbdaa, #6366f1);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(61,189,170,0.3);
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .print-btn:hover {
          background: linear-gradient(135deg, #2fa898, #5254c7);
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(61,189,170,0.5);
        }

        .back-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          padding: 10px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          transition: all 0.2s ease;
          margin-bottom: 28px;
        }
        .back-btn:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }

        /* ══ PRINT OVERRIDES ══════════════════════════════════════════════════ */
        @media print {

          /* Force white document */
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Root wrapper — no vh, no flex, just block flow */
          .print-root {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            width: 100% !important;
          }

          .print-root-inner {
            max-width: 800px !important;
            margin: auto !important;
            padding: 20px !important;
          }

          /* Override ALL backgrounds and colors */
          * {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border-color: #ddd !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          /* Section cards → clean bordered blocks */
          .print-card,
          .header-card {
            background: white !important;
            border: 1px solid #ccc !important;
            border-radius: 8px !important;
            padding: 14px 16px !important;
            margin-bottom: 14px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Header gets a light grey to distinguish */
          .header-card {
            background: #f8fafc !important;
            border: 2px solid #94a3b8 !important;
          }

          /* Stats grid → 4 across */
          .stats-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
          }
          .stat-box {
            background: #f1f5f9 !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 12px !important;
          }
          .stat-value { font-size: 24px !important; color: black !important; }
          .stat-label { color: #475569 !important; }

          /* Table */
          .ho-table th {
            background: #f1f5f9 !important;
            color: #475569 !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .ho-table td {
            color: #1e293b !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }

          /* Status badge → plain bordered text */
          .status-badge {
            background: #f1f5f9 !important;
            border: 1px solid #94a3b8 !important;
            color: #1e293b !important;
          }

          /* Alert box → light red tint */
          .alert-box {
            background: #fff5f5 !important;
            border: 1px solid #fca5a5 !important;
            border-left: 3px solid #ef4444 !important;
            color: #991b1b !important;
          }
          .alert-type { color: #dc2626 !important; }
          .alert-ok   { background: #f0fdf4 !important; border: 1px solid #86efac !important; color: #166534 !important; }

          /* Queue rows */
          .queue-row {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            color: #1e293b !important;
          }

          /* Empty state */
          .empty-state {
            background: #f8fafc !important;
            border: 1px dashed #e2e8f0 !important;
            color: #64748b !important;
          }

          /* Occupancy bar */
          .occ-track { background: #e2e8f0 !important; }

          /* Section labels */
          .section-label { color: #475569 !important; }
          .section-label::after { background: #e2e8f0 !important; }

          /* Hide ALL buttons and screen-only chrome */
          button, .no-print { display: none !important; }

          /* Prevent page breaks inside important blocks */
          .print-card, .alert-box, .queue-row, .stat-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ══ PAGE ═══════════════════════════════════════════════════════════════ */}
      <div className="print-root">
        <div className="print-root-inner">

          {/* Back button */}
          <button className="back-btn no-print" onClick={() => window.history.back()}>
            ← Back to Ward
          </button>

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div className="header-card print-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>
                  🏥 WardWatch — Shift Handover
                </div>
                <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                  Shift Handover Summary
                </h1>
                <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#94a3b8" }}>
                  <strong style={{ color: "#e2e8f0" }}>{currentWard?.name || `Ward ${wardId}`}</strong>
                  <span style={{ margin: "0 8px", opacity: 0.4 }}>•</span>
                  {generatedAt}
                </p>
              </div>

              <button
                className="print-btn no-print"
                onClick={() => window.print()}
              >
                🖨️ Print / Download PDF
              </button>
            </div>

            {/* Occupancy bar */}
            <div style={{ marginTop: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>
                <span>Bed Occupancy</span>
                <strong style={{ color: occupancyColor }}>
                  {occupiedBeds} / {wardBeds.length} beds · {occupancyPct}%
                </strong>
              </div>
              <div className="occ-track">
                <div style={{ height: "100%", width: `${occupancyPct}%`, background: occupancyColor, borderRadius: "3px", transition: "width 0.5s ease" }} />
              </div>
            </div>
          </div>

          {/* ── STATS ───────────────────────────────────────────────────── */}
          <div className="stats-grid">
            {[
              { value: wardBeds.length,      label: "Total Beds",  color: "#f1f5f9" },
              { value: occupiedBeds,  label: "Occupied",    color: "#ef4444"  },
              { value: availableBeds, label: "Available",   color: "#22c55e"  },
              { value: cleaningBeds,  label: "In Cleaning", color: "#eab308"  },
            ].map(({ value, label, color }) => (
              <div key={label} className="stat-box">
                <div className="stat-value" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* ── BED STATUS TABLE ────────────────────────────────────────── */}
          <div className="print-card">
            <p className="section-label">🛏️ Bed Status</p>
            {wardBeds.length === 0 ? (
              <EmptyState msg="No bed data available for this ward." />
            ) : (
              <table className="ho-table">
                <thead>
                  <tr>
                    <th>Bed ID</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {wardBeds.map(bed => (
                    <tr key={bed.id}>
                      <td style={{ fontWeight: "700", color: "#f1f5f9" }}>#{bed.id}</td>
                      <td>{bed.patientName || "—"}</td>
                      <td><StatusBadge status={bed.status} /></td>
                      <td style={{ fontSize: "12px", color: "#475569" }}>
                        {bed.lastUpdated ? new Date(bed.lastUpdated).toLocaleTimeString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── CRITICAL ALERTS ─────────────────────────────────────────── */}
          <div className="print-card">
            <p className="section-label">🚨 Critical Alerts</p>
            {criticalAlerts.length === 0 ? (
              <div className="alert-ok">
                <span>✅</span> No critical alerts — ward is stable.
              </div>
            ) : (
              criticalAlerts.map((a, i) => (
                <div key={i} className="alert-box">
                  <div className="alert-type">{a.type || "CRITICAL ALERT"}</div>
                  {a.message || a.description || "Alert triggered — review immediately."}
                </div>
              ))
            )}
          </div>

          {/* ── PENDING ADMISSIONS ──────────────────────────────────────── */}
          <div className="print-card">
            <p className="section-label">📥 Pending Admissions</p>
            {pendingAdmissions.length === 0 ? (
              <EmptyState msg="No patients currently waiting for admission." />
            ) : (
              pendingAdmissions.map((q, i) => (
                <div key={i} className="queue-row">
                  <span style={{ fontWeight: "600" }}>
                    {q.patientName || `Patient #${q.id || i + 1}`}
                    {q.priority && <span style={{ marginLeft: "10px", fontSize: "11px", color: "#a78bfa" }}>Priority: {q.priority}</span>}
                  </span>
                  <StatusBadge status="WAITING" />
                </div>
              ))
            )}
          </div>

          {/* ── PENDING DISCHARGES ──────────────────────────────────────── */}
          <div className="print-card">
            <p className="section-label">📤 Pending Discharges</p>
            {pendingDischarges.length === 0 ? (
              <EmptyState msg="No patients pending discharge." />
            ) : (
              pendingDischarges.map((q, i) => (
                <div key={i} className="queue-row">
                  <span style={{ fontWeight: "600" }}>
                    {q.patientName || `Patient #${q.id || i + 1}`}
                  </span>
                  <StatusBadge status="DISCHARGE_PENDING" />
                </div>
              ))
            )}
          </div>

          {/* ── FOOTER ──────────────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#334155" }}>
              Auto-generated by WardWatch · Verify with supervising staff before filing.
            </p>
            <button className="print-btn no-print" onClick={() => window.print()}>
              🖨️ Download / Print Report
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
