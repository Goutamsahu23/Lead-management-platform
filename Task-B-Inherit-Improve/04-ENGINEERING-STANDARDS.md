# Engineering standards proposal

Standards only work if they are short, enforced by tools, and tied to outcomes the team already cares about (uptime, client delivery, fewer fire drills). This proposal is written for a **resistant, ship-first team** inheriting a messy but live customer site — not a greenfield process rollout.

---

## 1. Standards to introduce (v1 — keep it small)

### S1. Secrets never live in git

- No `.env`, PEM keys, connection strings, or tokens in the repo.  
- Production secrets come from the host / vault only.  
- Pre-commit or CI secret scanning is mandatory.  
- **Violation = block merge.**

### S2. The browser never talks to the database

- Client code may call HTTPS APIs only.  
- DB credentials are server-side and network-scoped.  
- **Violation = P0 bug, same severity as a data breach.**

### S3. Route handlers stay thin

- Allowed in a handler: auth check, validate input, call one service, map HTTP response.  
- Not allowed: multi-step business workflows, raw ORM queries beyond trivial reads, email/CRM calls.  
- Guideline: if a handler exceeds ~40 lines of logic, extract a service.  
- **Enforced in review first; lint complexity rules later.**

### S4. Every critical path has an automated test before it is “refactored again”

Critical paths for a customer site like digitalheroesco.com typically include:

- Public contact / lead capture  
- Auth (if any)  
- Checkout / booking / webhook receivers  

Rule: you may change production behavior on a critical path only if a test exists or ships in the same PR.  
**Violation = request changes in review.**

### S5. Safe deploy bar

- CI must be green to merge to main.  
- `/health` must pass post-deploy smoke.  
- Every PR description includes: risk, rollout, rollback.  
- **Violation = revert or hold release.**

### S6. One error contract

- APIs return JSON: `{ message, errors? }` with correct status codes (`400/401/403/404/429/500`).  
- Never return raw exception messages to clients in production.  
- **Enforced via shared error middleware.**

### S7. Dependency hygiene

- Lockfile committed.  
- Critical security updates within 7 days of notice.  
- No new major framework upgrades without a short written plan and tests.  

---

## 2. What we explicitly defer (so v1 is adoptable)

- Full Clean Architecture / hexagonal folders everywhere.  
- 80% coverage gates.  
- Microservices.  
- Mandatory pair programming.  
- Rewriting the marketing frontend “the right way.”

Deferring these prevents the standards conversation from becoming a rewrite argument.

---

## 3. Team context (Digital Heroes–specific)

Digital Heroes is not a sleepy internal IT team. From the public brand:

- **Founder-led, ship-first culture** — speed and “done once” are part of the client pitch.  
- **Marketing + sales pressure** — homepage and contact funnel are revenue surfaces. A broken form is lost pipeline, not “tech debt.”  
- **Multi-office delivery** (NY / Delhi / London / Sydney / Lucknow) — standards must survive timezone gaps and async review.  
- **Reputation leverage** — Trustpilot, Clutch, Shopify partner status. Engineering incidents become brand incidents quickly.

Implication: if standards feel like they slow client delivery, the team will route around them. Adoption must **raise** the odds of shipping safely under deadline — not invent ceremony.

---

## 4. How adoption works with a resistant team

Resistance here usually sounds like:

| What they say | What they mean | Useful response |
|---------------|----------------|-----------------|
| “We don’t have time for process” | A client launch is this week | “Week-1 rules are only secrets + no browser DB. Everything else waits.” |
| “Tests slow us down” | Past coverage gates were theatrical | “Two critical-path tests, not 80% coverage. Same PR as the change.” |
| “Just rewrite it clean” | Frustration with the mess | “Rewrite risks downtime. We strangle one handler at a time.” |
| “I know where the bugs are” | Hero culture / bus factor | “Then help write the one test that locks that knowledge in.” |
| “Sales already promised the feature” | Standards lose to revenue | Founder liaison protects a fixed **stability slice** on the board |

### Step A — Open with a brand-risk frame (not “best practices”)

Pitch in language leadership already uses:

> “Clients hire us because we ship without drama. These seven rules exist so digitalheroesco.com — and every client form behind it — does not become the drama.”

Then run a **15-minute tabletop** with eng + one sales/ops person:

1. Mongo URI leaks in a client bundle — who notices first: attacker, client, or Trustpilot review?  
2. Contact form 500s for 48 hours — how many discovery calls were lost?  
3. Hotfix overwrites CRM priority logic — who gets the angry Slack?

If people argue abstract architecture, bring them back to those three scenarios.

### Step B — Name champions before writing rules

Do not appoint a “standards committee.” Pick:

- **1 tech lead** — merge-blocker authority (can refuse P0 violations).  
- **1 senior IC “golden path” owner** — maintains the service/route/test template; pairs on the first three extracted handlers.  
- **1 founder/EM liaison** — defends capacity against “just ship the landing tweak.”  

Without the liaison, eng will quietly drop standards the first time a Premier Partner demo is at risk.

### Step C — Co-author v1 in one 45-minute working session

Do not drop a PDF in Slack.

**Invite:** engineers who touch the live site + the liaison (optional: one salesperson for the tabletop only).

**Agenda:**

1. Assessment P0/P1 list (10 min).  
2. Walk the seven standards (10 min).  
3. Team edits / cuts anything that feels fake (15 min).  
4. Vote each rule: **merge blocker** vs **guideline** (10 min).  

Only merge blockers get CI teeth. Everything else is review guidance. People support what they help edit.

### Step D — Automate the non-negotiables in week 1–2

Humans resist nagging; they accept red CI — especially across offices when reviewers are asleep.

