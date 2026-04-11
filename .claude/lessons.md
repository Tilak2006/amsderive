# Lessons & Mistakes — AMS Derive

Self-updating file. Claude appends a bullet any time a mistake is caught and fixed during development.
Short, actionable, past-tense. Format: `- [area] what went wrong → what to do instead`

---

## Data / Firestore

- **[ambassador leaderboard]** `institutionData` was built only from `tableData` (which contains pre-reg counts) — institutions with 0 pre-regs were invisible in the admin offset table. Fix: seed from the full `AMBASSADOR_REF_MAP` first, then fill in actual counts.

- **[ambassador offsets]** Used `.set(data)` without `{ merge: true }` when writing a single institution offset — would have wiped the entire `ambassador-offsets` doc. Always use `set({ [key]: val }, { merge: true })` for partial updates to a shared document.

- **[Firestore field projection]** Fetched full `pre_registrations` documents when only `refCode` was needed. Use `.select('refCode')` to cut document read size and cost.

- **[parallel Firestore reads]** Awaited `stats/ambassador-offsets` read after the pagination loop completed, wasting latency. Start the offset `Promise` before the loop so it runs in parallel.

- **[Timestamp serialization]** Firestore `Timestamp` objects can't be JSON-serialized directly. Always call `.toDate().toISOString()` before including in API responses. Raw Timestamps sent to the client silently become `null` or throw.

---

## API Design

- **[institution whitelist]** `update-ambassador-offset.js` originally validated institution names against `VALID_INSTITUTIONS` (from `AMBASSADOR_REF_MAP`) — blocked admin from adding custom institutions. Remove strict enum validation on admin-only mutation endpoints — validate format/length instead.

- **[leaderboard custom institutions]** Public leaderboard only showed institutions present in `instMap` (from actual pre-regs). Institutions set only via admin offset (no pre-regs yet) were silently excluded. Merge `Object.keys(instMap)` with `Object.keys(offsets)` before building response.

- **[query param security]** Public GET endpoints that accept no input should reject requests with query parameters (`Object.keys(req.query).length > 0 → 400`) to prevent cache-poisoning vectors.

- **[firm API field leakage]** `/api/firm/get-registrants` originally returned only `fullName, university, round, codeforcesHandle`. After adding resume/linkedin support, access flags must gate those fields server-side — never rely on client to omit them. The API must check `firmData.access.resumeDownload` and `firmData.access.linkedinAccess` before including those fields in the response map.

---

## Firebase Storage / Signed URLs

- **[signed URL path pollution]** Firebase Storage download URLs have the form `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?alt=media`. The `get-signed-url` handler extracted the path using `urlObj.pathname.match(/\/o\/(.+)$/)` — the greedy `.+` captured everything including `?alt=media` as part of the pathname (because `?` only ends the pathname in the URL object if it's actually a query char). `decodeURIComponent` then produced `registrants/filename.pdf?alt=media`, which GCS couldn't find. Fix: strip query string from the captured group before decoding — `.split('?')[0]`.

- **[stale Firestore URL]** If a user submits the form twice (first upload succeeds, Firestore write times out, user retries creating a new timestamp), the URL in Firestore can reference a file that doesn't exist in Storage. The signed URL endpoint will return 500. Admin `handleViewFile` now shows an `alert()` with guidance to fix the doc manually. This is a data issue, not a code bug — fix by updating `resumeUrl` in the Firestore document.

---

## Frontend

- **[multi-ambassador aggregation]** Institutions like IIT BHU have two codes (`d26-iitbhu-82c6` = "IIT BHU" and `d26-iitbhu-4586` = "IIT BHU (Ambassador 2)"). Without normalization they appear as two separate rows. Always apply `normalizeInstitution()` — strips ` (Ambassador N)` suffix — before grouping or displaying.

- **[conditional render hiding data]** Wrapped the leaderboard offset section in `{institutionData.length > 0 && ...}` — hid it entirely when no pre-regs existed yet. Admin needs to set offsets before signups. Remove the condition or seed from full `AMBASSADOR_REF_MAP`.

- **[splitLayout flex]** When adding a side detail panel next to a table, wrap both in a flex container with `className={selectedItem ? styles.splitLayout : undefined}`. The panel gets `align-self: stretch` so it fills the table height. The table section gets `flex: 1; min-width: 0` to prevent overflow.

---

## Configuration / Docs

- **[stale email provider]** CLAUDE.md and project-struct still listed Brevo as the email provider after switching to Resend. Keep docs in sync with env vars — if `RESEND_API_KEY` is active, Brevo references are dead weight.

- **[cap inconsistency]** Registration cap was documented as 2500 in one place and 3000 in another. The API enforces 3000 — keep all references consistent.

- **[outdated skill structure]** Project-struct SKILL.md listed a minimal file structure while the actual project had grown significantly. Update all three docs (CLAUDE.md, routes.md, lessons.md, project-struct SKILL.md) whenever new pages or API routes are added — they're all loaded as context.

- **[firm portal route gap]** `routes.md` listed only `get-firm-profile` and `get-finalists` under firm API endpoints — `get-registrants`, `get-leaderboard`, and `get-signed-url` were missing. Always add new API files to routes.md immediately.
