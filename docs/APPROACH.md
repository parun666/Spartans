# Project Approach & Architecture - Build Secure 24

**Team ID:** 03A  
**Project Name:** FinTrack  
**Team Size:** 2 Members  
**Primary Track / Domain:** Secure personal finance tracking

---

## 1. Problem Understanding, Scope & Threat Model

### 1.1 Problem Statement & Real-World Motivation
FinTrack helps users track income, expenses, budgets, savings goals, and local backups from a single browser-based dashboard. Personal finance records are sensitive, so the first prototype focuses on local-first data handling, safe rendering of user-entered text, and simple export/import controls.

### 1.2 Target Users & Personas
- **Primary user:** An individual tracking day-to-day personal finances.
- **Trust model:** The current prototype is single-user and local-first, with no backend administrator or shared account roles.

### 1.3 Threat Model & Attack Surface
- **Critical Assets:** Transaction history, budget limits, savings goals, and exported JSON backups.
- **Potential Attack Vectors:** Malicious imported JSON, script injection through transaction text, accidental disclosure through exported backups, and browser storage exposure on shared devices.
- **OWASP Top 10 Considerations:** The prototype avoids dynamic HTML injection for user-entered data, uses a strict Content Security Policy, and keeps all data local until the user exports it.

---

## 2. Technical Architecture & Secure System Design

### 2.1 High-Level Architecture Overview
The current version is a static multi-page client-side application in `src/`. `index.html` is the Overview page, while `transactions.html`, `budgets.html`, and `goals.html` provide dedicated pages for each major workflow. Shared styling and behavior live in `styles.css` and `app.js`, and persistence uses `localStorage` under a namespaced key.

### 2.2 Data Flow & Component Interaction
User input flows through page-specific form controls into validation logic in `app.js`, then into an in-memory state object and browser `localStorage`. Imported JSON is parsed and shape-checked before replacing local state. Exported data is generated as a user-downloaded JSON file and remains available from each primary page.

### 2.3 Technology Stack Rationale
- **Backend / API Framework:** None yet - chosen to keep the first usable prototype offline and simple.
- **Frontend / Client:** HTML, CSS, and vanilla JavaScript - chosen because the repo had no existing app stack and a dependency-free static app can run immediately.
- **Database & Persistence:** Browser `localStorage` - chosen for fast local-first prototyping.
- **Authentication & Cryptography:** Not implemented yet - future versions should add account authentication only when a backend is introduced.

### 2.4 Defense-in-Depth Security Controls
1. **Authentication & Session Security:** Not applicable to the current offline prototype.
2. **Authorization & Access Control:** Single-user local app; no cross-user data access exists yet.
3. **Input Validation & Sanitization:** Forms enforce required fields and numeric ranges; rendered user data uses DOM `textContent` instead of unsafe HTML insertion.
4. **Rate Limiting & Abuse Prevention:** Not applicable until network endpoints are introduced.
5. **Secrets & Configuration Hygiene:** No secrets or API keys are embedded in the client.

---

## 3. Implementation Milestones & 24-Hour Timeline

| Milestone / Phase | Time Window | Key Objectives & Deliverables | Security Verification | Status |
|---|---|---|---|---|
| **Phase 1: Foundation & Setup** | 0h - 4h | Contract onboarding, team metadata, static app foundation | Repo contract check and metadata validation | `Complete` |
| **Phase 2: Core Product UI** | 4h - 12h | Dashboard, transaction ledger, budgets, goals, local persistence | Manual UI and input validation checks | `In Progress` |
| **Phase 3: Security & Hardening** | 12h - 18h | Import validation, CSP, storage hygiene, edge case handling | Browser testing and syntax checks | `Planned` |
| **Phase 4: Polish & Deployment** | 18h - 24h | UI polish, deployment, final docs and commit freeze | Deployment URL and final SHA verification | `Planned` |

---

## 4. Architecture Decision Records (ADRs)

### ADR-001: Static Local-First FinTrack Prototype
- **Status:** Accepted
- **Context:** The team needed a complete FinTrack website quickly after onboarding, and the repository had no existing frontend framework.
- **Options Considered:**
  1. Static HTML/CSS/JavaScript.
  2. Framework app with build tooling.
