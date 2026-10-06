# FinTrack Security Demonstration

Use only the local application, fictional accounts, and a disposable QA database. Do not run tests against production or third-party systems. This guide distinguishes verified demonstrations from environment-dependent steps.

## Before the demo

1. Set distinct 32+ character `JWT_SECRET` and `AI_KEY_SECRET` values in the local environment; never display or record the values.
2. Start the application with a disposable SQLite database and register fictional USER_A and USER_B accounts. Configure a fictional admin only through the non-production seed environment variables if needed.
3. Run `npm run security:test`; show the actual summary and `security-reports/custom-security-test-results.json`.
4. Ensure no real financial information is in the database or terminal output.

## 5–10 minute sequence

1. **Input validation and money bounds:** submit an invalid/negative or oversized transaction amount. Show the safe validation response and relevant test.
2. **Dashboard periods and sample history:** switch among 1, 3, 6, and 12 months. Confirm adding fictional sample records, then show the selected period analysis. Explain the per-user deterministic upserts and that existing records are never overwritten or deleted.
3. **Authentication:** submit repeated invalid logins and show the throttled response. Explain that limits are process-local and reset with the process.
4. **BOLA/IDOR:** authenticate as USER_A, then request USER_B's transaction/budget/investment/goal/SIP identifier. Show denial/not-found in the test results; do not rely on a manually edited browser URL alone.
5. **Persistence:** run the isolated Playwright journey and show that transaction data remains after page reload, navigation, logout, and login. Explain that it uses a separate QA database.
6. **Role and mass assignment:** as a regular user, attempt an admin-only action or submit a `role`/`userId` field. Show rejection and the corresponding regression test.
7. **CSRF and browser headers:** show foreign-Origin mutation rejection and the configured response headers/tests. Explain CSP's remaining `unsafe-inline` compatibility limitation.
8. **AI boundary:** feed a fictional malicious instruction as prompt content. Show that the context builder omits transaction descriptions/notes and that the stubbed test does not authorize extra tools or cross-user data. Clearly state no live-model security run was done.
9. **Secret/dependency evidence:** show `security-reports/gitleaks.json`, `osv.json`, and `npm-audit.json`; discuss scanner scope and the append-only historical demo text noted in the vulnerability register.
10. **Static/config scan and SBOM:** show Semgrep JSON/SARIF, Trivy filesystem/config reports, and the CycloneDX SBOM.
11. **DAST limitation:** state plainly that Docker was unavailable, so no Trivy image scan, QA compose run, ZAP, or Nuclei was performed. Do not present placeholder reports as evidence.

## Repeatable commands

```sh
npm run security:test
npm run security:semgrep
npm run security:gitleaks
npm run security:osv
npm run security:trivy
npm run security:sbom
```

Run Docker-dependent DAST only after reviewing `SECURITY_RUNBOOK.md`, starting the dedicated local QA app, and confirming all targets resolve only to loopback. The current repository state has no completed DAST evidence.
