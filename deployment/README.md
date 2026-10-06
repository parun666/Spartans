# Vercel deployment

FinTrack uses SQLite for local development and a PostgreSQL schema for Vercel. Vercel Functions do not provide a durable local SQLite file; use Neon PostgreSQL for production persistence.

## One-time setup

1. Create a Neon PostgreSQL project and database.
2. Import this GitHub repository into Vercel as a Next.js project. The checked-in `vercel.json` selects `npm run build:vercel`.
3. In Vercel project settings, configure these Production environment variables (and Preview only if using a separate preview database):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_URL` | Neon direct/unpooled connection string |
   | `JWT_SECRET` | Unique random value, at least 32 characters |
   | `AI_KEY_SECRET` | Different unique random value, at least 32 characters |

   Never commit these values or paste them into source files. `TRUST_PROXY` is optional and defaults to disabled.
4. Apply the PostgreSQL migrations once, from a trusted local terminal with `DATABASE_URL` and `DIRECT_URL` set to the Neon values:

   ```bash
   npm run vercel:migrate
   ```

5. Deploy from Vercel's Git integration or run `vercel deploy --prod` after linking the repository with the Vercel CLI.

## Local verification

```bash
npm ci
npm run build:vercel
```

The regular `npm run build`, local development server, and tests continue to use the SQLite schema. `npm run build:vercel` generates the Prisma client for PostgreSQL before compiling Next.js.

## Data and deployment notes

- Neon starts as a separate empty production database. Existing local SQLite records are not automatically copied; export/import or a reviewed migration is needed if they must be retained.
- Use separate Neon databases for Production and Preview. Do not point Preview deployments at live financial data.
- No live URL is recorded until Vercel deployment has actually succeeded.
