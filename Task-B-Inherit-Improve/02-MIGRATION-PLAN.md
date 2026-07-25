# Phased migration plan (no big-bang rewrite)

**Principle:** Strangle the old design. Keep the live site serving traffic. Ship vertical slices. Every phase must leave production healthier than it found it.

**Constraint:** Real customers. Zero planned downtime. Prefer feature flags, dual-writes, and parallel paths over cutovers that cannot roll back.

---

## North star (end of Quarter 1)

- Secrets only in the host environment / vault.  
- All browser traffic goes through a documented HTTP API.  
- Business rules live in services, not sprawling route files.  
- CI runs critical-path tests on every merge.  
- Errors are visible; rollback is routine.  
- Team agrees on and uses a short set of engineering standards.

The marketing experience on digitalheroesco.com can remain mostly intact while the internals harden.

---

## Week 1 — Stop the bleeding

**Theme:** Security and survivability. No architecture vanity.

### Ships

1. **Secret incident response**  
   - Inventory secrets in tree and git history.  
   - Rotate DB, JWT, email, Shopify, analytics, and cloud keys.  
   - Remove files from the tree; block future commits with a secret scanner.  
   - Confirm production still boots with new env vars.

2. **Emergency API façade for the worst DB-from-browser paths**  
   - Identify the top 1–3 frontend modules that open DB connections or use privileged client SDKs.  
   - Add backend endpoints that perform the same operations.  
   - Point those frontend calls at the API.  
   - Restrict DB firewall / keys so browser credentials are revoked.

3. **Production safety kit**  
   - `/health` endpoint monitored externally.  
   - Error tracking on API + frontend.  
   - Confirm one-click (or documented) rollback on the current host (Vercel/Render/etc.).  
   - Freeze non-essential feature work for the week if needed.

4. **Smoke checklist**  
   - Manual script for: home load, contact/lead submit, login/admin if any, one commerce or booking path.  
   - Run it after every Week-1 deploy.

### Explicitly out of Week 1

- Full folder restructure.  
- Rewriting the marketing frontend.  
- Broad test coverage.  
- New product features.

### Week-1 exit criteria

- [ ] Rotated secrets; none in the default branch.  
- [ ] Browser cannot authenticate to the database.  
- [ ] Health check green; errors appear in the tracker.  
- [ ] Rollback procedure executed once in staging or a dry run.

---

## Month 1 — Make change safe

**Theme:** Thin APIs, extracted services on critical paths, first automated tests.

### Ships (by week within the month)

**Weeks 2–3**

- Extract services for: contact/lead capture, auth/session, and any payment or booking path.  
- Route handlers become adapters only.  
- Shared validation schemas for those endpoints.  
- Consistent JSON error shape on new/changed routes.

**Weeks 3–4**

- Automated tests (Jest/Supertest or equivalent) for:  
  - Auth rules (if applicable).  
  - Public lead/contact create.  
  - One authenticated admin or CRM read path.  
- CI: install → test → build on every PR.  
- Staging environment that mirrors production config (minus real secrets).

**Ongoing in Month 1**

- Kill remaining direct DB usage from any client bundle (audit with bundle analysis / grep).  
- Add rate limiting on public forms (spam is a reliability issue).  
- Document the live API surface in a short README (what the site actually calls).

### Month-1 exit criteria

- [ ] Critical customer flows go only through the API.  
- [ ] Those flows have automated tests in CI.  
- [ ] At least three high-churn modules have service-layer extraction.  
- [ ] No known privileged keys in client bundles.

---

## Quarter 1 — Harden and raise the floor

**Theme:** Sustainable structure, broader tests, standards adoption, controlled modernization.

### Month 2

- Continue strangler extraction module-by-module (CMS content, case-study admin, webhooks).  
- Add contract tests or OpenAPI for the public API if partners/mobile will consume it.  
- Introduce engineering standards (see `04-ENGINEERING-STANDARDS.md`) with lint rules that enforce the easy parts.  
- Dependency audit; patch critical CVEs; pin versions.

### Month 3

- Expand test suite: pagination/filtering, webhook idempotency, permission matrix.  
- Observability: dashboards for error rate, latency, form conversion, deploy frequency.  
- Optional: split “marketing site” vs “app API” deploy units **only if** it reduces risk — not for purity.  
- Performance pass on LCP/CLS for the homepage (customer-facing SEO revenue).  
- Run a game-day: kill a dependency, practice rollback, verify alerts.

### Quarter-1 exit criteria

- [ ] No business logic left in the top 80% of traffic route handlers.  
- [ ] CI is required to merge; main is protected.  
- [ ] Standards doc accepted; PR template checklist in use.  
- [ ] Secrets, DB access, and critical-path tests remain green for 30 consecutive days.  
- [ ] Team can ship a normal feature without touching unrelated god-files.

---

## Delivery shape (how work is sequenced on the ground)

```text
Week 1:  Secrets ──► API façade ──► Health/rollback
Month 1: Extract services ──► Tests/CI ──► Kill client DB
Q1:      More modules ──► Standards/lint ──► Observability/game-day
```

Each PR should:

1. Keep production behavior equivalent (or behind a flag).  
2. Include a rollback note.  
3. Add or update a test when touching extracted logic.  
4. Avoid mixing “security fix” with “redesign homepage.”

---

## Risk controls during migration

| Risk | Mitigation |
|------|------------|
| Dual systems diverge | Feature flag + short dual-run window; delete old path within two sprints |
| Partial secret rotation misses a key | Inventory checklist + post-rotation access logs |
| Tests flake → team ignores CI | Keep suite small and deterministic first |
| Resistant rewrites | Charter: “no greenfield unless strangler fails twice on the same module” |
| Marketing launch pressure | Protect a “stability capacity” percentage each sprint (e.g. 30%) |

---

## What “done enough” looks like vs a rewrite

You do **not** need a new repo or a new framework to declare success. Success is:

- Customers never noticed the migration.  
- Engineers can change lead capture without editing six handlers.  
- A leaked laptop does not contain production DB passwords.  
- A bad deploy is reverted in minutes, not rediscovered by a client email.
