# AMS Derive — URL & API Route Reference

Complete map of every page and API endpoint on `amsderive.in`.
Keep this updated whenever a new page or API route is added.

---

## Public Pages

| URL | File | Notes |
|---|---|---|
| `/` | `src/pages/index.jsx` | Landing page — Three.js hero, countdown, sections |
| `/about` | `src/pages/about.jsx` | About AMS |
| `/ams-derive` | `src/pages/ams-derive.jsx` | About the contest (detailed) |
| `/problems` | `src/pages/problems.jsx` | Problem set info |
| `/syllabus` | `src/pages/syllabus.jsx` | Contest syllabus |
| `/rules` | `src/pages/rules.jsx` | Competition rules |
| `/terms` | `src/pages/terms.jsx` | Terms of service |
| `/privacy` | `src/pages/privacy.jsx` | Privacy policy |
| `/competition` | `src/pages/competition.jsx` | Competition info |
| `/register` | `src/pages/register.jsx` | Registration form — date-gated (opens Apr 20 2026 00:00 IST) |
| `/check-registration` | `src/pages/check-registration.jsx` | Public status lookup by email + name |
| `/rank/a9x3k7f1` | `src/pages/rank/a9x3k7f1.jsx` | All institutions ranked by full registration count (60s cache) |

---

## Admin Pages (Firebase Auth required — `__session` cookie)

| URL | File | Notes |
|---|---|---|
| `/admin` | `src/pages/admin/index.js` | Redirects to `/admin/dashboard` |
| `/admin/login` | `src/pages/admin/login.jsx` | Email/password Firebase login |
| `/admin/dashboard` | `src/pages/admin/dashboard.jsx` | Registrant table, status management, broadcast, signed URL viewer |
| `/admin/analytics` | `src/pages/admin/analytics.jsx` | Recharts breakdown by institution, time, etc. |
| `/admin/firms` | `src/pages/admin/firms.jsx` | Firm partner account creation and access flag management |

---

## Firm Portal Pages (Firebase Auth + `firms` doc required — `__firmSession` cookie)

| URL | File | Notes |
|---|---|---|
| `/firm` | `src/pages/firm/index.js` | Redirects to `/firm/dashboard` |
| `/firm/login` | `src/pages/firm/login.jsx` | Email/password Firebase login |
| `/firm/dashboard` | `src/pages/firm/dashboard.jsx` | Tabs: Overview, Registrants, Talent Pool, Analytics, Leaderboard |

### Firm Dashboard Tabs
| Tab | Access Gate | What It Shows |
|---|---|---|
| Overview | Always | Tier info, access matrix, contest timeline, quick links |
| Registrants | `tier !== derivation` + `access.registrantProfiles` | Clickable table + detail panel (resume/transcript/linkedin based on flags) |
| Talent Pool | `tier !== derivation` + `access.finalistProfiles` | Posterior + convergence-round finalist cards with resume/linkedin |
| Analytics | Always | Public institution breakdown chart (from `/api/public/inst-stats`) |
| Leaderboard | `tier !== derivation` + `access.leaderboard` | Live Codeforces PRIOR standings (auto-refreshes 30s) |

---

## Dev-Only Pages

| URL | File | Notes |
|---|---|---|
| `/dev-registration-checkpoint` | `src/pages/dev-registration-checkpoint.jsx` | Dev tool — tests registration cap/duplicate checks locally |

---

## Public API Endpoints (no auth)

| Method | Endpoint | File | Notes |
|---|---|---|---|
| `GET` | `/api/registration-count` | `api/registration-count.js` | Returns `{ count, isOpen, isFull }`. 60s CDN cache. |
| `GET` | `/api/get-ip` | `api/get-ip.js` | Returns client IP — used for rate limit fingerprinting |
| `GET` | `/api/public/inst-stats` | `api/public/inst-stats.js` | Institutions ranked by full registration count (`stats/leaderboard`). 60s CDN cache. |
| `POST` | `/api/notify` | `api/notify.js` | Pre-registration: writes `pre_registrations` doc + sends Resend confirmation. Rate limited. |
| `POST` | `/api/submit-registration` | `api/submit-registration.js` | Full registration. Rate limited 3/hr/device. Writes `registrants` doc with `status: pending`. |
| `POST` | `/api/check-registration` | `api/check-registration.js` | Cap check + duplicate check (email, CF handle, phone). No writes. |
| `POST` | `/api/check-registration-gate` | `api/check-registration-gate.js` | Returns whether registration is currently open. |
| `POST` | `/api/check-rate-limit` | `api/check-rate-limit.js` | Login rate limit check (5/15min/IP). Used by admin and firm login pages. |
| `POST` | `/api/check-status` | `api/check-status.js` | Registration status lookup by email + name (rate limited). |
| `POST` | `/api/test-registration` | `api/test-registration.js` | **Dev only.** Validates `x-admin-key` header, sets `admin_bypass` cookie (1hr). |

