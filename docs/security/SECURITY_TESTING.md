# Security Testing Guide

## Reproducible local checks

From the repository root:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run security:test
npm run security:semgrep
npm run security:gitleaks
npm run security:osv
npm run security:trivy
npm run security:sbom
npm run security:all
```

Install the scanner CLIs documented in `SECURITY_RUNBOOK.md` first. Missing tools cause the corresponding script to fail; this is not a clean scan. `npm run security:test` writes Vitest JSON to `security-reports/custom-security-test-results.json`. Other reports are written under `security-reports/`.

For local DAST, run the app using a dedicated QA database and dummy account, then run `npm run security:zap` and `npm run security:nuclei`. These scans target the local app by default. Remote targets require explicitly setting `FINTRACK_SECURITY_ALLOW_REMOTE=1` and must be owned/authorized. The ZAP command is a baseline (unauthenticated) scan; authenticated context scanning is not yet wired.

## Automated coverage

- `tests/api.test.ts`: transaction/budget/investment/goal/SIP ownership, export and AI context isolation, admin RBAC/self-demotion/last-admin rules, brute-force and export throttling, strict-schema mass assignment, amount/query validation, SQLi/XSS indicators, cookie security and session expiry/logout invalidation.
- `tests/security/runtime.test.ts`: cross-origin/missing-origin/content-type rejection, same-origin allowance, body-size limits, trusted-proxy IP handling, security headers/CSP.
- `tests/security/ai-security.test.ts`: provider-stub tests for prompt injection, system-prompt extraction, tool abuse, cross-user data, and secret extraction; verifies the outgoing request omits descriptions/notes and tools.
- `tests/api.test.ts`: dashboard period validation and opt-in sample history isolation, idempotence, and non-destructive behavior.
- `e2e/fintrack.spec.ts`: functional journey plus hostile transaction text rendered as text rather than active HTML.

## Scope and limitations

The current run passes 37 security tests across 3 files; the isolated production-mode Playwright journey passes 2 browser tests, including transaction persistence across reload, navigation, logout, and login. These tests do not prove security against all payloads or deployed configurations. Login throttles are in-memory. Cookie Origin checks are defense in depth, not an API authentication substitute. The AI tests validate request construction and a stub response, not behavior of a live model. Review new routes for auth, role/ownership scope, validation, output minimization, and audit events. Verify deployed headers/TLS and rerun scans against the release image.
