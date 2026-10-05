# Runtime Application Self-Protection

## Status and implementation

FinTrack implements limited in-process runtime request guards; this is not a commercial RASP product:

- `src/middleware.ts` requires a same-origin Origin/Host and JSON content type on state-changing API methods and rejects declared API bodies over 32 KiB.
- `src/lib/api.ts` also bounds streamed JSON bodies to 32 KiB, including requests without a trustworthy Content-Length.
- Login always has an in-memory account-keyed progressive lockout. Login/registration IP throttles only activate when `TRUST_PROXY=true`; only enable this behind an ingress that overwrites forwarding headers.
- API handlers use authentication, server-side role checks, ownership filters, Zod schemas, and generic internal-error responses.

The focused checks are in `tests/security/runtime.test.ts` and `tests/api.test.ts`, runnable with `npm run security:test`.

## Limitations

Throttles are per-process and reset on restart. Without a trusted ingress, IP-specific login/registration limits are disabled rather than trusting spoofable headers. No general anomaly detector, distributed limiter, WAF, SQL firewall, or commercial RASP agent is deployed. Configure equivalent edge controls before public deployment; do not describe these code-level guards as a WAF or full RASP.
