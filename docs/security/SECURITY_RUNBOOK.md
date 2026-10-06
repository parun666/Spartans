# Security Tool Runbook

## Prerequisites

- Node.js 22 and npm; Docker Desktop for container, ZAP, and Nuclei checks.
- Install Semgrep, Gitleaks, OSV-Scanner, and Trivy using their official project installation instructions and pin versions in CI/release records.
- Use a QA database and fictional data. Do not run scanners against a third party or production service without written authorization.

## Commands

| Command | Tool/output | Requirements |
|---|---|---|
| `npm run security:test` | FinTrack security/API tests | npm dependencies |
| `npm run security:semgrep` | JSON and SARIF under `security-reports/` | `semgrep` CLI |
| `npm run security:gitleaks` | Git-history and working-tree JSON reports | `gitleaks` CLI |
| `npm run security:osv` | OSV JSON report | `osv-scanner` CLI |
| `npm run security:trivy` | Filesystem/dependency and config JSON reports | `trivy` CLI |
| `npm run security:trivy:image` | Container image JSON report | Trivy and local `fintrack:local` image |
| `npm run security:zap` | ZAP baseline HTML/JSON reports | Docker and local app at port 3000 |
| `npm run security:nuclei` | Nuclei JSONL findings | Docker and authorized local app |
| `npm run security:sbom` | CycloneDX JSON SBOM | npx/network first run |
| `npm run security:all` | Tests, npm audit, SAST/secrets/dependencies/config/SBOM; continues through missing tools | All listed CLI tools |

`security:all` reports missing scanners as failures. By default it does not run image/Dynamic scans; after building `fintrack:local` and starting the local QA app, opt in with `SECURITY_RUN_DAST=1 npm run security:all` (PowerShell: `$env:SECURITY_RUN_DAST='1'; npm run security:all`). Reports are evidence only of commands that ran; inspect scanner exit codes and findings.

## This verification run

On 2026-10-06, Semgrep 1.179.0, Gitleaks 8.30.1, OSV-Scanner 2.6.0, Trivy 0.75.0, and the npm SBOM generator ran locally. Semgrep found one low-confidence `Math.random` toast-ID finding; it was replaced with `crypto.randomUUID()` and rescanned (0 findings). An initial Gitleaks working-tree pass identified eight generic-key matches only in the local generated `.venv/`; after adding a narrow generated-environment exclusion, history and working-tree scans both reported no leaks. OSV-Scanner scanned the lockfile (377 packages) without findings. Trivy filesystem/configuration scans completed with 0 findings in the configured HIGH/CRITICAL scope. npm audit reported 0 vulnerabilities; SBOM generated 350 components.

Docker was not installed (`Get-Command docker` found no executable). Therefore image Trivy, ZAP and Nuclei were deliberately skipped; no DAST or image-clean result is claimed. The temporary Trivy database credential-helper error was resolved for filesystem/config scans by using an empty temporary Docker config.

## Target safety

ZAP is configured as unauthenticated baseline scanning against the local application. Nuclei defaults to loopback. The wrapper refuses non-local Nuclei targets unless `FINTRACK_SECURITY_ALLOW_REMOTE=1`; only authorized targets are allowed. Authentication-context DAST is not configured yet.