| Guardrail | Mechanism |
|-----------|-----------|
| Secrets | gitleaks (or equivalent) in CI + pre-commit |
| No client DB | CI grep / ESLint fail on `mongodb`, privileged URIs in client bundles |
| Critical tests | `npm test` required to merge |
| Deploy safety | PR template requires risk + rollback; `/health` checked post-deploy |

If a resistant engineer argues in review, point at the failing check — the debate ends.

### Step E — Make the golden path faster than the old path

Resistance often means “the clean way is unfamiliar.” Fix that with artifacts, not lectures:

1. Copy-paste `service` + `route` + `test` skeleton in the repo.  
2. One reference PR that refactors contact/lead (see `03-REFACTOR-DEMO.md`) — link it in the PR template.  
3. **Office hours:** 2×30 min per week for two weeks where the golden-path owner pairs on extractions handlers (async-friendly: Loom + overlap slot for Delhi/NY).  
4. Editor snippets/generators if the team already uses them.

When the right way is the fastest way under deadline, adoption sticks.

### Step F — Change the review social contract

Replace vague “clean this up later” (which never happens) with specific, blameless asks:

- “This handler sends email — move to `emailService` so a SMTP blip doesn’t drop the lead?”  
- “Shopify Plus priority rule — add the one-line unit test from the demo?”  
- “Rollback: previous Render/Vercel deploy, or feature flag off?”

**Praise in public, correct in PR:**

- Weekly: call out the PR that deleted a client DB call or added the contact-form test.  
- Do not shame legacy authors — frame as “we inherited this; we’re strangling it.”

Hero culture softens when status attaches to making the system safer, not only to midnight hotfixes.

### Step G — Negotiate capacity in stakeholder language

Do not ask for “30% tech debt.” Ask for:

> **Keep-the-funnel-safe capacity:** ~30% of eng time until Month-1 exit criteria (secrets gone, browser off DB, two critical tests green).

Put it on the same board as client work as a named epic: **“Site reliability / migration.”**  
Homepage experiments still ship — but not by reopening browser DB access or skipping the contact-form test.

Escalation: tech lead → liaison → founder. Document **one refused unsafe shortcut** so the boundary is real.

### Step H — Dual track for “we need it yesterday” work

Resistant teams bypass process when process has no escape hatch. Provide a controlled one:

- **Fast lane:** UI copy, CSS, content — normal review, no new service required.  
- **Guarded lane:** auth, DB, payments, webhooks, contact/lead — standards apply; exceptions need a tech-lead written note (expires in 7 days + follow-up ticket).  

Emergency hotfixes may merge with a failing non-critical lint **only if** a follow-up issue is filed the same hour. **P0 rules (secrets, client DB) never waive.**

### Step I — Multi-office adoption mechanics

| Risk | Practice |
|------|----------|
| Async review rubber-stamping | Required checklist on PR; CI blocks the real dangers |
| “Different office, different norms” | One standards doc, one main-branch policy |
| Knowledge stuck in one city | Rotate who owns the next handler extraction; record pairing |
| Timezone deploy surprises | Agreed deploy windows; smoke run by the awake office |

### Step J — Time-box, measure, revise

Commit to **v1 for 30 days**. Then a 45-minute retro with the scorecard below.

- Rules that slowed delivery without preventing risk → drop or soften.  
- Near-misses caught by CI → keep and tell the story.  
- If the team votes “more harm than help,” shrink to S1+S2+S5 only and rebuild trust.

Standards that can be edited survive. Commandments from outside get ignored.

---

## 5. Roles and accountability

| Role | Responsibility | Failure mode if missing |
|------|----------------|-------------------------|
| Tech lead | Owns doc; final call on merge blockers | Every rule becomes optional |
| Golden-path IC | Templates, pairing, first reference PRs | Clean way stays slower than dirty way |
| Every engineer | Follows blockers; suggests edits in retro | Compliance theater |
| Founder / EM liaison | Defends stability capacity vs sales deadlines | Standards die at first client crunch |
| Deploy owner (rotating) | Smoke + rollback notes | “Works on my machine” deploys |

No separate “standards police.” Adoption is part of shipping.

---

## 6. 30-day adoption scorecard

| Signal | Target | Owner |
|--------|--------|-------|
| Secrets in default branch | 0 | Tech lead |
| Client bundles with DB drivers / privileged URIs | 0 | Golden-path IC |
| Critical-path tests in CI | ≥ 2 flows (contact + one more) | Eng |
| PRs with risk/rollback notes | ≥ 80% | Reviewers |
| Documented refused unsafe shortcut | ≥ 1 | Liaison |
| Handler extractions shipped | ≥ 3 | Eng |
| Team retro vote: “helps more than hurts” | Majority yes | Whole team |

If the scorecard fails, **do not add more rules** — fix automation, capacity, or liaison power.

---

## 7. First two weeks — concrete rollout calendar

| Day | Action |
|-----|--------|
| 1 | Tabletop + champion naming |
| 2 | 45-min co-author session; publish v1 in repo |
| 3–5 | CI: secrets scan + test gate + client-DB grep |
| 5 | PR template + skeleton folders landed |
| 6–10 | Reference refactor PR merged; two pairing slots |
| 10 | Liaison confirms stability epic on the board |
| 14 | Mid-point check: scorecard green/yellow/red |

---

## 8. One-page PR checklist (paste into GitHub/GitLab)

```text
[ ] No secrets added; env sample updated if needed
[ ] No DB access from client code
[ ] Business logic in a service (handler stays thin) — or Fast-lane justified
[ ] Test added/updated for critical behavior (auth / contact / pay / webhook)
[ ] Error responses follow JSON contract
[ ] Risk + rollback noted
```

That checklist *is* the standards, day to day — across every office.

Built for Digital Heroes Training Task
