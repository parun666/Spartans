# Initial Security Assessment

**Assessment date:** 2026-10-06  
**Scope:** Existing FinTrack repository and current worktree before this turn's security remediation.  
**Status:** Baseline assessment; scanner results are not implied by this document.

## Application and repository baseline

FinTrack is a Next.js 15 application using React, Prisma, SQLite, Zod, bcrypt, and signed cookie-backed sessions. The working tree already contains a substantial, uncommitted security-hardening effort; this assessment treats those changes as part of the baseline and does not attribute them to this turn. The source tree includes authenticated finance pages and API routes for transactions, budgets, goals, investments, SIPs, reports, exports, admin users, and AI configuration/chat. The AI page was removed in the preceding logged change, while API routes remain.

The architecture note in `docs/APPROACH.md` still describes an earlier static, localStorage-only implementation. It does not match the current Next.js/API/Prisma architecture and should be reconciled with the deployed code.

## Existing controls observed

- Passwords are hashed with bcrypt; signed sessions are backed by database session records and are checked for expiry and account state.
- Session cookies are HttpOnly and SameSite=Lax, with Secure enabled in production. Production startup validates JWT and AI-key encryption secrets.
- User-scoped record handlers and export code derive identity from the authenticated session and scope records to the current user. Admin user changes require the ADMIN role.
- Zod-based request validation and bounded JSON parsing are present. Middleware limits declared request body sizes and rejects mutating requests with a mismatched Origin.
- Trusted proxy headers are ignored unless explicitly enabled; AI keys are encrypted at rest, and the reviewed AI boundary has no model-accessible database, shell, filesystem, admin, or arbitrary-HTTP tools.
- Security headers, container hardening, a CI security workflow, scan runner scripts, security tests, threat model, security architecture, vulnerability management, SBOM, IAST/RASP notes, scorecard, and runbook exist in the current worktree.
- A read-only review of the changed security-sensitive code found no confirmed high-confidence exploitable vulnerability. This is not a full independent audit or a scanner result.

## Confirmed issues and important limitations

No confirmed exploitable vulnerability was established in the reviewed worktree. The following gaps remain material:

1. The custom suite is not currently green: `npm run security:test` ran 7 tests successfully, but the API test suite's `beforeAll` timed out after 60 seconds and skipped its 13 tests. Therefore those skipped tests do not establish that BOLA, RBAC, persistence, export, or AI ownership cases pass in this run.
2. Direct middleware unit tests do not prove middleware coverage in the deployed Next.js routing setup. Mutating requests without an Origin are allowed; this is a defense-in-depth and test-coverage gap, not a confirmed exploit in this review.
3. The current CSP allows `unsafe-inline` and `unsafe-eval`, reducing its XSS defense value.
4. The AI prompt-injection/cross-user behavior has no dedicated provider-isolated security test evidence.
5. `docs/APPROACH.md` is stale and conflicts with the current server-backed architecture.
6. Current security reports include an SBOM and npm audit output, but not verified Semgrep, Gitleaks, OSV-Scanner, Trivy, ZAP, or Nuclei results. The corresponding scanner executables and Docker were not found in this environment during the baseline check.
7. The read-only reviewer did not independently audit every transitive dependency change in the lockfile or execute builds, scans, or DAST. No scan is considered passed based on configuration alone.
8. The worktree was already dirty before this turn, including application, tooling, documentation, report, and test changes. Those changes must be preserved and are not treated as authored by this turn.

## Baseline verification

| Check | Result |
|---|---|
| TypeScript typecheck (`npm run typecheck`) | Passed |
| ESLint (`npm run lint`) | Passed |
| Custom/API security tests (`npm run security:test`) | 7 passed; 13 API tests skipped after a `beforeAll` timeout |
| Semgrep, Gitleaks, OSV-Scanner, Trivy, Nuclei, ZAP, Docker executables | Not found in PATH |
| Independent source review | No confirmed high-confidence exploitable finding; scope and limitations listed above |

## Remediation plan

1. Preserve all existing worktree changes and fix the API-test setup timeout so the ownership and authentication tests actually execute.
2. Verify the real app lifecycle for transaction persistence across reload, navigation, logout, and login; remove any reload-triggered demo reset behavior.
3. Close coverage gaps with security tests for ownership on all finance objects, mass assignment, malformed/oversized input, auth throttling/session invalidation, CORS/CSRF, headers, and AI prompt injection/cross-user isolation.
4. Verify application-level security controls at the Next.js request boundary, tighten CSRF/Origin behavior without breaking supported clients, and reduce CSP allowances where the app can support it.
5. Run only available scanners against this repository and an isolated local QA target; record exact commands, versions, results, and unavailable-tool reasons without manufacturing report files or results.
6. Reconcile architecture and scorecard documentation with verified source behavior and run evidence. Do not mark a scanner or control PASS without executed, reviewable evidence.
