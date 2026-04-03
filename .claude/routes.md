# AMS Derive — URL & API Route Reference

Complete map of every page and API endpoint on `amsderive.in`.
Keep this updated whenever a new page or API route is added.

---

## Public Pages

| URL | File | Notes |
|---|---|---|
| `/` | `src/pages/index.jsx` | Landing page — Three.js hero, countdown, sections |
| `/about` | `src/pages/about.jsx` | About AMS page |
| `/ams-derive` | `src/pages/ams-derive.jsx` | About the contest (detailed) |
| `/problems` | `src/pages/problems.jsx` | Problem set info |
| `/syllabus` | `src/pages/syllabus.jsx` | Contest syllabus |
| `/register` | `src/pages/register.jsx` | Registration form — date-gated (opens Apr 20 2026) |
| `/check-registration` | `src/pages/check-registration.jsx` | Look up registration status by email/handle |
| `/campus-ambassador-leaderboard` | `src/pages/campus-ambassador-leaderboard.jsx` | Top 5 institutions by ambassador pre-reg count + offsets |
| `/rank/a9x3k7f1` | `src/pages/rank/a9x3k7f1.jsx` | All institutions ranked by full registration count (60s cache) |

---

## Admin Pages (Firebase Auth required — `__session` cookie)

| URL | File | Notes |
|---|---|---|
| `/admin` | `src/pages/admin/index.js` | Redirects to `/admin/dashboard` |
| `/admin/login` | `src/pages/admin/login.jsx` | Email/password Firebase login |
| `/admin/dashboard` | `src/pages/admin/dashboard.jsx` | Paginated registrant table, status management |
| `/admin/analytics` | `src/pages/admin/analytics.jsx` | Recharts breakdown by institution, time, etc. |
| `/admin/ambassadors` | `src/pages/admin/ambassadors.jsx` | Per-refCode pre-reg stats + leaderboard offset management |
| `/admin/firms` | `src/pages/admin/firms.jsx` | Firm partner account management |

---

## Firm Portal Pages (Firebase Auth + `firms` doc required — `__firmSession` cookie)

| URL | File | Notes |
|---|---|---|
| `/firm` | `src/pages/firm/index.js` | Redirects to `/firm/login` or `/firm/dashboard` |
| `/firm/login` | `src/pages/firm/login.jsx` | Email/password Firebase login |
| `/firm/dashboard` | `src/pages/firm/dashboard.jsx` | Finalist profiles, access-tier gated |

---

## Dev-Only Pages (not for production traffic)

| URL | File | Notes |
|---|---|---|
| `/dev-registration-checkpoint` | `src/pages/dev-registration-checkpoint.jsx` | Dev tool — tests registration cap/duplicate checks locally |

---

## Public API Endpoints (no auth)

| Method | Endpoint | File | Notes |
|---|---|---|---|
| `GET` | `/api/registration-count` | `api/registration-count.js` | Returns `{ count, isOpen, isFull }`. 60s CDN cache. |
| `GET` | `/api/get-ip` | `api/get-ip.js` | Returns client IP — used for rate limit fingerprinting |
| `GET` | `/api/campus-ambassador-leaderboard` | `api/campus-ambassador-leaderboard.js` | Institutions ranked by pre-reg refCode count + admin offsets. 1hr CDN cache + 1hr in-memory cache. Top-N sorted. |
| `GET` | `/api/public/inst-stats` | `api/public/inst-stats.js` | Institutions ranked by full registration count (from `stats/leaderboard`). 60s CDN cache. |
| `POST` | `/api/notify` | `api/notify.js` | Pre-registration: writes `pre_registrations` doc + sends Resend confirmation. Accepts `{ email, refCode }`. Rate limited. |
| `POST` | `/api/submit-registration` | `api/submit-registration.js` | Full registration. Rate limited 3/hr/device. Writes `registrants` doc. |
| `POST` | `/api/check-registration` | `api/check-registration.js` | Checks cap + duplicate (email, CF handle, phone). No writes. |
| `POST` | `/api/check-registration-gate` | `api/check-registration-gate.js` | Returns whether registration is currently open (date check). |
| `POST` | `/api/check-rate-limit` | `api/check-rate-limit.js` | Login attempt rate limit check (5/15min/IP). Used by admin login. |
| `POST` | `/api/check-status` | `api/check-status.js` | Checks rate limit status by IP+UA fingerprint. |
| `POST` | `/api/test-registration` | `api/test-registration.js` | **Dev gate bypass only.** Validates `x-admin-key` header against `ADMIN_KEY` env var, sets `admin_bypass` cookie (1hr). |

