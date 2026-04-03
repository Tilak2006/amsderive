# CLAUDE.md

## Stack
- **Framework**: Next.js (Pages Router), React 19
- **Backend**: Firebase (Firestore + Storage + Auth) — Admin SDK server-side only
- **Email**: Resend (`RESEND_API_KEY`) — Brevo is legacy/unused
- **Hero animation**: Three.js (WebGL)
- **Charts**: Recharts (modular imports, aliased in `next.config.js`)

## Dev Commands
```bash
npm run dev          # localhost:3000
npm run build        # production build
ANALYZE=true npm run build  # bundle analysis
firebase deploy --only firestore:rules,storage  # deploy rules
```

## Critical Rules

### Architecture
- **Strict Mode is OFF** in `next.config.js` — required to prevent double WebGL context creation in WireframeMesh.
- **All Firestore logic** lives in `src/firebase/firestoreService.js` — do not scatter DB calls across pages.
- **Admin SDK only** for writes, rate limit checks, and transactions (API routes). Client SDK is read-only with `memoryLocalCache`.
- **`src/lib/ambassador-codes.js` is auto-generated** — never edit manually or re-run `generate-ambassador-codes.js` (overwrites all codes).
- **Pages Router only** — no `app/` directory, no `"use client"` at page level.
- **CSS Modules only** — no Tailwind, no styled-components, no UI libraries.

### Data Integrity
- Every registrant document **must** have `emailLower` (lowercase trimmed) for case-insensitive deduplication.
- Every temporal field **must** use `serverTimestamp()` — never `new Date()`.
- Rate limits stored in `_rate_limits/{fingerprint}` — Firestore rules block all client access; Admin SDK only.

### Security
- Never expose Firebase Admin, Resend, or `ADMIN_KEY` to the client — server-side env vars only.
- Validate file type + size **both** client-side and server-side (`src/utils/validators.js`, `src/utils/fileValidation.js`).
- Rate limit fingerprint = SHA-256(IP + User-Agent) — see `src/utils/hashIp.js`.
- All admin API routes require `Authorization: Bearer <Firebase ID token>` verified via `admin.auth().verifyIdToken()`.

### Styling
- CSS Modules only — dark-and-gold aesthetic. Design tokens in `src/styles/design-tokens.css`.
- Gold is always `#D4AF37` — never approximate.
- Use `next/image` with AVIF/WebP for all images. Firebase Storage domain is whitelisted in `next.config.js`.

## Registration Flow
1. Client checks: gate (date open?), cap (3000), duplicate (email + handle + phone)
2. File upload: resume + transcript → Firebase Storage (<400KB, PDF only)
3. POST `/api/submit-registration` → server validates, rate-limit transaction (3/hr/device), writes to `registrants` collection with `status: 'pending'`

## Admin Auth Flow
- Edge middleware (`src/middleware.js`) does a **soft** `__session` cookie check on `/admin/*`
- Hard guard is client-side `onAuthStateChanged` in each admin page
- API guard: `admin.auth().verifyIdToken(token)` in every `/api/admin/*` route
- Login: Firebase Auth `signInWithEmailAndPassword`

## Firestore Collections
| Collection | Purpose |
|---|---|
| `registrants` | Full registration data (Admin SDK only for reads) |
| `pre_registrations` | Early interest emails with optional `refCode` |
| `firms` | Firm partner accounts (Admin SDK only) |
| `stats/leaderboard` | Institution → registration count map |
| `stats/ambassador-offsets` | Institution → admin offset for public campus ambassador leaderboard |
| `_rate_limits` | Rate limit timestamps (Admin SDK only) |

## Campus Ambassador Leaderboard
- **Public page**: `/campus-ambassador-leaderboard` — shows top 5 institutions by pre-registration count via ambassador ref codes
- **Public API**: `GET /api/campus-ambassador-leaderboard` — aggregates `pre_registrations` by institution (via `AMBASSADOR_REF_MAP`), adds admin offsets, returns top-N sorted. Cached 1hr CDN + 1hr in-memory (module-level).
- **Admin offset management**: section on `/admin/ambassadors` — set per-institution offset (adds to actual count on public leaderboard). Supports custom institutions not in `AMBASSADOR_REF_MAP`.
- **Offsets stored**: `stats/ambassador-offsets` Firestore doc — `{ "IIT Bombay": 10, ... }`
- **Multi-ambassador aggregation**: colleges with multiple ambassador codes (IIT BHU, TSEC, IIT Patna) are combined via `normalizeInstitution()` which strips ` (Ambassador N)` suffixes.

