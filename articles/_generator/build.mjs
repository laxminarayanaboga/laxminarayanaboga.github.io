// Build-time generator for the article series.
//
// Reads ../article-*.md, converts each to a standalone, fully-styled HTML page:
//   - Markdown -> HTML via `marked`
//   - code blocks syntax-highlighted at build time via highlight.js (no runtime JS)
//   - ```mermaid blocks rendered to static SVG via the Kroki API (build-time only;
//     the SVG is inlined into the page, so readers never call any external service)
//
// Output (committed, served by GitHub Pages):
//   ../index.html                 series landing page
//   ../<slug>.html                one page per article
//   ../assets/article.css         shared article styling
//
// Re-run with:  cd articles/_generator && npm install && npm run build

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked, Marked } from "marked";
import hljs from "highlight.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ARTICLES_DIR, "assets");

const SITE = {
  author: "Laxminarayana Boga",
  role: "Lead Quality Engineer & SDET",
  medium: "https://medium.com/@laxminarayanaboga4079",
  github: "https://github.com/laxminarayanaboga",
  linkedin: "https://linkedin.com/in/laxminarayana-boga-770b1456",
  email: "laxminarayanaboga4079@gmail.com",
  baseUrl: "https://laxminarayanaboga.github.io",
};

// ----- helpers ---------------------------------------------------------------

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugOf = (filename) =>
  filename.replace(/^article-\d+-/, "").replace(/\.md$/, "");

const numOf = (filename) => parseInt(filename.match(/^article-(\d+)-/)?.[1] ?? "0", 10);

// Render a mermaid diagram to inline SVG via Kroki (build-time).
async function mermaidToSvg(code) {
  const res = await fetch("https://kroki.io/mermaid/svg", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: code,
  });
  if (!res.ok) throw new Error(`Kroki ${res.status}: ${await res.text()}`);
  let svg = await res.text();
  // strip XML prolog / doctype so it inlines cleanly
  svg = svg.replace(/<\?xml[^>]*\?>/i, "").replace(/<!DOCTYPE[^>]*>/i, "").trim();
  return `<figure class="diagram">${svg}</figure>`;
}

// Configure marked with a custom code renderer.
function buildMarkedFor(diagrams) {
  const renderer = new marked.Renderer();
  // Support both marked v12 positional args (code, infostring) and the
  // v13+ token-object signature ({ text, lang }).
  renderer.code = (arg, infostring) => {
    const text = typeof arg === "object" && arg !== null ? arg.text : arg;
    const lang = typeof arg === "object" && arg !== null ? arg.lang : infostring;
    const language = (lang || "").trim().toLowerCase();
    if (language === "mermaid") {
      const placeholder = `@@DIAGRAM_${diagrams.length}@@`;
      diagrams.push(text);
      return placeholder; // resolved to SVG after async rendering
    }
    let highlighted;
    try {
      highlighted = hljs.getLanguage(language)
        ? hljs.highlight(text, { language }).value
        : escapeHtml(text);
    } catch {
      highlighted = escapeHtml(text);
    }
    const cls = language ? ` class="language-${language}"` : "";
    return `<pre><code${cls}>${highlighted}</code></pre>\n`;
  };
  return new Marked({ renderer, gfm: true });
}

// ----- page templates --------------------------------------------------------

const navHtml = (prefix) => `
  <nav class="nav" id="nav">
    <div class="nav-container">
      <a href="${prefix}index.html" class="nav-logo">LB</a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links" id="navLinks">
        <li><a href="${prefix}index.html#about">About</a></li>
        <li><a href="${prefix}index.html#experience">Experience</a></li>
        <li><a href="${prefix}index.html#projects">Projects</a></li>
        <li><a href="index.html">Writing</a></li>
        <li><a href="${prefix}index.html#contact">Contact</a></li>
      </ul>
    </div>
  </nav>`;

const navScript = `
  <script>
    window.addEventListener('scroll', () => {
      document.getElementById('nav').classList.toggle('nav--scrolled', window.scrollY > 20);
    });
    const t = document.getElementById('navToggle');
    if (t) t.addEventListener('click', () =>
      document.getElementById('navLinks').classList.toggle('nav-links--open'));
  </script>`;

const footerHtml = `
  <footer class="footer" id="contact">
    <div class="footer-container">
      <h2>Get in touch</h2>
      <p>Open to senior engineering roles, consulting, and interesting product conversations.</p>
      <div class="footer-links">
        <a href="mailto:${SITE.email}" title="Email"><i class="fa-solid fa-envelope"></i></a>
        <a href="${SITE.linkedin}" target="_blank" rel="noopener" title="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
        <a href="${SITE.github}" target="_blank" rel="noopener" title="GitHub"><i class="fa-brands fa-github"></i></a>
        <a href="${SITE.medium}" target="_blank" rel="noopener" title="Medium">
          <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true" style="vertical-align:-0.1em;">
            <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
          </svg>
        </a>
      </div>
      <p class="footer-copy">© 2026 ${SITE.author}</p>
    </div>
  </footer>`;

