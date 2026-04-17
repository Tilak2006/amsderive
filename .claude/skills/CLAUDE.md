# CLAUDE.md

## Communication Style
You are in caveman mode. Rules:
- Drop articles (a, an, the)
- Drop filler (just, really, actually, simply, certainly, happy to)
- Drop pleasantries and preamble
- No restating the question
- No postamble ("let me know if...")
- Short synonyms only (fix not "implement a solution")
- No hedging ("might be worth considering")
- Fragments fine
- Code blocks, file paths, commands, technical terms: unchanged
- Execute before explaining. Code first, words after if needed.

## Stack
- **Framework**: Next.js (Pages Router), React 19
- **Backend**: Firebase (Firestore + Storage + Auth) — Admin SDK server-side only
- **Email**: Resend (`RESEND_API_KEY`) — Brevo is legacy/unused
- **Hero animation**: Three.js (WebGL) — do NOT modify `src/components/hero/`
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
- **Admin SDK only** for writes, rate limit checks, and transactions (API routes). Client SDK is read-only with `memoryLocalCache`.
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
- All firm API routes require the same token check + a valid `firms/{uid}` Firestore doc.

### Styling
- CSS Modules only — dark-and-gold aesthetic. Design tokens in `src/styles/design-tokens.css`.
- Gold is always `#D4AF37` — never approximate.
- Use `next/image` with AVIF/WebP for all images. Firebase Storage domain is whitelisted in `next.config.js`.

### File Storage (signed URLs)
- Stored resume/transcript URLs use `https://firebasestorage.googleapis.com/v0/b/.../o/registrants%2F...?alt=media`
- To generate a signed URL, parse the path from `urlObj.pathname` — strip query string with `.split('?')[0]` before `decodeURIComponent`, otherwise `?alt=media` contaminates the GCS object key.
- Signed URLs expire in 15 minutes. Admin: `/api/admin/get-signed-url`. Firm: `/api/firm/get-signed-url` (requires `access.resumeDownload`).

## Registration Flow
1. Client checks: gate (date open?), cap (3000), duplicate (email + handle + phone)
2. File upload: resume + transcript → Firebase Storage as `registrants/{timestamp}_{name}_resume.pdf` / `_transcript.pdf` (<400KB, PDF only)
3. POST `/api/submit-registration` → server validates, rate-limit transaction (3/hr/device), writes to `registrants` with `status: 'pending'`

## Admin Auth Flow
- Edge middleware (`src/middleware.js`) does a **soft** `__session` cookie check on `/admin/*`
- Hard guard is client-side `onAuthStateChanged` in each admin page
- API guard: `admin.auth().verifyIdToken(token)` in every `/api/admin/*` route

## Firm Auth Flow
- Edge middleware soft-checks `__firmSession` cookie on `/firm/*`
- Client-side `onAuthStateChanged` → fetches `/api/firm/get-firm-profile` to confirm firm exists in Firestore
- API guard: token verify + `firms/{uid}` doc exists in every `/api/firm/*` route

## Firestore Collections
| Collection | Purpose |
|---|---|
| `registrants` | Full registration data (Admin SDK only for reads) |
| `firms` | Firm partner accounts (tier, access flags, logoUrl) |
| `stats/leaderboard` | Institution → registration count map |
| `_rate_limits` | Rate limit timestamps (Admin SDK only) |

## Firm Access Flags
All stored under `access.*` in `firms/{uid}`:

| Flag | Controls |
|---|---|
| `leaderboard` | Live Codeforces contest standings (`/api/firm/get-leaderboard`) |
| `analytics` | Analytics tab (served from public `/api/public/inst-stats`) |
| `registrantProfiles` | Registrant tab data (`/api/firm/get-registrants`) |
| `finalistProfiles` | Talent pool tab data (`/api/firm/get-finalists`) |
| `resumeDownload` | resumeUrl/resumeFileName fields in both endpoints + `/api/firm/get-signed-url`. Date-gated: only after 2026-05-23. Round-gated: posterior + convergence only. |
| `linkedinAccess` | linkedIn field in both endpoints |
| `emailAccess` | email field in get-registrants (registrants tab only) |
| `csvExport` | CSV download in firm dashboard |
| `psCoDesign` | Branding only — not API-enforced |
| `namingRights` | Branding only — not API-enforced |