- **Decision & Rationale:** Static HTML/CSS/JavaScript was selected for immediate usability, low setup risk, and no dependency installation.
- **Security & Performance Trade-offs:** Local-only storage reduces server attack surface, but browser storage is not appropriate for highly sensitive production financial data on shared devices.

---

## 5. Engineering Journal & Real-Time Decision Log

### [2026-10-05 12:18 IST] Entry 1: Project Initialization & Scope Lock
- **Focus:** Team metadata, static app foundation, and local-first finance workflows.
- **Key Challenges:** Building a complete first-screen application without relying on external cloned code or dependency setup.
- **Resolution:** Created a dependency-free FinTrack dashboard in `src/` with transactions, metrics, budgets, goals, and JSON backup controls.

### [2026-10-05 12:32 IST] Entry 2: Separate Page Navigation
- **Focus:** Split Overview, Transactions, Budgets, and Goals into separate static pages.
- **Key Challenges:** Preserving shared localStorage data while avoiding JavaScript errors on pages that do not contain every control.
- **Resolution:** Added dedicated HTML pages for each workflow and refactored `app.js` to initialize only the controls present on the current page.

### [2026-10-05 13:12 IST] Entry 3: Sun and Moon Background Cycle
- **Focus:** Add a smooth day/night visual cycle to the FinTrack background.
- **Key Challenges:** Matching the finance dashboard palette while keeping forms, metrics, and tables readable.
- **Resolution:** Added an original CSS-only animated sky gradient with moving sun and moon layers, translucent panels, and softened borders.

### [2026-10-05 13:52 IST] Entry 4: Professional Finance Dashboard Redesign
- **Focus:** Rebuild the FinTrack interface around a polished dark dashboard reference with cards, balance analytics, recent activity, and dense finance panels.
- **Key Challenges:** Preserving separate pages and local-first functionality while preventing text, cards, and controls from overlapping on small screens.
- **Resolution:** Reworked the Overview page into a dashboard grid with a compact sidebar, top utility bar, right card rail, transaction feed, responsive breakpoints, and demo data for a complete first impression.

### [2026-10-05 18:51 IST] Entry 5: Dataset Reset, Quick Entry, and Market Insights
- **Focus:** Add reload reset behavior, a preinstalled dataset button, earn/spend quick amount entry, richer Overview charts, and investment market context.
- **Key Challenges:** Resetting user-owned finance records without weakening ownership controls, keeping the quick entry flow simple, and showing NIFTY 50/Sensex charts while failing safely when live market data is unavailable.
- **Resolution:** Added an authenticated demo reset API, reload-triggered reset in the app shell, a dashboard dataset button and earn/spend form, monthly savings and high expenditure charts, and a market API/page section for NIFTY 50 and Sensex.

---

## 6. Testing, Security Verification & Deployment Record

### 6.1 Testing & Security Verification Strategy
- **Unit & Integration Tests:** Manual browser-level verification is planned for the static prototype.
- **Static Analysis & Linting:** JavaScript syntax validation is planned with local tooling if available.

### 6.2 Deployment Verification
- **Live Deployment Platform:** Not configured yet.
- **Deployment URL:** Not recorded yet.
- **Health Check Endpoint:** Not applicable for the current static prototype.

### [2026-10-05 16:10 IST] Entry 5: Full Next.js Rebuild (FinTrack v2)
- **Focus:** Replace static prototype with a complete secure Next.js 14 app per the fixed stack.
- **Stack:** Next.js 14 App Router + TypeScript, Tailwind + shadcn-style UI, Prisma + SQLite (Postgres-compatible schema), Zod, Recharts, Vitest + Playwright, bcryptjs, jose JWT cookie sessions, TanStack Query.
- **Money:** INTEGER PAISE everywhere; Intl en-IN formatting.
- **Security:** requireUser/requireRole, per-row userId filters, login rate limit, rate-limited auth audit, AES-256-GCM AI keys, security headers, cascade account deletion, exports exclude secrets.
