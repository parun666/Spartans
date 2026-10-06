# FinTrack Security Defense — Short Answers

Answer from the current code and reports only. Do not imply a control was production-tested when it was not.

1. **How do you prevent IDOR?** Handlers take identity from the server-verified session and scope object reads/writes by that user. Cross-user API tests assert denial or not-found.
2. **How do you prevent SQL injection?** Prisma parameterizes database operations; strict input schemas reject malformed values. Injection-indicator tests verify safe handling.
3. **How are passwords protected?** Passwords are hashed with bcrypt; the API never returns hashes or logs submitted passwords.
4. **Why HttpOnly cookies?** Client-side JavaScript cannot read the session cookie, reducing token theft through XSS. Cookies are SameSite=Lax and Secure in production.
5. **How does rate limiting work?** Process-local limits protect login/registration and sensitive endpoints; login also uses progressive account lockout. It is not distributed and must be supplemented at ingress for multiple instances.
6. **How do you protect against CSRF?** State-changing API requests require matching Origin/Host and JSON content type; SameSite cookies provide another layer. This is not a substitute for deployment testing.
7. **How do you protect against XSS?** React renders user text as text; untrusted content is not intentionally inserted as HTML. CSP is configured but retains `unsafe-inline` compatibility, so it is not a strict nonce-based policy.
8. **Why restrict CORS?** Authenticated APIs should not grant arbitrary origins access. The application does not configure wildcard CORS.
9. **How are AI API keys protected?** User-configured provider keys are encrypted at rest using a server secret, masked on reads, and never intentionally logged or returned raw.
10. **How do you defend against prompt injection?** Context is minimized and descriptions/notes are omitted; the provider is not given database, shell, filesystem, admin, or arbitrary network tools. Stubbed tests exercise hostile prompt attempts; they do not prove live-model behavior.
11. **Can the AI access the database directly?** No. Server code constructs user-scoped context; the model has no direct database connection or arbitrary SQL tool.
12. **How do you isolate users?** The authenticated session determines user identity and Prisma operations filter by ownership. Tests exercise cross-user object IDs and exports.
13. **How do Semgrep and ZAP differ?** Semgrep analyzes source patterns statically; ZAP probes a running authorized web application. ZAP was not run in this environment.
14. **What does OSV-Scanner detect?** Known vulnerabilities matched to package versions in supported manifests/lockfiles; this run found none in the scanned lockfile.
15. **What does Trivy detect?** Vulnerable packages and configuration issues within its scan scope. Filesystem/config scans ran; the container image scan did not.
16. **What does Nuclei detect?** Template-matched exposures and web misconfigurations on an authorized target. It was not run here.
17. **Why an SBOM?** It inventories component names/versions to support vulnerability impact and dependency response; it is not itself a clean bill of health.
18. **What does STRIDE identify?** Spoofing, tampering, repudiation, information disclosure, denial of service, and elevation-of-privilege threats, with controls and residual risks.
19. **What happens if a critical dependency issue is found?** Verify reachability and impact, prioritize remediation, update the dependency, run regression tests, and re-scan before release; do not suppress it merely to get a clean report.
20. **What if the AI provider is unavailable?** AI-dependent behavior should fail safely; the app's financial data operations do not depend on provider success.
21. **What if an attacker modifies an object ID?** Ownership-scoped queries should return denial/not-found rather than another user's data; the security suite exercises this.
22. **What happens after repeated failed logins?** Account-keyed progressive lockout and configured process-local request throttling apply; limits are not shared across instances.
23. **What is recorded in audit logs?** Security-relevant action and actor metadata, with limited request metadata; audit writes are local and not immutable.
24. **What is deliberately not logged?** Passwords, tokens, cookies, API keys, encryption keys, and full request bodies containing financial data.

## Claims not to make

- Do not claim Docker image, ZAP, or Nuclei passed; they were not run because Docker was unavailable.
- Do not call the application middleware a commercial RASP/WAF or claim IAST coverage.
- Do not call process-local throttling distributed protection.
- Do not claim 40–45/50 has been demonstrated; see `SECURITY_SCORECARD.md`.