**Tier blocking** (hard-coded in API, not just flags):
- `derivation` tier → 403 on `/get-registrants`, `/get-finalists`, `/get-leaderboard`
- `convergence` / `apex` → gated by individual access flags above

## Registrant Fields
### Returned to admin (`/api/admin/get-registrants`)
`id, fullName, email, university, codeforcesHandle, phoneNumber, linkedIn, gitHub, dataConsent, submittedAt, status, round, resumeUrl, resumeFileName, transcriptUrl, transcriptFileName, ipHash, refCode`

### Returned to firm (`/api/firm/get-registrants` and `/api/firm/get-finalists`)
Always: `id, fullName, university, round, codeforcesHandle, gitHub, submittedAt`
If `resumeDownload` + date ≥ 2026-05-23 + round is posterior/convergence: `+ resumeUrl, resumeFileName`
If `linkedinAccess`: `+ linkedIn`
If `emailAccess` (get-registrants only): `+ email`
Never: `transcriptUrl, transcriptFileName, phoneNumber, ipHash, status, refCode`
`get-finalists` returns both posterior + convergence, merged and sorted by `submittedAt` desc.

## Key Files
| File | Purpose |
|---|---|
| `src/middleware.js` | Edge soft-guard for `/admin/*` and `/firm/*` |
| `src/firebase/storageService.js` | File upload + URL construction + validation |
| `src/pages/api/submit-registration.js` | Main registration handler |
| `src/pages/api/notify.js` | Pre-registration with refCode tracking |
| `src/pages/api/public/inst-stats.js` | Public institution leaderboard (60s cache) |
| `src/pages/api/admin/get-signed-url.js` | Admin signed URL (parses path, strips `?alt=media`) |
| `src/pages/api/firm/get-signed-url.js` | Firm signed URL (same fix, requires `resumeDownload` flag) |
| `src/pages/api/firm/get-registrants.js` | Firm registrant data (access-gated, conditional fields) |
| `src/pages/api/firm/get-finalists.js` | Firm finalist data (access-gated, conditional fields) |
| `src/lib/constants.js` | `REGISTRATION_OPENS`, `TIMEOUT_MS` |
| `src/utils/validators.js` | All form validation logic |
| `src/utils/hashIp.js` | Rate limit fingerprinting (SHA-256 IP+UA) |

## Environment Variables
**Client (`NEXT_PUBLIC_*`):** `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

**Server-only:** `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `RESEND_API_KEY`, `ADMIN_KEY` (dev gate bypass)

