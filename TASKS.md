# Portfolio & GitHub Pages Hosting Plan

## Context

- **Domain**: `https://laxminarayanaboga.github.io/` (GitHub Pages from this repo)
- **Goal A**: Replace the current index with a professional portfolio landing page
- **Goal B**: Host sub-projects at `laxminarayanaboga.github.io/<project>` using the same domain

---

## How GitHub Pages Sub-Paths Work

GitHub Pages gives every repo under your account a URL at:

```
https://laxminarayanaboga.github.io/<repo-name>
```

So if you create a repo named `hrapp` and enable Pages on it, it is live at `laxminarayanaboga.github.io/hrapp` — automatically, no custom domain config needed. This is the cleanest approach: **each project lives in its own repo**, and this root repo stays purely as the portfolio.

---

## Goal A — Professional Portfolio Landing Page

### What needs to go
- The current `index.html` card gallery of learning exercises should be removed or demoted (these are tutorial outputs, not portfolio items)
- `myProfile/` and `myProfileV2/` are also tutorial outputs and can be archived or deleted

### What the new landing page should be

A single-page portfolio in `index.html` with these sections:

| Section | Content |
|---|---|
| **Hero** | Name, current title/role, 1-line positioning statement |
| **About** | 3–4 sentences: background, what you bring, what you're interested in |
| **Experience** | Timeline: Cognizant (2022–now), CBRE (2019–2022), GAP Inc (2019), DBS DAH2 (2017–2019), Cognizant (2013–2016) |
| **Skills** | Grouped: Automation (UI/API/WebDriverIO/Selenium), Backend (NodeJS, MongoDB), Frontend (HTML/CSS/JS, Bootstrap, React), Cloud (AWS) |
| **Projects** | Cards linking to real deployed projects (hrapp, rowan, etc.) at their GitHub Pages sub-paths |
| **Contact** | LinkedIn, GitHub, email — already in footer of current site |

### Design choices
- Keep it plain HTML + CSS — no framework necessary for a personal portfolio, keeps it fast
- One CSS file, no build step, no framework overhead
- Responsive (Bootstrap is fine to keep for grid, or use CSS grid/flexbox natively)
- Professional color palette — not the dark navbar + card grid look of the current page

### Tasks

- [ ] **A1** — Write the new `index.html` portfolio page (replace current)
- [ ] **A2** — Write `style.css` (replace current placeholder styles)
- [ ] **A3** — Add a meta description and OG tags so LinkedIn/recruiter link previews look good
- [ ] **A4** — Decide what to do with the learning projects: delete, archive to a `/playground` subfolder, or link them from a secondary "experiments" section
- [ ] **A5** — Add your actual photo (currently in `myProfile/laxminarayanaBoga.png` and `myProfileV2/images/laxminarayanaBoga.png`)
- [ ] **A6** — Verify the page on mobile

---

## Goal B — Sub-Path Hosting for Other Projects

### Architecture

```
laxminarayanaboga.github.io/          ← this repo (portfolio)
laxminarayanaboga.github.io/hrapp     ← github.com/laxminarayanaboga/hrapp repo
laxminarayanaboga.github.io/rowan     ← github.com/laxminarayanaboga/rowan repo
laxminarayanaboga.github.io/rowan-admin  ← same rowan repo, different deploy path (see below)
```

### Per-project setup checklist

For each project repo (`hrapp`, `rowan`, etc.):

**1. Enable GitHub Pages on the repo**
- Go to repo → Settings → Pages → Source: `gh-pages` branch (or `docs/` folder)

**2. Configure the build tool to use the sub-path as base URL**

Depending on the stack:

| Stack | Config |
|---|---|
| **Create React App** | Add `"homepage": "https://laxminarayanaboga.github.io/hrapp"` to `package.json` |
| **Vite (React/Vue)** | Add `base: '/hrapp/'` to `vite.config.ts` |
| **Next.js** | Add `basePath: '/hrapp'` and `assetPrefix: '/hrapp'` to `next.config.js` |
| **Plain HTML** | No config needed — just put files at the root of the repo |

**3. Deploy the build output**

Option 1 — Manual: `npm run build` then push the `dist/` or `build/` folder to `gh-pages` branch  
Option 2 — GitHub Actions (recommended): auto-deploy on every push to `main`

Sample GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist   # or ./build for CRA
```

### For `rowan` + `rowan-admin` (two apps, one repo)

Two options:

**Option 1 — Two separate repos** (`rowan` and `rowan-admin`)  
Cleanest. Each gets its own path. Downside: shared code duplication.

**Option 2 — Monorepo with two deploy targets**  
One repo, two apps in subdirectories (`apps/client` and `apps/admin`).  
GitHub Actions builds both and pushes:
- `apps/client/dist` → `gh-pages` branch root (serves as `/rowan`)
- `apps/admin/dist` → `gh-pages` branch `/admin` subfolder (serves as `/rowan-admin`)

This is doable but slightly more complex CI.

### Tasks

- [ ] **B1** — Confirm which projects exist as repos and which still need a repo created
- [ ] **B2** — For each project: enable GitHub Pages in repo settings (choose `gh-pages` branch as source)
- [ ] **B3** — For each project: set the base URL in the build config (see table above)
- [ ] **B4** — For each project: add the GitHub Actions deploy workflow
- [ ] **B5** — Decide: `rowan-admin` as a separate repo or a subfolder deploy from the same repo
- [ ] **B6** — Once each project is live, add it to the Projects section of the portfolio (Task A1)

---

## Quick Decision Needed

Before starting implementation, answer these:

1. **What stack is `hrapp`?** (React/Vite, Next.js, plain HTML, something else?)
2. **What stack is `rowan`?** Same question — and is the admin a separate app or a protected route?
3. **Do `hrapp` and `rowan` already have GitHub repos?**
4. **Do you have a headshot / professional photo** to use on the portfolio, or use the one in `myProfileV2/images/laxminarayanaBoga.png`?

---

## Suggested Order

1. Answer the decisions above
2. Do **A1–A3** first (portfolio page) — this is the highest-value change
3. Then **B1–B6** per project as they get ready to deploy
4. **A4** (clean up learning projects) can be last — low priority
