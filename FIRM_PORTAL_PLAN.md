# AMS Derive — Firm Partner Portal & Live Leaderboard
## Technical Architecture & Implementation Plan

**Document Version:** 1.0  
**Status:** Internal — Engineering & Product  
**Revision Cycle:** Review before each phase kickoff

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Data Architecture](#3-data-architecture)
4. [Authentication & Access Control](#4-authentication--access-control)
5. [Codeforces Integration Layer](#5-codeforces-integration-layer)
6. [Firm Dashboard Feature Set](#6-firm-dashboard-feature-set)
7. [API Design](#7-api-design)
8. [Real-Time Architecture](#8-real-time-architecture)
9. [Security Model](#9-security-model)
10. [Environments & Deployment](#10-environments--deployment)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Open Questions & Decisions](#13-open-questions--decisions)

---

## 1. System Overview

The AMS Derive Partner Portal is a **secure, invitation-only web application** that allows vetted recruiting partners to monitor the live Codeforces contest, discover top candidates, and manage their recruitment pipeline — all without any manual intervention from the organizing team.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FIRM BROWSER                         │
│           Next.js Frontend (Vercel Edge Network)            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS + JWT (HttpOnly Cookie)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS API LAYER                         │
│  /api/auth/*   /api/firms/*   /api/leaderboard/*            │
│         (Server-side only — no secrets exposed)             │
└────────┬──────────────────┬───────────────────┬────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
  ┌────────────┐   ┌──────────────┐   ┌──────────────────┐
  │  Firebase  │   │  Codeforces  │   │  Resend / SMTP   │
  │  Firestore │   │  Private API │   │  (Magic Links)   │
  │  + Auth    │   │  (Signed)    │   │                  │
  └────────────┘   └──────────────┘   └──────────────────┘
```

### Core Principles

- **Zero client secrets.** All Codeforces API keys, signing logic, and Firestore Admin credentials live exclusively in the server environment.
- **Consent-gated data.** No candidate data is surfaced to firms unless `dataConsent: true` in the candidate's profile.
- **Tier-scoped access.** Every API route validates the requesting firm's permission tier before returning data.
- **Graceful degradation.** If the Codeforces API is unreachable, the last cached standings are served with a visible staleness indicator — the portal never shows a broken state.

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR, API Routes, and edge-compatible middleware in one repo |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid iteration with a design system; custom gold/charcoal tokens |
| **Auth** | Firebase Auth (custom Magic Link) | Managed session tokens; ties into Firestore ACL checks |
| **Database** | Cloud Firestore | Real-time listeners, schemaless for candidate profiles, scales to zero |
| **File Storage** | Firebase Storage | Resumes and transcripts, behind Storage Security Rules |
| **Email** | Resend | Reliable transactional delivery; clean React Email templates |
| **Caching** | Vercel KV (Redis) | Server-side caching of CF standings; prevents repeated signed requests |
| **Deployment** | Vercel | Serverless functions, edge middleware, env secret management |
| **Monitoring** | Vercel Analytics + Sentry | Performance + error tracking; no PII in logs |

---

## 3. Data Architecture

### Firestore Collections

#### `firms/{firmId}`
```jsonc
{
  "firmId": "gsoc-google-2026",
  "displayName": "Google DeepMind",
  "logoUrl": "https://storage.../logos/google.png",
  "tier": "apex",               // "derivation" | "convergence" | "apex"
  "allowedDomains": ["google.com", "deepmind.com"],
  "allowedEmails": [],          // For individual non-domain users
  "isActive": true,
  "createdAt": "<timestamp>",
  "notes": "Platinum partner — direct contact enabled"
}
```

#### `firmSessions/{sessionId}`
```jsonc
{
  "firmId": "gsoc-google-2026",
  "email": "talent@google.com",
  "createdAt": "<timestamp>",
  "expiresAt": "<timestamp>",   // 8-hour rolling session
  "lastActiveAt": "<timestamp>",
  "ipAddress": "x.x.x.x",
  "userAgent": "..."
}
```

#### `magicTokens/{token}`
```jsonc
{
  "email": "talent@google.com",
  "firmId": "gsoc-google-2026",
  "expiresAt": "<timestamp>",   // 15 minutes from issuance
  "used": false
}
```

#### `candidates/{candidateId}`
```jsonc
{
  "cfHandle": "tourist",
  "realName": "Gennady Korotkevich",
  "email": "...",
  "university": "ITMO University",
  "universityTier": "T1",       // "T1" | "T2" | "T3"
  "graduationYear": 2026,
  "branch": "Computer Science",
  "resumeUrl": null,            // Firebase Storage path (null if not uploaded)
  "transcriptUrl": null,
  "dataConsent": true,
  "contactConsent": true,       // Firm can send the interest email
  "createdAt": "<timestamp>"
}
```

#### `firmShortlists/{firmId}/candidates/{candidateId}`
```jsonc
{
  "addedAt": "<timestamp>",
  "addedByEmail": "talent@google.com",
  "note": "Strong in combinatorics, graduating May 2026"
}
```

#### `firmInterest/{interactionId}`
```jsonc
{
  "firmId": "gsoc-google-2026",
  "candidateId": "...",
  "triggeredByEmail": "talent@google.com",
  "emailSentAt": "<timestamp>",
  "status": "sent"              // "sent" | "failed"
}
```

#### `leaderboardCache/{contestId}`
```jsonc
{
  "contestId": 12345,
  "standings": [ /* merged CF + Firestore rows */ ],
  "fetchedAt": "<timestamp>",
  "cfApiStatus": "ok"           // "ok" | "error" | "rate_limited"
}
```

---

## 4. Authentication & Access Control

### 4.1 Magic Link Flow

```
Firm enters email
      │
      ▼
POST /api/auth/request-link
  → Validate email against Firestore firms collection
  → If not whitelisted → return 403 (no info leak about which domains are allowed)
  → Generate cryptographically secure token (crypto.randomBytes(32).toString('hex'))
  → Store in magicTokens collection (TTL: 15 min, used: false)
  → Send email via Resend with link: /auth/verify?token=<token>&email=<encoded>
      │
      ▼
Firm clicks link → GET /api/auth/verify
  → Load token document; validate not expired, not used
  → Mark token as used: true (one-time only)
  → Create firmSessions document
  → Set HttpOnly, Secure, SameSite=Strict cookie with sessionId
  → Redirect to /dashboard
      │
      ▼
All subsequent requests: Edge Middleware validates cookie → loads session → attaches firm tier to request context
```

### 4.2 Role-Based Access Control (RBAC)

| Permission | Derivation | Convergence | Apex |
|---|:---:|:---:|:---:|
| View live leaderboard | ✅ | ✅ | ✅ |
| Filter by university / grad year | ✅ | ✅ | ✅ |
| Export registrant CSV | ❌ | ✅ | ✅ |
| View candidate profiles (consented) | ❌ | ❌ | ✅ |
| View resumes & transcripts | ❌ | ❌ | ✅ |
| Add candidates to shortlist | ❌ | ✅ | ✅ |
| Send "Interested" outreach email | ❌ | ❌ | ✅ |
| Export shortlisted candidates | ❌ | ✅ | ✅ |

> **Implementation:** A `withTier(minTier)` higher-order middleware wraps each API route. It reads the tier from the validated session, and returns `403 Forbidden` with a structured error body if the firm's tier is insufficient.

### 4.3 Session Management

- Sessions last **8 hours** with a sliding expiry on activity.
- Sessions are invalidated server-side on logout (document deleted from Firestore).
- Concurrent sessions from the same firm account are allowed (multiple team members).
- A firm admin can view and revoke active sessions via the portal settings page.

---

## 5. Codeforces Integration Layer

### 5.1 API Signing (Server-Side Only)

The Codeforces API for private Gym contests requires a signed request. **This logic must never run on the client.**

```typescript
// lib/codeforces/sign.ts (server-only)
import crypto from 'crypto';

interface CFParams {
  [key: string]: string | number;
}

export function buildSignedRequest(
  methodName: string,
  params: CFParams
): string {
  const apiKey = process.env.CF_API_KEY!;
  const apiSecret = process.env.CF_API_SECRET!;

  const rand = Math.floor(Math.random() * 900000 + 100000).toString();
  const time = Math.floor(Date.now() / 1000).toString();

  const allParams: CFParams = { ...params, apiKey, time };
  const sortedParams = Object.keys(allParams)
    .sort()
    .map((k) => `${k}=${allParams[k]}`)
    .join('&');

  const toHash = `${rand}/${methodName}?${sortedParams}#${apiSecret}`;
  const apiSig = rand + crypto.createHash('sha512').update(toHash).digest('hex');

  return `https://codeforces.com/api/${methodName}?${sortedParams}&apiSig=${apiSig}`;
}
```

### 5.2 Data Merge Pipeline

```
fetchAndMergeStandings(contestId: number)
│
├─ 1. Check Vercel KV cache
│       Key: `cf:standings:${contestId}`
│       TTL: 60 seconds
│       If HIT and age < 60s → return cached data immediately
│
├─ 2. If MISS → call Codeforces API (signed)
│       contest.standings?contestId=X&from=1&count=200&showUnofficial=false
│
├─ 3. For each row in standings:
│       cfHandle → lookup in `candidates` collection
│       If dataConsent: false → include handle + rank, but mask name/university
│       If dataConsent: true → merge full profile data
│
├─ 4. Attach metadata per row:
│       { rank, cfHandle, realName?, university?, universityTier?,
│         graduationYear?, solvedCount, penalty, lastSolvedAt,
│         profileVisible: boolean }
│
├─ 5. Write merged result to:
│       Firestore: leaderboardCache/{contestId}   (durable, for audit)
│       Vercel KV: cf:standings:{contestId}       (fast, 60s TTL)
│
└─ 6. Return merged standings array
```

### 5.3 Rate Limit Handling

- Codeforces allows ~5 requests/second per API key. With 60-second server-side caching, all firm clients share one upstream fetch per minute — well within limits.
- If the CF API returns a non-200 or a `FAILED` status, serve stale cache and set `cfApiStatus: "error"` in the response. The frontend renders a banner: **"Standings last updated X minutes ago — Codeforces API temporarily unavailable."**
- Back-off: On failure, skip the next scheduled fetch and retry after 2× the cache TTL.

---

## 6. Firm Dashboard Feature Set

### 6.1 Leaderboard View

- **Default sort:** Global rank ascending.
- **Columns:** Rank, Handle, Real Name\*, University\*, Grad Year\*, Problems Solved, Penalty, Last Solved.
  - \* Columns marked with asterisk only populated for `dataConsent: true` candidates.
- **Filter panel (right sidebar):**
  - University Tier: T1 / T2 / T3 / All
  - Graduation Year: multi-select checkboxes
  - Profile Visibility: "Consented profiles only" toggle
  - Min. problems solved: slider (0–N)
- **Rank-change indicators:** Each row shows a ▲/▼ badge with the delta since the firm first loaded the page (client-side baseline snapshot, not persisted).

### 6.2 Candidate Profile Drawer

Triggered by clicking any consented candidate row. Slides in from the right without a page navigation.

**Contents:**
- Name, university, branch, graduation year
- CF handle with link to public CF profile
- Resume viewer: embedded PDF (served via signed Firebase Storage URL, expires in 5 minutes)
- Transcript viewer: same mechanism
- "Add to Shortlist" button with optional note
- "Express Interest" button (Apex only; disabled with tooltip for lower tiers)

**Document URL security:** Signed URLs are generated server-side (`/api/firms/document-url?candidateId=X&type=resume`) and never stored in the client. The firm's tier and the candidate's `dataConsent` are verified before the URL is returned.

### 6.3 Shortlist Management

- Firms maintain a personal shortlist scoped to their `firmId`.
- The shortlist page shows a table of starred candidates with their live rank and any notes added.
- **Convergence+ export:** Downloads an Excel file with columns: Rank, Handle, Name, University, Branch, Grad Year, Problems Solved, Note. Generated server-side via `exceljs`.

### 6.4 Talent Outreach ("Express Interest")

**Eligibility checks before firing the email:**
1. Firm tier is `apex`.
2. Candidate `dataConsent: true` AND `contactConsent: true`.
3. No duplicate: `firmInterest` collection has no prior document for this `(firmId, candidateId)` pair.

**Email content (Resend + React Email):**
- Branded AMS Derive header.
- Firm logo and name.
- "A Platinum Partner has viewed your performance in AMS Derive and is interested in connecting with you regarding opportunities."
- CTA button: "Learn More / Connect" — links to a landing page (not the firm's internal portal).
- One-click unsubscribe footer.

**Rate limit:** Maximum 20 "Interest" emails per firm per contest session to prevent bulk spamming.

---

## 7. API Design

All routes are under `/api/`. Every route runs through `authMiddleware` (session validation) before reaching the handler. Tier checks are applied per-route.

### Auth Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/request-link` | Validate email, issue magic token, send email |
| `GET` | `/api/auth/verify` | Consume token, create session, set cookie |
| `POST` | `/api/auth/logout` | Delete session document, clear cookie |
| `GET` | `/api/auth/me` | Return current firm profile + tier |

### Leaderboard Routes

| Method | Route | Tier | Description |
|---|---|---|---|
| `GET` | `/api/leaderboard/standings` | All | Merged CF + Firestore standings; respects consent masking |
| `GET` | `/api/leaderboard/meta` | All | Contest name, start time, duration, `cfApiStatus` |

### Firm / Recruitment Routes

| Method | Route | Tier | Description |
|---|---|---|---|
| `GET` | `/api/firms/candidate/:id` | Apex | Full candidate profile (consent-gated) |
| `GET` | `/api/firms/document-url` | Apex | Signed resume/transcript URL (5-min expiry) |
| `GET` | `/api/firms/shortlist` | Conv+ | Fetch firm's shortlist |
| `POST` | `/api/firms/shortlist` | Conv+ | Add candidate to shortlist |
| `DELETE` | `/api/firms/shortlist/:candidateId` | Conv+ | Remove from shortlist |
| `GET` | `/api/firms/shortlist/export` | Conv+ | Download Excel of shortlisted candidates |
| `POST` | `/api/firms/interest` | Apex | Trigger "Interested" outreach email |
| `GET` | `/api/firms/export/registrants` | Conv+ | Download full registrant CSV (no documents) |

### Structured Error Responses

```jsonc
// All errors follow this envelope
{
  "error": {
    "code": "INSUFFICIENT_TIER",      // Machine-readable code
    "message": "This feature requires a Convergence or Apex partnership tier.",
    "requiredTier": "convergence"
  }
}
```

---

## 8. Real-Time Architecture

60-second polling is a pragmatic baseline, but the following upgrade path should be planned:

### Current: Client-Side Polling (Phase 2)

```typescript
// In the leaderboard component
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/leaderboard/standings');
    const data = await res.json();
    setStandings(data.standings);
    setLastUpdated(data.fetchedAt);
  }, 60_000);
  return () => clearInterval(interval);
}, []);
```

### Upgrade: Server-Sent Events (Phase 4, optional)

A single `/api/leaderboard/stream` SSE endpoint that pushes diffs to all connected clients whenever the server-side cache refreshes. Reduces client requests from N firms × 60-second polling to 1 server fetch per 60 seconds, pushed to all.

**Decision trigger:** If more than ~20 firms are simultaneously connected, SSE becomes measurably better for Vercel function invocation count and CF API call efficiency.

---

## 9. Security Model

### What Never Touches the Client

| Secret | Storage |
|---|---|
| `CF_API_KEY` | Vercel Environment Variable (server-only) |
| `CF_API_SECRET` | Vercel Environment Variable (server-only) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel Environment Variable (server-only) |
| `RESEND_API_KEY` | Vercel Environment Variable (server-only) |
| Signed document URLs | Generated server-side, not stored; 5-min TTL |

### Session Security

- Cookies: `HttpOnly`, `Secure`, `SameSite=Strict`.
- Session tokens are random 256-bit values; not JWTs (no payload to tamper with).
- Server-side invalidation: Logout or admin revocation immediately deletes the session document, making the cookie useless even if stolen.

### Data Privacy

- The API never returns `email`, `phone`, or raw document URLs in list responses.
- Candidate data is masked by default; only `dataConsent: true` candidates have profile data populated.
- `contactConsent: false` candidates cannot receive outreach emails even if `dataConsent: true`.
- Document signed URLs expire in 5 minutes and can only be requested once per session (rate-limited server-side).

### Infrastructure

- All Firestore reads/writes from the portal go through Firebase Admin SDK (server-side only). Firestore client SDK is not used.
- Firebase Storage Security Rules deny all direct client reads of candidate documents.
- Vercel Edge Middleware validates the session cookie before any API handler runs, ensuring unauthenticated requests never reach business logic.

### Optional: IP Allowlisting (Apex Tier)

```typescript
// middleware.ts
if (firmTier === 'apex' && firm.allowedIpRanges?.length > 0) {
  const clientIp = request.headers.get('x-forwarded-for');
  if (!isIpAllowed(clientIp, firm.allowedIpRanges)) {
    return NextResponse.json({ error: 'IP not authorized' }, { status: 403 });
  }
}
```

---

## 10. Environments & Deployment

| Environment | Purpose | CF Contest | Firebase Project |
|---|---|---|---|
| `development` | Local dev | Use a public mock contest | `ams-derive-dev` |
| `staging` | Pre-launch QA | Private Gym (staging key) | `ams-derive-staging` |
| `production` | Live event | Live Private Gym | `ams-derive-prod` |

- All three environments have isolated Firestore projects to prevent test data contaminating production.
- Vercel Preview Deployments (per PR) use the `development` config.
- Environment variable promotion: `staging` env vars are reviewed and manually promoted to `production` by two team members before launch.

---

## 11. Implementation Roadmap

### Phase 1 — Auth Foundation
**Goal:** A firm can log in via magic link and see a placeholder dashboard.

- [ ] Create `firms` and `magicTokens` Firestore collections with seed data for 2–3 test firms
- [ ] Implement `POST /api/auth/request-link` with domain whitelist check
- [ ] Implement `GET /api/auth/verify` with token consumption and session creation
- [ ] Implement Edge Middleware session validation + firm context attachment
- [ ] Design magic link email template (Resend + React Email)
- [ ] Build login page UI (`/auth/login`)
- [ ] Build placeholder dashboard with firm name, tier badge, logout button

**Exit Criteria:** A whitelisted email receives a magic link, clicks it, and lands on the dashboard. An unknown email receives a generic "check your inbox" response with no information about whitelist status.

---

### Phase 2 — Codeforces Bridge & Leaderboard
**Goal:** Live, merged standings are visible in the portal.

- [ ] Implement server-side CF API signing utility
- [ ] Implement `fetchAndMergeStandings()` with Vercel KV caching
- [ ] Implement `GET /api/leaderboard/standings` with consent masking
- [ ] Implement `GET /api/leaderboard/meta` with `cfApiStatus`
- [ ] Build leaderboard table UI with rank, handle, name, university columns
- [ ] Add "last updated" timestamp and stale-data banner
- [ ] Add client-side 60-second polling with loading state
- [ ] Add filter panel: University Tier, Graduation Year, Min Problems Solved

**Exit Criteria:** All three tier levels can view live standings. Masking works correctly for non-consented candidates. If CF API goes down, stale data is served with a visible banner.

---

### Phase 3 — Recruitment Tools
**Goal:** Apex firms can discover, profile, and shortlist candidates.

- [ ] Implement `GET /api/firms/candidate/:id` with full consent checks
- [ ] Implement `GET /api/firms/document-url` with signed Firebase Storage URL generation
- [ ] Build candidate profile drawer component (slides in on row click)
- [ ] Embed PDF viewer for resume and transcript
- [ ] Implement shortlist API routes (GET, POST, DELETE)
- [ ] Build shortlist page UI
- [ ] Implement `GET /api/firms/shortlist/export` (Excel via `exceljs`)
- [ ] Implement `GET /api/firms/export/registrants` CSV for Convergence+
- [ ] Implement `POST /api/firms/interest` with all eligibility checks
- [ ] Build "Express Interest" email template

**Exit Criteria:** An Apex firm can click a candidate, view their resume, add them to a shortlist, and trigger an outreach email. A Convergence firm can shortlist and export but cannot view resumes or send interest emails. A Derivation firm sees only the leaderboard.

---

### Phase 4 — Polish, Branding & Hardening
**Goal:** Production-ready experience with the "Gold & Charcoal" aesthetic and full security review.

- [ ] Apply gold/charcoal design system across all pages (CSS token audit)
- [ ] Add rank-change delta indicators (▲/▼) on leaderboard rows
- [ ] Add micro-animations for new rank positions (CSS transition, not heavy JS)
- [ ] Admin route: `/admin/firms` — manage firms, tiers, active sessions (internal only)
- [ ] Admin route: `/admin/sessions` — view and revoke active firm sessions
- [ ] Rate-limit all API routes at the edge (Vercel Rate Limiting or Upstash)
- [ ] Add Sentry error tracking (server + client, PII scrubbing enabled)
- [ ] Security audit: check all routes for missing tier guards
- [ ] Load test: simulate 50 concurrent firm connections during a mock contest
- [ ] Write runbook: steps for the organizing team to set up a new contest
- [ ] Optional: Migrate leaderboard refresh to SSE

**Exit Criteria:** Full penetration-style review passes with no critical findings. Portal survives a 50-user load test without degradation. Design reviewed and signed off by team.

---

## 12. Monitoring & Observability

| Signal | Tool | Alert Threshold |
|---|---|---|
| CF API error rate | Sentry + custom metric | > 2 consecutive failures → Slack alert |
| Magic link delivery failure | Resend webhooks → Firestore log | Any failure → Slack alert |
| Session creation anomaly | Vercel Log Drains | > 10 sessions/min from one IP → review |
| API p95 latency | Vercel Analytics | > 2s p95 on `/api/leaderboard/standings` |
| Leaderboard cache miss rate | Custom KV metric | > 20% miss rate → investigate polling config |

**Log hygiene:** No candidate names, emails, or document URLs are written to logs. All log lines reference `firmId`, `candidateId` (opaque UUID), and `tier` only.

---

## 13. Open Questions & Decisions

| # | Question | Owner | Decision Required By |
|---|---|---|---|
| 1 | Should Codeforces handles be publicly visible on the leaderboard to Derivation-tier firms, or hidden behind consent? | Product | Phase 2 kickoff |
| 2 | What is the exact list of whitelisted firm domains at launch? | BD / Sponsorships | Phase 1 kickoff |
| 3 | Should firms be able to leave internal notes on candidates (not sent to student), beyond shortlist notes? | Product | Phase 3 kickoff |
| 4 | Is IP allowlisting for Apex partners a contractual commitment, or opt-in? | Legal / BD | Phase 4 kickoff |
| 5 | Does the "Express Interest" email link to the firm's Careers page, or to an AMS Derive-hosted landing page? | BD | Phase 3 kickoff |
| 6 | What data retention policy applies after the contest ends? When are firm sessions and candidate data purged? | Legal | Before launch |

---

*This document is maintained by the AMS Derive technical team. All decisions recorded in §13 should be resolved and logged as amendments to this document before each phase begins.*