## Project Structure
```
src/
├── pages/
│   ├── index.jsx                              # Landing page (Three.js hero)
│   ├── register.jsx                           # Registration (date-gated, opens Apr 20 2026)
│   ├── about.jsx
│   ├── ams-derive.jsx
│   ├── syllabus.jsx
│   ├── problems.jsx
│   ├── rules.jsx
│   ├── terms.jsx
│   ├── privacy.jsx
│   ├── competition.jsx
│   ├── check-registration.jsx                 # Public status lookup by email+name
│   ├── dev-registration-checkpoint.jsx        # Dev-only
│   ├── rank/
│   │   └── a9x3k7f1.jsx                      # Full institution leaderboard (60s cache)
│   ├── admin/
│   │   ├── index.js                           # Redirect to /admin/dashboard
│   │   ├── login.jsx
│   │   ├── dashboard.jsx                      # Registrant table, status, broadcast, signed URLs
│   │   ├── analytics.jsx                      # Recharts institution/time breakdowns
│   │   └── firms.jsx                          # Firm account + access flag management
│   ├── firm/
│   │   ├── index.js                           # Redirect to /firm/dashboard
│   │   ├── login.jsx
│   │   └── dashboard.jsx                      # Overview, registrants, talent, analytics, leaderboard tabs
│   └── api/
│       ├── submit-registration.js             # Rate-limited (3/hr/device), writes registrants doc
│       ├── notify.js                          # Pre-reg email + refCode tracking
│       ├── registration-count.js              # Count + cap status (60s cache)
│       ├── check-registration.js              # Cap + duplicate check
│       ├── check-registration-gate.js         # Date gate
│       ├── check-rate-limit.js                # Login rate limit (5/15min/IP)
│       ├── check-status.js                    # Registration status by email+name
│       ├── get-ip.js                          # Return client IP
│       ├── test-registration.js               # Dev bypass (x-admin-key header)
│       ├── public/
│       │   └── inst-stats.js                  # GET, 60s cache
│       ├── admin/                             # All: Bearer token required
│       │   ├── get-registrants.js             # Paginated (50/page)
│       │   ├── get-stats.js                   # Aggregate counts (2min cache)
│       │   ├── export-registrants.js          # JSON export (500/request)
│       │   ├── update-registrant-status.js    # pending/approved/rejected + email
│       │   ├── update-registrant-round.js     # prior/posterior/convergence
│       │   ├── approve-all.js                 # Bulk approve pending
│       │   ├── send-broadcast.js              # Resend bulk email with optional round filter
│       │   ├── get-firms.js                   # List all firms
│       │   ├── create-firm.js                 # Create firm account
│       │   ├── update-firm-access.js          # Toggle access flags
│       │   └── get-signed-url.js              # 15-min signed URL for any file
│       └── firm/                              # All: Bearer token + firms doc required
│           ├── get-firm-profile.js            # Profile + lastLogin update
│           ├── get-registrants.js             # Access-gated, conditional fields
│           ├── get-finalists.js               # Access-gated, conditional fields
│           ├── get-leaderboard.js             # Codeforces standings (30s cache)
│           └── get-signed-url.js              # 15-min signed URL (resumeDownload flag required)
├── components/
│   ├── form/          # RegistrationForm, FileUpload, TextInput, UniversitySelect
│   ├── ui/            # ErrorBanner, Button, SuccessState, RegistrationCard
│   ├── hero/          # WireframeMesh, BackgroundOverlay, Vignette — DO NOT MODIFY
│   ├── countdown/     # CountdownTimer, TimeBlock
│   ├── sections/      # AboutSection, AMSAboutSection, CompetitionSection, SyllabusSection,
│   │                  # SponsorsSection, TimelineSection, WhoSection
│   ├── layout/        # Wordmark, Navbar, Footer
│   └── NotifyModal.jsx
├── firebase/
│   ├── firebaseConfig.js    # Client-side Firebase init
│   ├── firestoreService.js  # Client Firestore helpers (read-only, memoryLocalCache)
│   └── storageService.js    # File upload + URL validation + signed URL parsing
├── lib/
│   ├── fonts.js             # next/font setup (PT Serif, IBM Plex Mono, etc.)
│   ├── constants.js         # REGISTRATION_OPENS, TIMEOUT_MS
│   └── resend.js            # Resend client init
├── utils/
│   ├── validators.js        # Form validation
│   ├── hashIp.js            # SHA-256(IP+UA) fingerprint
│   ├── fileValidation.js    # File size + MIME type checks
│   ├── universities.js      # University dropdown data
│   ├── logger.js            # Server-side structured JSON logger
│   ├── rateLimit.js         # Client-side rate limit helpers
│   ├── performanceLogger.js # Perf metrics logging
│   ├── formOptimization.js  # Form field optimization
│   └── countdownUtils.js    # Countdown timer calculations
├── hooks/
│   └── useCountdown.js
└── styles/
    ├── globals.css
    ├── design-tokens.css
    ├── admin.module.css
    ├── firm.module.css
    ├── leaderboard.module.css
    ├── hero.module.css
    ├── sections.module.css
    ├── about.module.css
    ├── registrationCard.module.css
    ├── problems.module.css
    ├── rules.module.css
    ├── syllabus.module.css
    └── sponsors.module.css
```

## Gotchas
- Registration cap is **3000** — enforce consistently across all routes.
- `REGISTRATION_OPENS` = April 20, 2026 00:00 IST. `ADMIN_KEY` env var bypasses the date gate.
- Recharts uses modular aliased imports configured in `next.config.js`.
- Signed URL bug pattern: never pass a raw Firebase Storage URL to `bucket.file()` — strip `?alt=media` (and any query params) from the path before `decodeURIComponent`.
- `submittedAt` is a Firestore `Timestamp` — call `.toDate().toISOString()` before JSON serialization, never send a raw Timestamp object to the client.
