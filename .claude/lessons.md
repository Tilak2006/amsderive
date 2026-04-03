# Lessons & Mistakes — AMS Derive

Self-updating file. Claude appends a bullet any time a mistake is caught and fixed during development.
Short, actionable, past-tense. Format: `- [area] what went wrong → what to do instead`

---

## Data / Firestore

- **[ambassador leaderboard]** `institutionData` was built only from `tableData` (which contains pre-reg counts) — institutions with 0 pre-regs (e.g. IIT Bombay before any signups) were invisible in the admin offset table. Fix: seed from the full `AMBASSADOR_REF_MAP` first, then fill in actual counts.

- **[ambassador offsets]** Used `.set(data)` without `{ merge: true }` when writing a single institution offset — would have wiped the entire `ambassador-offsets` doc. Always use `set({ [key]: val }, { merge: true })` for partial updates to a shared document.

- **[Firestore field projection]** Fetched full pre_registration documents when only `refCode` was needed. Use `.select('refCode')` to cut document read size and cost.

- **[parallel Firestore reads]** Awaited `stats/ambassador-offsets` read after the pagination loop completed, wasting latency. Start the offset `Promise` before the loop so it runs in parallel with pagination.

---

## API Design

- **[institution whitelist]** `update-ambassador-offset.js` validated that institution names must be in `VALID_INSTITUTIONS` (derived from `AMBASSADOR_REF_MAP`). This blocked the admin from adding custom institutions. Remove strict enum validation on admin-only mutation endpoints — validate format/length instead.

- **[leaderboard custom institutions]** Public leaderboard only showed institutions present in `instMap` (from actual pre-regs). Institutions set only via admin offset (no pre-regs yet) were silently excluded. Merge `Object.keys(instMap)` with `Object.keys(offsets)` before building the response.

- **[query params security]** Public GET endpoints that accept no input should explicitly reject requests with query parameters (`Object.keys(req.query).length > 0 → 400`) to prevent cache-poisoning vectors.

---

## Frontend

- **[multi-ambassador aggregation]** Institutions like IIT BHU have two codes (`d26-iitbhu-82c6` = "IIT BHU" and `d26-iitbhu-4586` = "IIT BHU (Ambassador 2)"). Without normalization they appear as two separate rows. Always apply `normalizeInstitution()` — strips ` (Ambassador N)` suffix — before grouping or displaying.

- **[conditional render hiding data]** Wrapped the leaderboard offset section in `{institutionData.length > 0 && ...}` which hid it entirely when no pre-regs existed yet. Admin needs to set offsets before signups. Remove condition or seed from full AMBASSADOR_REF_MAP.

---

## Configuration / Docs

- **[stale email provider]** CLAUDE.md and project-struct still listed Brevo as the email provider after switching to Resend. Keep docs in sync with env vars — if `RESEND_API_KEY` is active, Brevo references are dead weight.

- **[cap inconsistency]** Registration cap was documented as 2500 in one place and 3000 in another. The API enforces 3000 — keep all references consistent.

- **[outdated SKILL.md structure]** Project-struct SKILL.md listed the original minimal file structure (`pages/index.js`, `api/get-ip.js` only) while the actual project had grown to include admin routes, firm portal, ambassador system, and leaderboards. Update SKILL.md whenever new pages or API routes are added.
