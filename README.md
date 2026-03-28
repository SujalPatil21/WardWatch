# WardWatch — Project Summary

WardWatch is a real‑time hospital ward dashboard that tracks bed occupancy, patient flow, and predicts short‑term capacity to help doctors make faster decisions and avoid overload.

The system currently supports the full **core flow** (queue → admit → discharge → cleaning → available), live bed status, capacity forecast, alerts, and shift summary. The frontend is responsible for real‑time visuals and usability. A few advanced PS items (multi‑ward, length‑of‑stay alerts, true 4–8 hr forecasts) remain.

---

## What We Did So Far

**Backend**
- Built full auth + queue + bed flow
- Hardened queue transitions
- Added automatic bed cleaning → available
- Added `/capacity`, `/alerts`, `/summary`
- Added role‑based access (STAFF edit, ADMIN view)

**Database**
- Tables: `users`, `queue`, `beds`
- Added `queue.admitted_at` for discharge delay alerts

**Frontend**
- Not implemented here, but backend is ready for:
  - Live bed dashboard
  - Queue flow
  - Alerts + forecast panels
  - Shift handover summary

---

## Alignment with PS (Problem Statement)

### ✅ Aligned
- Live bed status
- Admission & discharge queue
- Capacity forecast
- Smart alerts
- Shift handover summary
- STAFF can update quickly
- ADMIN is read‑only

### ⚠️ Partially Aligned
- Real‑time updates (needs polling/WebSockets in frontend)
- Mobile‑friendly UI (frontend)
- 4–8 hour forecast (current logic is simple “future availability”)

### ❌ Not Implemented Yet
- Multi‑ward admin view (needs schema change)
- Length‑of‑stay alerts
- Staff assignment to beds
- Drag & drop UI

---

## Backend (Current APIs)

**Auth**
- `POST /auth/register`
- `POST /auth/login`

**Queue**
- `GET /queue`
- `POST /queue`
- `POST /queue/{id}/complete?action=admit|discharge`

**Beds**
- `GET /api/beds`
- `POST /api/beds/{id}`

**Intelligence**
- `GET /capacity`
- `GET /alerts`
- `GET /summary`

**Security**
- STAFF: full access (GET + POST)
- ADMIN: view‑only (GET)
- `/auth/**` is open

---

## Database (Schema Snapshot)

**Tables**
- `users` (username, password, role)
- `queue` (name, type, status, bed_id, admitted_at, created_at)
- `beds` (status, patient_name, doctor, last_updated)

**Note:** passwords are currently stored in plain text (to be fixed).

---

## What’s Remaining (Important)

**Backend**
- Hash passwords (BCrypt) + update login validation
- Optional: JWT auth

**Frontend**
- Live bed tiles with instant updates
- Queue flow UI (admit/discharge actions)
- Alerts + forecast cards
- Shift summary view for handover
- Mobile‑friendly UX

**PS Enhancements (Optional)**
- Multi‑ward model
- Length‑of‑stay alerts
- True 4–8 hour forecasting

---

## Suggested Starting Point (Tomorrow)

1. **Frontend core UI**
   - Bed grid + queue list + admit/discharge buttons
2. **Connect to live APIs**
   - `/queue`, `/api/beds`, `/capacity`, `/alerts`, `/summary`
3. **Polling or WebSocket**
   - Poll every 10–15s for live feel
4. **If time permits**
   - Add multi‑ward data or LOS alert

---

If you want, I can generate a Swagger/OpenAPI doc or frontend mock data JSON next.