---

## Admin API Endpoints (`Authorization: Bearer <Firebase ID token>` required)

| Method | Endpoint | File | Notes |
|---|---|---|---|
| `POST` | `/api/admin/get-registrants` | `admin/get-registrants.js` | Paginated (50/page, cursor via `lastDocId`). Returns all fields including email/phone. |
| `POST` | `/api/admin/get-stats` | `admin/get-stats.js` | Aggregate counts — total, pending, approved, rejected. 2min cache. |
| `POST` | `/api/admin/export-registrants` | `admin/export-registrants.js` | JSON export (500/request, cursor pagination). |
| `POST` | `/api/admin/update-registrant-status` | `admin/update-registrant-status.js` | Set `status` → `pending / approved / rejected`. Sends Resend email on approve/reject. |
| `POST` | `/api/admin/update-registrant-round` | `admin/update-registrant-round.js` | Set `round` → `prior / posterior / convergence`. |
| `POST` | `/api/admin/approve-all` | `admin/approve-all.js` | Bulk-approve all pending registrants. Batched Resend emails. |
| `POST` | `/api/admin/send-broadcast` | `admin/send-broadcast.js` | Send Resend email to all registrants or filtered by round. |
| `POST` | `/api/admin/get-firms` | `admin/get-firms.js` | List all firm accounts ordered by `createdAt` desc. |
| `POST` | `/api/admin/create-firm` | `admin/create-firm.js` | Create firm Firebase Auth user + `firms` doc. Validates email domain + 12-char password. |
| `POST` | `/api/admin/update-firm-access` | `admin/update-firm-access.js` | Toggle a single access flag on a firm doc. |
| `POST` | `/api/admin/get-signed-url` | `admin/get-signed-url.js` | 15-min GCS signed URL for any file. Strips `?alt=media` from path before lookup. |

---

## Firm API Endpoints (`Authorization: Bearer <Firebase ID token>` + `firms/{uid}` doc required)

| Method | Endpoint | File | Gate | Notes |
|---|---|---|---|---|
| `POST` | `/api/firm/get-firm-profile` | `firm/get-firm-profile.js` | Token only | Returns `firmName, tier, access, logoUrl`. Updates `lastLogin`. |
| `POST` | `/api/firm/get-registrants` | `firm/get-registrants.js` | `tier !== derivation` + `access.registrantProfiles` | Approved + consented registrants. Conditional resume/linkedin fields. Cursor pagination. |
| `POST` | `/api/firm/get-finalists` | `firm/get-finalists.js` | `tier !== derivation` + `access.finalistProfiles` | `round === posterior` or `convergence` registrants, merged + sorted by `submittedAt`. Same conditional fields. |
| `POST` | `/api/firm/get-leaderboard` | `firm/get-leaderboard.js` | `tier !== derivation` + `access.leaderboard` | Live Codeforces PRIOR contest standings. 30s server cache. |
| `POST` | `/api/firm/get-signed-url` | `firm/get-signed-url.js` | `access.resumeDownload` | 15-min GCS signed URL. Path must start with `registrants/`. |

---

## Firestore Collections (quick reference)

| Collection / Doc | What's stored |
|---|---|
| `registrants/{id}` | Full registration — email, handle, university, resumeUrl, transcriptUrl, status, round, refCode, ipHash, etc. |
| `firms/{uid}` | firmName, tier (derivation/convergence/apex), access flags map, logoUrl, lastLogin |
| `stats/leaderboard` | `{ "IIT Bombay": 42, ... }` — updated on each registration |
| `_rate_limits/{fingerprint}` | Array of submission timestamps |

---

## Rate Limits

| Action | Limit | Fingerprint |
|---|---|---|
| Registration submission | 3/hr/device | SHA-256(IP + User-Agent) |
| Admin/firm login | 5 attempts/15min/IP | IP only |
| Pre-registration notify | 3/hr/device | SHA-256(IP + User-Agent) |
| Status check | 5/12hr/device | SHA-256(IP + User-Agent) |