---

## Admin API Endpoints (`Authorization: Bearer <Firebase ID token>` required)

| Method | Endpoint | File | Notes |
|---|---|---|---|
| `POST` | `/api/admin/get-registrants` | `api/admin/get-registrants.js` | Paginated registrant list (50/page). |
| `POST` | `/api/admin/get-stats` | `api/admin/get-stats.js` | Aggregate counts — total, pending, approved, rejected. |
| `POST` | `/api/admin/export-registrants` | `api/admin/export-registrants.js` | Download full CSV of all registrants. |
| `POST` | `/api/admin/update-registrant-status` | `api/admin/update-registrant-status.js` | Set `status` to `pending` / `approved` / `rejected`. |
| `POST` | `/api/admin/update-registrant-round` | `api/admin/update-registrant-round.js` | Set `round` field on a registrant. |
| `POST` | `/api/admin/approve-all` | `api/admin/approve-all.js` | Bulk-approve all pending registrants. |
| `POST` | `/api/admin/send-broadcast` | `api/admin/send-broadcast.js` | Send Resend email to a filtered subset of registrants. |
| `POST` | `/api/admin/get-ambassador-stats` | `api/admin/get-ambassador-stats.js` | All `pre_registrations` grouped by `refCode` with email list. |
| `GET` | `/api/admin/get-ambassador-offsets` | `api/admin/get-ambassador-offsets.js` | Read `stats/ambassador-offsets` doc. |
| `POST` | `/api/admin/update-ambassador-offset` | `api/admin/update-ambassador-offset.js` | Write offset for one institution. Accepts any valid string name (custom institutions allowed). |
| `POST` | `/api/admin/get-firms` | `api/admin/get-firms.js` | List all firm accounts. |
| `POST` | `/api/admin/create-firm` | `api/admin/create-firm.js` | Create a new firm account. |
| `POST` | `/api/admin/update-firm-access` | `api/admin/update-firm-access.js` | Toggle access flags on a firm. |
| `POST` | `/api/admin/get-signed-url` | `api/admin/get-signed-url.js` | Generate signed Firebase Storage URL for a registrant document. |

---

## Firm API Endpoints (`Authorization: Bearer <Firebase ID token>` + firm profile required)

| Method | Endpoint | File | Notes |
|---|---|---|---|
| `POST` | `/api/firm/get-firm-profile` | `api/firm/get-firm-profile.js` | Verify token + return firm profile and access tier. |
| `POST` | `/api/firm/get-finalists` | `api/firm/get-finalists.js` | Return registrant subset based on firm's `access` flags. |

---

## Firestore Collections (quick reference)

| Collection / Doc | What's stored |
|---|---|
| `registrants/{id}` | Full registration data — email, handle, university, resume/transcript URLs, status, refCode |
| `pre_registrations/{id}` | Email + optional refCode + timestamp |
| `firms/{id}` | Firm name, tier, access flags, primary email |
| `stats/leaderboard` | `{ "IIT Bombay": 42, ... }` — updated on each full registration |
| `stats/ambassador-offsets` | `{ "IIT Bombay": 10, ... }` — admin-set display offsets for campus amb. leaderboard |
| `_rate_limits/{fingerprint}` | Array of submission timestamps for rate limiting |