## Key Files
| File | Purpose |
|---|---|
| `src/middleware.js` | Edge soft-guard for /admin/* and /firm/* |
| `src/firebase/firestoreService.js` | All Firestore CRUD + rate limit queries (client SDK) |
| `src/firebase/storageService.js` | File upload + URL validation |
| `src/pages/api/submit-registration.js` | Main registration handler |
| `src/pages/api/notify.js` | Pre-registration with refCode tracking |
| `src/pages/api/public/inst-stats.js` | Public institution leaderboard (full registrations) |
| `src/pages/api/campus-ambassador-leaderboard.js` | Public campus ambassador leaderboard (pre-registrations) |
| `src/pages/api/admin/get-ambassador-stats.js` | Ambassador pre-reg stats, grouped by refCode |
| `src/pages/api/admin/get-ambassador-offsets.js` | Read current per-institution offsets |
| `src/pages/api/admin/update-ambassador-offset.js` | Write per-institution offset (allows custom institutions) |
| `src/pages/admin/ambassadors.jsx` | Admin ambassador view + leaderboard offset management |
| `src/pages/rank/a9x3k7f1.jsx` | Public institution leaderboard (full registrations) |
| `src/pages/campus-ambassador-leaderboard.jsx` | Public campus ambassador leaderboard (top 5) |
| `src/utils/validators.js` | All form validation logic |
| `src/utils/hashIp.js` | Rate limit fingerprinting |
| `src/lib/constants.js` | `REGISTRATION_OPENS` date, `TIMEOUT_MS` |
| `src/lib/ambassador-codes.js` | **Auto-generated** referral map — do not edit |

## Environment Variables
**Client (`NEXT_PUBLIC_*`):** `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

**Server-only:** `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `RESEND_API_KEY`, `ADMIN_KEY` (dev gate bypass)

## Project Structure
```
src/
├── pages/
│   ├── index.js                        # Landing page
│   ├── register.jsx                    # Registration (date-gated)
│   ├── campus-ambassador-leaderboard.jsx  # Public campus ambassador leaderboard
│   ├── rank/a9x3k7f1.jsx              # Public institution leaderboard (full regs)
│   ├── admin/                          # Auth-protected admin views
│   │   ├── login.jsx
│   │   ├── dashboard.jsx
│   │   ├── analytics.jsx
│   │   ├── ambassadors.jsx             # Ambassador stats + leaderboard offsets
│   │   └── firms.jsx
│   ├── firm/                           # Firm partner portal
│   │   ├── login.jsx
│   │   └── dashboard.jsx
│   └── api/
│       ├── submit-registration.js
│       ├── notify.js
│       ├── registration-count.js
│       ├── check-registration.js
│       ├── campus-ambassador-leaderboard.js  # Public, 1hr CDN + in-memory cache
│       ├── public/inst-stats.js         # Public institution stats, 60s cache
│       └── admin/
│           ├── get-ambassador-stats.js
│           ├── get-ambassador-offsets.js
│           ├── update-ambassador-offset.js
│           ├── get-registrants.js
│           ├── get-stats.js
│           ├── export-registrants.js
│           ├── update-registrant-status.js
│           └── ...
├── components/                         # UI — form/, ui/, hero/, countdown/, sections/, layout/
├── firebase/                           # firebaseConfig.js, firestoreService.js, storageService.js
├── lib/                                # fonts.js, constants.js, ambassador-codes.js (auto-gen)
├── utils/                              # validators.js, hashIp.js, fileValidation.js
├── hooks/                              # useCountdown
└── styles/                             # CSS modules + design-tokens.css + globals.css
```

## Gotchas
- Registration cap is **3000** in API routes. The client-side cap check in `check-registration.js` should match.
- `REGISTRATION_OPENS` = April 20, 2026 00:00 IST (`src/lib/constants.js`). `ADMIN_KEY` bypasses the date gate for testing.
- Recharts uses modular imports (tree-shaken) configured in `next.config.js` — import from `recharts/es6/...` or let the alias handle it.
- `console.*` is stripped from production builds automatically.
- Campus ambassador leaderboard module-level cache (`_cache`, `_cacheAt`) lives in the serverless function instance — it resets on cold starts but persists across warm invocations within the same instance.
- `stats/ambassador-offsets` is a single Firestore document with institution names as field keys — use `set(..., { merge: true })` to update individual institutions without overwriting others.
