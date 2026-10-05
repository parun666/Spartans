# FinTrack — Your money. Your insights. Your privacy.

Build Secure 24 (Abhedya, VBIT) — Team Spartans 03A.

A complete, secure, local-first personal finance tracker.

## Stack (fixed)

- **Next.js 14** App Router + **TypeScript**
- **Tailwind CSS** + shadcn-style UI components (`src/components/ui`)
- **Prisma** + **SQLite** (file DB, zero setup; schema is Postgres-compatible — switch the datasource provider to `postgresql` to migrate)
- **Zod** validation on every mutation
- **Recharts** dashboards & reports
- **Vitest** unit/API tests + **Playwright** E2E
- **bcryptjs** password hashing
- **jose** JWT session in HttpOnly SameSite=Lax cookie (never localStorage)
- **TanStack Query** for refetch/invalidation
- Money stored as **INTEGER PAISE**, formatted with `Intl` en-IN as ₹1,25,000.00

## Quick start (clean clone)

```bash
npm install
cp .env.example .env
npm run setup    # prisma migrate dev + seed
npm run dev      # http://localhost:3000
```

Seed accounts:

| Role | Email | Password |
|---|---|---|
| Demo user | demo@fintrack.dev | Demo@12345 |
| Admin | admin@fintrack.dev | Admin@12345 |

## Quality gates

```bash
npm run typecheck && npm run lint && npm test
npm run test:e2e   # Playwright (needs: npx playwright install chromium)
```

## Features by route

| Route | Purpose |
|---|---|
| `/login`, `/register` | Auth (login rate-limited 5/5min) |
| `/dashboard` | Income, expense, balance, savings rate, charts, recent activity, ↻ Refresh |
| `/transactions` | Add/edit/delete modal w/ confirm, search, filters, sort, pagination in URL, Clear Filters |
| `/budgets` | Budget limits per category per month, derived usage, warnings at 80% and 100% |
| `/investments` | P/L and return %, "Market data unavailable — showing user-entered valuation." |
| `/sips` | SIP planner (projected FV, month-by-month schedule), saved SIPs |
| `/goals` | Remaining, % complete, estimated completion |
| `/reports` | Monthly/category/income/expense/budget/investment reports + CSV/JSON export |
| `/ai` | Server-side AI tools only; rule-based fallback when no key/provider fails |
| `/security` | Implemented controls list + your audit activity |
| `/admin` | User/transaction counts, roles, enable/disable (counts only, no financial contents) |
| `/settings` | Profile, change password, export my data, delete account (cascade + password confirm) |

## API overview

- `POST /api/auth/register|login|logout|change-password`, `GET /api/auth/me`
- `GET/PUT /api/profile`
- `GET/POST /api/transactions`, `PUT/DELETE /api/transactions/[id]`
- `GET/POST /api/categories`, `DELETE /api/categories/[id]`
- `GET/POST /api/budgets`
- `GET/POST /api/investments`, `PUT/DELETE /api/investments/[id]`
- `GET/POST /api/sips`, `DELETE /api/sips/[id]`
- `GET/POST /api/goals`, `PUT/DELETE /api/goals/[id]`
- `GET /api/dashboard`, `GET /api/reports?type=…`, `GET /api/export?format=csv|json`
- `GET/PUT/DELETE /api/ai/config`, `POST /api/ai/chat`
- `GET /api/admin/overview`, `GET /api/admin/users`, `PATCH /api/admin/users/[id]`
- `GET /api/activity`, `DELETE /api/account`

## Security controls

- bcrypt password hashing; JWT (HS256, 7d) in HttpOnly SameSite=Lax cookie
- Server-side session records; logout deletes the session; disabling a user kills sessions
- Login rate limiting; Zod validation; parameterised Prisma queries
- `requireUser()`/`requireRole()` on every route + ownership filter (`userId`) on every query (BOLA-tested)
- AI key AES-256-GCM encrypted, masked in UI, replaceable/deletable
- Security headers (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy)
- Audit log of auth/mutation events without secrets or request bodies
- Export contains only the current user's data — no password hashes, sessions, or AI keys

## What reaches the AI

Only minimal aggregates from the current user: monthly income/expense totals, savings rate, top expense categories, budget status, investment totals, goal progress, and the 5 most recent transaction summaries (description, category, amount, date). No emails of other users, no password hashes, no sessions, no API keys, no raw DB access, no SQL/shell/env from the model.

## Actual vs projected

- **Actual:** all transactions, budgets, balances, goal progress, investment valuations as entered by the user.
- **Projected (labelled "Estimated"/"Projected"):** SIP future values from the standard formula `FV = P·(((1+r)^n − 1)/r)·(1+r)`, r = annual/12/100, n = years×12 (r=0 → P·n), and goal estimated completion dates. SIP figures are kept visually separate from real balances.

## Testing

- `tests/finance.test.ts` — SIP (incl. ₹5,000 @12%/10y → ₹6,00,000 invested), investment return (+12%, loss, equal, invested=0, validation), savings rate with income=0, money formatting.
- `tests/api.test.ts` — BOLA with USER_A/USER_B across transactions, budgets, investments, goals, export, AI context; RBAC on admin; login rate limit; validation.
- `e2e/fintrack.spec.ts` — full journey register → … → persistence, plus mobile viewport.

## Known limitations

- SQLite is single-node; switch datasource to `postgresql` for production scale.
- In-memory login rate limiter resets on server restart (single instance).
- Recharts 2.x deprecation warning; upgrade to v3 after migration review.
- AI provider is OpenAI-compatible only; fails closed to a rule-based summary.
- Playwright E2E requires `npx playwright install chromium`.
