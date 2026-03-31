# CLAUDE.md

## Stack
- **Framework**: Next.js (Pages Router), React 19
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Email**: Brevo (transactional)
- **Hero animation**: Three.js (WebGL)

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

### Data Integrity
- Every registrant document **must** have `emailLower` (lowercase trimmed) for case-insensitive deduplication.
- Every temporal field **must** use `serverTimestamp()` — never `new Date()`.
- Rate limits stored in `_rate_limits/{fingerprint}` — Firestore rules block all client access; Admin SDK only.

### Security
- Never expose Firebase Admin, Brevo, or `ADMIN_KEY` to the client — server-side env vars only.
- Validate file type + size **both** client-side and server-side (`src/utils/validators.js`, `src/utils/fileValidation.js`).
- Rate limit fingerprint = SHA-256(IP + User-Agent) — see `src/utils/hashIp.js`.

### Styling
- CSS Modules only — dark-and-gold aesthetic. Design tokens in `src/styles/design-tokens.css`.
- Use `next/image` with AVIF/WebP for all images. Firebase Storage domain is whitelisted in `next.config.js`.

## Registration Flow
1. Client checks: gate (date open?), cap (2500), duplicate (email + handle + phone)
2. File upload: resume + transcript → Firebase Storage (<400KB, PDF only)
3. POST `/api/submit-registration` → server validates, rate-limit transaction (3/hr/device), writes to `registrants` collection with `status: 'pending'`

## Admin Auth Flow
- Edge middleware (`src/middleware.js`) does a **soft** `__session` cookie check on `/admin/*`
- Hard guard is client-side `onAuthStateChanged` in each admin page
- Login: Firebase Auth `signInWithEmailAndPassword`

## Key Files

| File | Purpose |
|------|---------|
| `src/middleware.js` | Edge soft-guard for /admin/* |
| `src/firebase/firestoreService.js` | All Firestore CRUD + rate limit queries |
| `src/firebase/storageService.js` | File upload + URL validation |
| `src/pages/api/submit-registration.js` | Main registration handler |
| `src/utils/validators.js` | All form validation logic |
| `src/utils/hashIp.js` | Rate limit fingerprinting |
| `src/lib/constants.js` | `REGISTRATION_OPENS` date, `TIMEOUT_MS` |
| `src/lib/ambassador-codes.js` | **Auto-generated** referral map — do not edit |

## Environment Variables

**Client (`NEXT_PUBLIC_*`):** Firebase API key, auth domain, project ID, storage bucket, sender ID, app ID.

**Server-only:** `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `ADMIN_KEY` (dev gate bypass), `BREVO_API_KEY`, `BREVO_LIST_ID`.

## Project Structure
```
src/
├── pages/          # Routes (Pages Router); api/ for server handlers; admin/ for auth-protected views
├── components/     # UI — hero/, form/, ui/, sections/, countdown/
├── firebase/       # SDK config + service layer
├── lib/            # Fonts, constants, ambassador codes
├── utils/          # Validators, rate limit, file checks, universities list
├── hooks/          # useCountdown
└── styles/         # CSS modules + design-tokens.css + globals
```

## Gotchas
- Registration cap is **2500** in Firestore checks but **3000** in API routes — reconcile before launch.
- `REGISTRATION_OPENS` = April 20, 2026 00:00 IST (`src/lib/constants.js`). `ADMIN_KEY` bypasses the date gate for testing.
- Recharts uses modular imports (tree-shaken) configured in `next.config.js` — import from `recharts/es6/...` or let the alias handle it.
- `console.*` is stripped from production builds automatically.
