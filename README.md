# SafeCircle

A mobile-first personal safety app designed for women, built around **trusted circles**, **smart check-ins**, and **real-time alerting**.

---

## Core Concepts

- **Trusted Circle** — pre-approved contacts (family, friends) who receive alerts
- **Safety Sessions** — every safety action is a session with a type and lifecycle:
  - `CHECKIN` — going from A → B with an expected ETA
  - `SAFERIDE` — ride monitoring with plate number + route deviation detection
  - `WALKALONE` — periodic "are you okay?" prompts + motion/stop detection
  - `SOS` — immediate emergency broadcast with optional evidence capture

---

## Architecture Overview

### Clients
- Mobile App (iOS / Android): UI, local sensors, location services, stealth SOS (power button triple press), offline caching
- Web Admin (post-MVP)

### Backend Services
| Service | Responsibility |
|---|---|
| API Gateway | REST entry point |
| Auth Service | OTP-based phone auth |
| Safety Session Service | check-ins, ride mode, walk mode |
| Alerting Service | push / SMS / WhatsApp gateways |
| Location Stream Service | secure location updates during active sessions |
| Rules Engine | delay detection, route deviation, non-response escalation |
| Notification Service | FCM / APNS |

### Data Stores
- **Postgres** — relational data (users, sessions, contacts, alerts)
- **Redis** — real-time state (active sessions, location cache)
- **Object Store** — encrypted evidence uploads (optional)

### Third-party Integrations
- Maps / Routing API (ETA + route polyline)
- SMS OTP provider (Twilio / local BD gateway)
- Emergency call/SMS fallback (if no internet)

---

## Key Flows

### Smart Check-In
1. User sets destination + trusted contacts + grace period
2. Backend computes ETA via routing API
3. App sends periodic location pings
4. Rules Engine triggers `DELAYED_ARRIVAL` alert if ETA exceeded
5. Contacts notified via push → SMS fallback
6. User can extend time or mark safe

### Stealth SOS (Power button / in-app)
1. Triple power-button press detected locally
2. App switches to decoy UI (optional)
3. Background high-frequency location + optional audio recording starts
4. Escalation ladder: push (T+0) → SMS (T+30s) → call automation (T+60s)

### Safe Ride Mode
1. User enters plate number + starts session
2. Backend stores route polyline + deviation thresholds
3. Alerts on route deviation or unexplained stop with no user response

### Walking Alone Mode
1. App prompts every N minutes ("Tap to confirm you're okay")
2. No response within 30s → escalate to contacts with last known location

---

## API Endpoints (MVP)

```
Auth
  POST /auth/request-otp
  POST /auth/verify-otp

Contacts
  POST   /contacts
  POST   /contacts/:id/invite
  GET    /contacts
  DELETE /contacts/:id

Sessions
  POST /sessions/checkin
  POST /sessions/saferide
  POST /sessions/walkalone
  POST /sessions/sos

Session Operations
  POST /sessions/:id/location
  POST /sessions/:id/extend
  POST /sessions/:id/end
  POST /sessions/:id/panic
  GET  /sessions/:id

Alerts
  GET  /alerts?session_id=...
  POST /alerts/:id/ack
  POST /alerts/:id/request-callback
```

---

## Privacy & Safety

- Location collected **only during active sessions**
- Long-term logs use reduced precision (~100–200m geohash)
- Raw location traces auto-deleted after 7–30 days
- Evidence capture is **opt-in**
- Contacts only see location when session is active or alert is triggered
- Invite acceptance required before contacts are added (anti-abuse)
- TLS everywhere, KMS encryption at rest, short-lived tokens, full audit logs

---

## MVP Build Order

1. Phone OTP + Trusted Circle
2. Smart Check-In + delayed arrival alerts
3. SOS (in-app) + push/SMS fallback
4. Walking Alone prompts
5. Safe Ride route deviation (heuristic)

---

## Data Model (Key Entities)

- `User` — phone, name, privacy settings
- `TrustedContact` — relationship, alert channels, invite verification
- `SafetySession` — type, status, policy, share_with
- `CheckInSessionDetails` / `SafeRideSessionDetails` / `WalkAloneSessionDetails`
- `AlertEvent` — immutable, severity, reason, delivery status
- `EvidenceArtifact` — encrypted audio/photo/video (post-MVP)
