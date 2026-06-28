# Article Series — Index & Backlog

A running list of Medium articles derived from this test‑automation repo. All articles are written to be **publishable externally**: generic, sanitized, and free of product, brand, or infrastructure specifics.

> Naming convention: `article-N-<slug>.md`. Publish roughly one per day.

---

## Published / drafted

| # | Title | File | Focus |
|---|-------|------|-------|
| 1 | Scaling Playwright‑BDD to 3,000+ Tests | `article-1-scaling-playwright-bdd.md` | playwright‑bdd architecture, fixtures, tags |
| 2 | Highly Scalable Test Data Management | `article-2-scalable-test-data-management.md` | data binding via title, generated users, resolver |
| 3 | Fixtures as a Runtime System | `article-3-fixtures-as-a-runtime-system.md` | scopes, teardown‑only guards, cached sessions |
| 4 | Tag‑Driven Test Execution & Orchestration | `article-4-tag-driven-test-execution.md` | suite‑as‑data, parallel/sequential, profiles |
| 5 | Cloud CI/CD with Docker, Terraform & AWS | `article-5-cicd-aws-terraform-pipeline.md` | image, entrypoint contract, IaC fan‑out |
| 6 | Time‑Travel Testing for Date‑Sensitive Flows | `article-6-time-travel-testing.md` | system‑clock control, restore fixture |
| 7 | Verifying Database & Message Side Effects | `article-7-database-side-effect-assertions.md` | act‑on‑UI, assert‑on‑data, polling, deep match |
| 8 | Network Interception & Response‑Contract Validation | `article-8-network-interception-contract-validation.md` | observe vs intercept, capture traffic, contract assertions |
| 9 | Accessibility Testing at Scale | `article-9-accessibility-testing-at-scale.md` | axe‑core as a tagged, gated, reported step |
| 10 | Quality Gates Beyond Functional: Lighthouse & K6 | `article-10-lighthouse-k6-quality-gates.md` | budgets as assertions, load thresholds, tag‑driven |
| 11 | White‑Label / Multi‑Tenant Testing Strategy | `article-11-white-label-multi-tenant-testing.md` | shared journeys, 4‑level fallback, brand as coordinate |

---

## Proposed / backlog

Ideas grounded in real patterns in the repo, not yet written. Ranked roughly by novelty / differentiation.

- **Testing OTP / 2FA flows without a real phone.** Sourcing one‑time passcodes (from logs, a static test OTP, or a test mailbox) and verifying email/SMS journeys end‑to‑end. *Sensitivity: keep infra names out.*
- **Test observability: trend metrics & flaky‑test dashboards.** Turning per‑run JSON reports into duration / pass‑rate / flaky‑rate trends. *Sensitivity: keep metrics + infra generic.*
- **(Skip as standalone) Page Object Model at scale** — well‑trodden; the interesting part (fixture‑resolved page objects) is already covered in articles 1–2.

---

## Sanitization checklist (apply to every article)

- No product, brand, or company names; no real domains or emails (use `example.test`).
- No cloud account IDs, ARNs, region names, bucket/secret names, or hosted‑zone IDs.
- No real schema/table/collection names — genericise (`orders`, `users`, etc.).
- No business‑domain specifics; replace with neutral equivalents.
- Examples illustrate *patterns*, not the actual system.
