# FinTrack — Your money. Your insights. Your privacy.

Build Secure 24 (Abhedya, VBIT) — Team Spartans 03A.

A complete, secure, local-first personal finance tracker.

## Stack (fixed)

- **Next.js 15.5** App Router + **TypeScript**
- **Tailwind CSS** + shadcn-style UI components (`src/components/ui`)
- **Prisma** + **SQLite** for local development/tests; **PostgreSQL (Neon)** for durable Vercel serverless production storage
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

## Deploy to Vercel

Vercel runs Next.js as serverless functions. Do not use the local SQLite database in production: its file is not durable or shared across function instances. Create a Neon PostgreSQL database and import this repository into Vercel. The checked-in `vercel.json` identifies the project as Next.js and runs `npm run build:vercel`; this generates the PostgreSQL Prisma client, applies checked-in migrations through `DIRECT_URL`, and runs `next build`. The app uses Next.js's normal serverless output (no static export and no standalone output mode).

Set these variables for the Vercel **Production** environment (and separately configure Preview only with a separate non-production database):

| Variable | Production value |
|---|---|
| `DATABASE_URL` | Neon pooled PostgreSQL connection URL |
| `DIRECT_URL` | Direct/unpooled connection URL for the same Neon database |
| `JWT_SECRET` | Unique random secret, at least 32 characters |
| `AI_KEY_SECRET` | A different unique random secret, at least 32 characters |

Generate the two application secrets independently; never commit them or send them in chat. Vercel environment-variable changes apply only to new deployments, so redeploy after saving them. `npm run build` remains the standard local build (`prisma generate && next build`) and uses the SQLite URL in `.env`. See [deployment/README.md](deployment/README.md) for the detailed setup and database notes.

Optional fictional seed accounts are created only outside production when `DEMO_USER_PASSWORD` and/or `DEMO_ADMIN_PASSWORD` are supplied in the environment before `npm run setup`. No demo accounts are created by default; never use these variables in production.

## Quality gates

```bash
npm run typecheck && npm run lint && npm test
npm run test:e2e   # Playwright (needs: npx playwright install chromium)
```

## Features by route

| Route | Purpose |
|---|---|
| `/login`, `/register` | Auth (login rate-limited 5/5min) |
| `/dashboard` | Income, expense, balance, savings rate, 1/3/6/12-month analytics, recent activity, optional additive sample history |
| `/transactions` | Add/edit/delete modal w/ confirm, search, filters, sort, pagination in URL, Clear Filters |
| `/budgets` | Budget limits per category per month, derived usage, warnings at 80% and 100% |
| `/investments` | P/L and return %, "Market data unavailable — showing user-entered valuation." |
| `/sips` | SIP planner (projected FV, month-by-month schedule), saved SIPs |
| `/goals` | Remaining, % complete, estimated completion |
| `/reports` | Monthly/category/income/expense/budget/investment reports + CSV/JSON export |
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
- `GET /api/dashboard?months=1|3|6|12`, `POST /api/demo/sample-data` (authenticated, explicit opt-in, additive), `GET /api/reports?type=…`, `GET /api/export?format=csv|json`
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

## Dashboard history and sample data

Choose a 1-month, 3-month, 6-month, or 1-year range for transaction trends, totals, category analysis, and recent activity. Budget use and investment allocation remain current snapshots. “Add sample data” requires an explicit confirmation and adds clearly labeled fictional data only for the signed-in account; deterministic IDs make repeat requests idempotent, and existing records are never deleted or overwritten. Do not use sample records as real financial information.

## What reaches the AI

Only minimized aggregates and category/budget/investment/goal summaries from the authenticated user are sent when that user configures a provider. Free-text transaction descriptions and notes are excluded. The model has no database, arbitrary SQL, shell, filesystem, environment, admin, or arbitrary HTTP tools. No emails of other users, password hashes, sessions, API keys, or encryption keys are sent.

## Actual vs projected

- **Actual:** all transactions, budgets, balances, goal progress, investment valuations as entered by the user.
- **Projected (labelled "Estimated"/"Projected"):** SIP future values from the standard formula `FV = P·(((1+r)^n − 1)/r)·(1+r)`, r = annual/12/100, n = years×12 (r=0 → P·n), and goal estimated completion dates. SIP figures are kept visually separate from real balances.

## Testing

- `tests/finance.test.ts` — SIP (incl. ₹5,000 @12%/10y → ₹6,00,000 invested), investment return (+12%, loss, equal, invested=0, validation), savings rate with income=0, money formatting.
- `tests/api.test.ts` — BOLA with USER_A/USER_B across transactions, budgets, investments, goals, export, AI context; RBAC on admin; login rate limit; validation.
- `e2e/fintrack.spec.ts` — full journey register → … → persistence, plus mobile viewport.

## Known limitations

- Vercel production data is stored in the configured Neon PostgreSQL database; local SQLite data is not copied automatically.
- In-memory login rate limiter resets on server restart (single instance).
- Recharts 2.x deprecation warning; upgrade to v3 after migration review.
- AI provider is OpenAI-compatible only; fails closed to a rule-based summary.
- Playwright E2E requires `npx playwright install chromium`.
