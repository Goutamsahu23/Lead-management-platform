# Assessment: Inheriting digitalheroesco.com

**Context:** Live production site serving real customers. Current state includes no automated tests, business logic in route handlers, frontend talking directly to the database, and secrets committed to the repository. Downtime is unacceptable.

**Goal:** Stabilize first, then harden, then improve architecture — without a big-bang rewrite.

---

## Executive summary

The site can stay up, but the engineering risk is high. The highest-urgency issues are **exposed secrets** and **direct frontend-to-database access**. Those can cause outages, data leaks, and irreversible customer harm. Everything else (structure, tests, standards) matters, but only after the blast radius is reduced.

Recommended order of work:

1. Secrets and credential exposure  
2. Stop direct database access from the browser  
3. Observability and rollback safety  
4. Extract business logic behind a thin API  
5. Tests around critical customer paths  
6. Gradual architecture cleanup and DX standards  

---

## Issue inventory (ordered)

### 1. Secrets in the repository

**What is wrong**  
API keys, database URLs, JWT secrets, third-party tokens, or `.env` files are committed (or historically present in git history).

**What I would fix**  
- Rotate every exposed credential immediately.  
- Remove secrets from the working tree; add ignore rules.  
- Purge or rewrite git history if secrets were ever pushed.  
- Move secrets to a host secret store / environment config.  
- Add a pre-commit secret scanner (e.g. gitleaks).

**Risk of leaving it**  
**Critical.** Anyone with repo access (or a leaked clone) can impersonate the product, read customer data, burn paid APIs, or take the site down. Compliance and customer trust damage is severe. This is the first fix even before “clean code.”

---

### 2. Direct database calls from the frontend

**What is wrong**  
Browser code connects to Mongo/Postgres/Firebase with privileged credentials, or uses a client SDK with overly broad rules. Business data and write paths are exposed to every visitor.

**What I would fix**  
- Introduce a server API boundary (existing Node/Express or Next.js route handlers).  
- Give the browser only a public API URL + short-lived auth tokens.  
- Lock database network access to backend IPs only.  
- Replace client DB SDKs with fetch calls to the API.

**Risk of leaving it**  
**Critical.** Attackers can scrape, mutate, or delete customer data. Schema changes break the live site from every client. You cannot enforce permissions or rate limits consistently. Leaving this in place is an open incident waiting to happen.

---

### 3. Business logic inside route handlers

**What is wrong**  
Validation, pricing, lead routing, email sends, Shopify webhook handling, and auth checks live inline in HTTP handlers. Handlers are long, hard to test, and duplicated across endpoints.

**What I would fix**  
- Keep handlers thin: parse → authorize → call service → map response.  
- Move rules into `services/` (or domain modules).  
- Share validation schemas (Zod/Joi) between routes.  
- Do this file-by-file on the hottest paths first (contact form, checkout, auth).

**Risk of leaving it**  
**High.** Bugs get fixed in one place and missed in another. Tests stay hard to write, so regressions ship. Onboarding new engineers is slow. Under load or deadline pressure, people copy-paste more broken logic. Not an immediate outage by itself, but it multiplies every future outage.

---

### 4. No automated tests

**What is wrong**  
No unit, integration, or smoke tests. Releases rely on manual clicking. Refactors are scary because nothing proves “customers can still book / submit / pay.”

**What I would fix**  
- Add a small, high-value suite first: health, auth, contact/lead capture, one money or booking path.  
- Run tests in CI on every PR.  
- Expand coverage as modules are extracted (tests become cheap once logic leaves handlers).

**Risk of leaving it**  
**High.** Every deploy is a roll of the dice. “Cannot go down” is incompatible with untested refactors. Silent breakage of contact forms or CRM sync may go unnoticed for days and cost pipeline revenue.

---

### 5. Weak operational safety (deploy / rollback / monitoring)

**What is wrong** (common in poorly built live sites)  
No clear health checks, no structured logs, no error tracking, no staged rollout, unclear rollback path.

**What I would fix**  
- `/health` + uptime checks.  
- Error tracking (Sentry or equivalent).  
- Structured request logs with correlation IDs.  
- Blue/green or at least one-click previous-release rollback.  
- Feature flags for risky UI changes.

**Risk of leaving it**  
**High.** When something breaks at 2am, you discover it from a customer tweet. Mean time to recover stays long even if the root bug is small.

---

### 6. Inconsistent API and error contracts

**What is wrong**  
Mixed status codes, HTML error pages for API clients, leaking stack traces, no pagination conventions.

**What I would fix**  
- Standard `{ message, errors? }` JSON errors.  
- Consistent auth (`401` / `403`) and validation (`400`) behavior.  
- Document the public/customer-facing endpoints.

**Risk of leaving it**  
**Medium.** Frontend hacks around inconsistent responses; mobile or partner integrations become fragile; security details may leak in errors.

---

### 7. Coupling and “everything in one place” structure

**What is wrong**  
Monolithic folders, shared mutable globals, no clear boundaries between marketing site, CRM, and admin tools.

**What I would fix**  
- Incremental modularization: `routes` / `services` / `models` / `middleware`.  
- Separate public marketing from authenticated admin when cost is justified.  
- Avoid a full rewrite; carve seams where change is already happening.

**Risk of leaving it**  
**Medium–High over time.** Velocity collapses; one change breaks unrelated pages; hiring and parallel work become painful. Not the first fire to put out.

---

### 8. Dependency and platform debt

**What is wrong**  
Outdated frameworks, unpinned deps, missing lockfile discipline, unused packages.

**What I would fix**  
- Lockfiles committed; Dependabot/Renovate for security patches.  
- Upgrade frameworks on a schedule after tests exist.  
- Remove dead code only with coverage or feature flags.

**Risk of leaving it**  
**Medium.** Security CVEs accumulate; upgrades become impossible without a rewrite narrative — which you must avoid.

---

## What I would *not* do early

- Big-bang rewrite of the marketing site or admin in a new stack.  
- Microservices before a clean modular monolith.  
- 80% unit-test coverage targets before critical-path integration tests.  
- Perfect Clean Architecture ceremonies that block shipping fixes.

---

## Priority matrix

| Priority | Issue | Urgency | Effort | Leave-it risk |
|----------|-------|---------|--------|---------------|
| P0 | Secrets in repo | Immediate | Low–Medium | Critical |
| P0 | Frontend → DB | Immediate | Medium | Critical |
| P1 | Observability + rollback | Days | Medium | High |
| P1 | Extract hottest business logic | Weeks | Medium | High |
| P1 | Critical-path tests + CI | Weeks | Medium | High |
| P2 | API/error standards | Weeks | Low–Medium | Medium |
| P2 | Structure / modularization | Months | Ongoing | Medium–High |
| P3 | Dep upgrades, DX polish | Quarter | Ongoing | Medium |

---

## Success criteria for “safe to improve”

You may accelerate refactors only when all of these are true:

1. No secrets in git; rotation complete.  
2. Browser cannot reach the database.  
3. Health checks and error tracking are live.  
4. At least two customer-critical flows have automated tests in CI.  
5. Rollback of the last release is practiced once.

Until then, treat every change as a production incident risk and keep diffs small.
