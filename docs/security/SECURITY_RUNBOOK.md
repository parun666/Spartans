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

## Target safety

ZAP is configured as unauthenticated baseline scanning against the local application. Nuclei defaults to loopback. The wrapper refuses non-local Nuclei targets unless `FINTRACK_SECURITY_ALLOW_REMOTE=1`; only authorized targets are allowed. Authentication-context DAST is not configured yet.
