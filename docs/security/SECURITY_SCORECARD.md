# FinTrack Security Scorecard

Evidence snapshot: 2026-10-06. Status is limited to artifacts and commands recorded in this repository; configuration alone is not a passing scan. Estimated points are an engineering estimate, not a judge result or security guarantee.

| Criterion | Max | Evidence in this revision | Status | Estimated |
|---|---:|---|---|---:|
| Semgrep | 5 | Semgrep 1.179.0; JSON/SARIF rerun has 0 findings after replacing the toast `Math.random()` identifier | PASS | 5 |
| Gitleaks | 3 | Gitleaks 8.30.1; history and working-tree scans report 0 findings after excluding generated `.venv/`; historical demo values remain in append-only logs | PARTIAL | 2 |
| OSV-Scanner | 3 | OSV-Scanner 2.6.0 scanned 377 lockfile packages; 0 vulnerabilities reported | PASS | 3 |
| Trivy | 2 | Trivy 0.75.0 filesystem/configuration reports; 0 findings in configured HIGH/CRITICAL scope; image not scanned | PARTIAL | 1 |
| OWASP ZAP | 5 | Not run: Docker unavailable; no DAST report | NOT RUN | 0 |
| Nuclei | 3 | Not run: Docker unavailable; no scan report | NOT RUN | 0 |
| Custom security tests | 7 | `npm run security:test`; 34 passing tests across API, runtime, and AI test files | PARTIAL | 6 |
| AI security tests | 2 | Stubbed-provider tests cover injection/extraction/tool-abuse/cross-user/secret attempts; no live model test | PARTIAL | 1 |
| Security architecture & design | 5 | STRIDE, trust boundaries, data flow, security architecture and residual risks documented | PARTIAL | 4 |
| Security implementation quality | 5 | Secrets, sessions, rate limits, ownership, strict validation, CSRF-origin checks, headers, AI minimization; deployment not production-verified | PARTIAL | 3 |
| Effectiveness of controls | 5 | Automated security regression plus isolated production-mode browser journey; live deployment behavior still requires verification | PARTIAL | 4 |
| Security testing & vulnerability handling | 3 | Semgrep finding fixed and rescanned; initial scan issues triaged; limitations recorded | PARTIAL | 2 |
| Technical explanation & defense | 2 | Judge Q&A and reproducible demo guide document verified controls and unrun scans | PARTIAL | 1 |
| **Evidence-based estimate** | **50** | **Scoring is subjective; unavailable DAST and image scans are not credited.** | **Not a certification** | **32** |

The estimated 32/50 is a conservative evidence-based estimate, not a promised score. The explicit 40–45 target is not substantiated by this run because ZAP/Nuclei and the container-image scan could not run, and the AI suite uses a provider stub.

## Machine-readable evidence

- `security-reports/semgrep.json` and `semgrep.sarif`
- `security-reports/gitleaks.json` and `gitleaks-working-tree.json`
- `security-reports/osv.json`
- `security-reports/trivy.json` and `trivy-config.json`
- `security-reports/npm-audit.json`
- `security-reports/sbom.json` (CycloneDX 1.6, 350 components)
- `security-reports/custom-security-test-results.json`

ZAP, Nuclei, and Trivy image reports are absent because Docker was unavailable. Their absence is not a pass.