const head = ({ title, description, prefix, canonical }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://kit.fontawesome.com/e8e3708268.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="${prefix}style.css">
  <link rel="stylesheet" href="${prefix}articles/assets/article.css">
</head>
<body>`;

function articlePage({ title, description, bodyHtml, num, total, prevA, nextA }) {
  const prefix = "../";
  const mediumBanner = `
    <div class="medium-banner">
      <span><i class="fa-brands fa-medium"></i> This article is also published on Medium.</span>
      <a href="${SITE.medium}" target="_blank" rel="noopener" class="medium-link">Read it on Medium →</a>
    </div>`;

  const seriesNav = `
    <nav class="series-nav" aria-label="Series navigation">
      ${prevA ? `<a class="series-prev" href="${prevA.slug}.html">← ${escapeHtml(prevA.title)}</a>` : `<span></span>`}
      <a class="series-all" href="index.html">All articles</a>
      ${nextA ? `<a class="series-next" href="${nextA.slug}.html">${escapeHtml(nextA.title)} →</a>` : `<span></span>`}
    </nav>`;

  const bio = `
    <aside class="author-bio">
      <div class="author-bio-text">
        <p class="author-name">${SITE.author}</p>
        <p class="author-role">${SITE.role} · 13 years in test automation, cloud-native CI/CD, and AI-first engineering. London, UK.</p>
        <div class="author-links">
          <a href="${SITE.medium}" target="_blank" rel="noopener">Medium</a>
          <a href="${SITE.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
          <a href="${SITE.github}" target="_blank" rel="noopener">GitHub</a>
          <a href="${prefix}index.html">Portfolio</a>
        </div>
      </div>
    </aside>`;

  return `${head({ title: `${title} — ${SITE.author}`, description, prefix })}
${navHtml(prefix)}
  <main class="article">
    <div class="article-container">
      <p class="article-eyebrow"><a href="index.html">Testing at Scale</a> · Part ${num} of ${total}</p>
      ${mediumBanner}
      <article class="article-content">
        ${bodyHtml}
      </article>
      ${bio}
      ${seriesNav}
    </div>
  </main>
${footerHtml}
${navScript}
</body>
</html>
`;
}

function indexPage(articles) {
  const prefix = "../";
  const cards = articles
    .map(
      (a) => `
        <a class="article-card" href="${a.slug}.html">
          <span class="article-card-num">${String(a.num).padStart(2, "0")}</span>
          <span class="article-card-body">
            <span class="article-card-title">${escapeHtml(a.title)}</span>
            <span class="article-card-blurb">${escapeHtml(a.blurb)}</span>
            <span class="article-card-cta">Read article →</span>
          </span>
        </a>`
    )
    .join("\n");

  return `${head({
    title: `Writing — ${SITE.author}`,
    description:
      "A series on testing at scale: Playwright-BDD architecture, fixtures, tag-driven execution, cloud CI/CD, and quality gates. By Laxminarayana Boga.",
    prefix,
  })}
${navHtml(prefix)}
  <header class="writing-hero">
    <div class="section-container">
      <p class="section-title">Writing</p>
      <h1 class="writing-title">Testing at Scale</h1>
      <p class="writing-intro">
        A practical series on building and running large test-automation suites — Playwright-BDD
        architecture, fixtures as a runtime system, tag-driven execution, cloud-native CI/CD, and
        quality gates beyond the functional. Drawn from real-world experience; all examples are
        generic illustrations of the patterns.
      </p>
      <p class="writing-intro">
        Each article is also published on
        <a href="${SITE.medium}" target="_blank" rel="noopener">Medium</a>.
      </p>
    </div>
  </header>
  <main class="writing-list">
    <div class="section-container">
      <div class="article-cards">
${cards}
      </div>
    </div>
  </main>
${footerHtml}
${navScript}
</body>
</html>
`;
}

// ----- main ------------------------------------------------------------------

async function main() {
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => /^article-\d+-.*\.md$/.test(f))
    .sort((a, b) => numOf(a) - numOf(b));

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  // first pass: metadata
  const articles = files.map((file) => {
    const md = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const title = md.match(/^#\s+(.+)$/m)?.[1].trim() ?? slugOf(file);
    const blurb = (md.match(/^>\s+(.+)$/m)?.[1] ?? "").trim();
    return { file, slug: slugOf(file), num: numOf(file), title, blurb, md };
  });

  const total = articles.length;

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const diagrams = [];
    const md = buildMarkedFor(diagrams);
    let bodyHtml = md.parse(a.md);

    // render mermaid diagrams (in parallel) and splice SVGs in
    const svgs = await Promise.all(diagrams.map((d) => mermaidToSvg(d)));
    svgs.forEach((svg, idx) => {
      bodyHtml = bodyHtml.replace(`<p>@@DIAGRAM_${idx}@@</p>`, svg).replace(`@@DIAGRAM_${idx}@@`, svg);
    });

    const html = articlePage({
      title: a.title,
      description: a.blurb || `${a.title} — by ${SITE.author}`,
      bodyHtml,
      num: a.num,
      total,
      prevA: articles[i - 1],
      nextA: articles[i + 1],
    });
    fs.writeFileSync(path.join(ARTICLES_DIR, `${a.slug}.html`), html);
    console.log(`  ✓ ${a.slug}.html  (${diagrams.length} diagram${diagrams.length === 1 ? "" : "s"})`);
  }

  fs.writeFileSync(path.join(ARTICLES_DIR, "index.html"), indexPage(articles));
  console.log(`  ✓ index.html  (index of ${total})`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
