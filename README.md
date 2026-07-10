# axiomloop — Deep-Tech Infrastructure Landing

> Wordmark note: the brand renders as **axioml∞p** — the infinity glyph replaces the
> "oo" in "loop" (see `.brand__inf` in `styles.css`). Screen readers still hear "axiomloop"
> via the visually-hidden `oo`.

Enterprise-grade, single-page marketing site for a deep-tech company working across
**IoT · WebAssembly · eBPF · RFID · Observability · Graph-based validation**.

Built to feel premium but stay lightweight — pure static HTML/CSS/JS with a tasteful
Three.js graph-network hero. Zero build step, GitHub-Pages ready.

## Stack
- Static HTML + CSS (custom design system, no framework)
- Vanilla JS (nav, scroll-reveal, animated stats)
- [Three.js](https://threejs.org/) r128 (UMD via CDN) for the 3D node/graph hero
- Google Fonts: Inter, Space Grotesk, JetBrains Mono

## Structure
```
index.html
.nojekyll                 # tell GitHub Pages to serve assets/ as-is
assets/
  css/styles.css          # design tokens + all styling
  js/three-hero.js        # 3D graph-network background
  js/main.js              # nav, reveal, count-up
  img/favicon.svg
```

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages
1. Push this folder to a GitHub repo.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Pick your branch and `/ (root)`. Save.
4. Site goes live at `https://<user>.github.io/<repo>/`.

The `.nojekyll` file ensures the `assets/` directory is served untouched.

## Customising
- **Brand name**: find-and-replace `axiomloop` across `index.html` (and the `<title>`/meta).
- **Colors**: edit the `--cyan` / `--violet` / `--blue` / `--grad` tokens at the top of `styles.css`.
- **Copy**: all content lives directly in `index.html` — no CMS, no magic.
- **3D density/perf**: tweak `NODE_COUNT` and `LINK_DIST` in `three-hero.js`.

## Accessibility & performance
- WCAG-minded: skip link, focus-visible outlines, semantic landmarks, reduced-motion support
  (the 3D canvas disables itself when `prefers-reduced-motion` is set).
- Animation pauses when the tab is hidden; pixel ratio capped at 2; node count halved on mobile.
