# VistIQ — Marketing website

Static marketing site for **VistIQ**, an AI investment operating system for private markets.

The codebase started as a Webflow export and was ported to Astro: the markup and CSS class
names still follow the Webflow conventions, while every interaction was rewritten by hand in
GSAP. Output is fully static — no server, no UI framework.

Production: <https://www.vistiq.ai>

## Stack

| Concern          | Choice                                                            |
| ---------------- | ----------------------------------------------------------------- |
| Framework        | [Astro 5](https://astro.build) — static output, `.astro` only     |
| Language         | Plain JavaScript typed through JSDoc (`checkJs: false`)           |
| Styling          | Plain CSS with custom properties, one `main.css` entry            |
| Animations       | [GSAP](https://gsap.com) (ScrollTrigger, SplitText) — never CSS transitions |
| Smooth scroll    | [Lenis](https://lenis.darkroom.engineering), driven by the GSAP ticker |
| Package manager  | pnpm                                                              |

`.astro` frontmatter is still TypeScript (see the `Props` interface in `BaseLayout`); the
scripts under `src/scripts/` are JS and only get editor IntelliSense from their JSDoc.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Dev server with HMR                     |
| `pnpm build`        | Static build → `dist/`                  |
| `pnpm preview`      | Serve the production build locally      |
| `pnpm check`        | `astro check` — TS + template diagnostics |
| `pnpm format`       | Prettier (with `prettier-plugin-astro`) |
| `pnpm format:check` | Prettier in check mode                  |

## Project structure

```
src/
  pages/                     # index, 404, style-guide
  layouts/BaseLayout.astro   # <head>, meta/OG/Twitter, canonical, font preloads
  components/
    sections/                # Nav, HeroV2, Bloc01…Bloc06, FooterV2 (+ legacy Hero/Footer)
    ui/Button.astro
  scripts/                   # main.js entry + one module per behaviour
  styles/                    # base/ · components/ · pages/ · sections/, via main.css
public/
  images/                    # AVIF exports from Webflow (+ a few svg/png)
  fonts/                     # Inter 400/500/600 + FacultyGlyphic, woff2
```

`index.astro` composes the section components inside `BaseLayout`, then loads behaviour with a
single `<script>import '../scripts/main';</script>` that Astro bundles — never add inline
handlers. `404.astro` and `style-guide.astro` skip `main` and import only
`initButtonCharacterStagger` from `scripts/buttons`.

`Hero.astro` / `Footer.astro` and their stylesheets are the pre-V2 versions, kept around but
not used by `index.astro`.

## Scripts — entry order matters

[`src/scripts/main.js`](src/scripts/main.js) runs the init functions in a fixed order:

1. `initSmoothScroll()` **first** — the other modules register ScrollTriggers that must read
   positions after Lenis has taken over scrolling
2. `initMenu()` → `initAccordions()` → `initTestimonials()` → `initAnimations()` → `initYear()`

| Module                                                 | Responsibility                                            |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [`smooth-scroll.js`](src/scripts/smooth-scroll.js)     | Lenis instance, GSAP ticker integration                    |
| [`menu.js`](src/scripts/menu.js)                       | Mobile menu (ported from Webflow IX2)                      |
| [`accordion.js`](src/scripts/accordion.js)             | Single-open accordion, height-animated panels + visual     |
| [`testimonials.js`](src/scripts/testimonials.js)       | Auto-playing quote carousel, SplitText stagger + progress bars |
| [`animations.js`](src/scripts/animations.js)           | Drifting SVG shapes, scroll scenes; calls `initButtonCharacterStagger()` |
| [`buttons.js`](src/scripts/buttons.js)                 | Per-character split of button labels                       |

`initYear()` lives in `main.js` itself. `buttons.js` has no entry in that list — it is called
by `animations.js`, and imported directly by the pages that don't load `main`.

## Scroll — Lenis

- The instance is exported as `lenis` from
  [`smooth-scroll.js`](src/scripts/smooth-scroll.js) (`null` until `initSmoothScroll()` runs).
  Import it — don't create a second one.
- Lenis scrolls `window`/`document`; there is **no** custom scroll wrapper, so ScrollTrigger
  uses its default scroller. Do not set a `scroller` option.
- `lenis.on('scroll', ScrollTrigger.update)` keeps the two in sync; `gsap.ticker` drives
  `lenis.raf()` and `lagSmoothing(0)` is set.
- Lock/unlock with `lenis?.stop()` / `lenis?.start()` (see the menu) — never touch
  `body { overflow }`.
- Anchor links are handled by Lenis (`anchors: true`).

## Reduced motion

`initSmoothScroll()` bails out entirely on `(prefers-reduced-motion: reduce)`, leaving native
scrolling intact; the accordion and testimonial modules keep working but drop to a duration of
`0`. Any new animation must respect the same guard (or use `gsap.matchMedia()`).

## Styling

- Everything is imported by [`main.css`](src/styles/main.css) in a deliberate cascade order:
  `normalize → webflow-reset → webflow-components → fonts → tokens → fluid-type → elements →
  utilities → components/* → sections/* → globals`. **Several rules win by source order, not
  specificity — keep the order when adding an import.**
- `globals.css` comes last on purpose: it holds what were inline `<style>` embeds in the
  Webflow export and must override everything above it.
- Design tokens live in [`tokens.css`](src/styles/base/tokens.css) as Webflow-style custom
  properties (`--base-color--*`, `--size--*`, `--text-color--*`). Use them; don't hardcode.
- Class names follow the Webflow export convention: `section_element`, `bloc01_card-bar`,
  `is-*` variants. Match it — no BEM, no utility classes.
- **Always size and space in `rem`, never `px`.** The root font-size is fluid
  ([`fluid-type.css`](src/styles/base/fluid-type.css)), so every rem value scales with the
  viewport instead of stepping at breakpoints.
- A new section gets its own file in `styles/sections/` plus one import in `main.css`.
- One exception to the single-entry rule:
  [`styleguide.css`](src/styles/pages/styleguide.css) is imported by `style-guide.astro`
  directly, so page-only CSS stays out of the main bundle.

## JS hooks — `data-*`, not `id`

Scripts target elements through classes and `data-*` attributes, never `id`:

| Attribute                                                                    | Used by                        |
| ---------------------------------------------------------------------------- | ------------------------------ |
| `data-el="year"`                                                             | current year injection         |
| `data-menu-open` / `data-menu-close`                                         | menu triggers                  |
| `data-lenis-start` / `data-lenis-stop`                                       | scroll lock                    |
| `data-accordion`, `-item`, `-trigger`, `-panel`, `-square`, `-visual`        | accordion                      |
| `data-testimonials`, `-slide`, `-quote`, `-author`, `-picture`, `-logo`, `-dot`, `-dot-fill` | testimonial carousel |
| `data-button-animate`, `data-button-animate-chars`, `data-button-animate-bg` | button hover                   |

Add a new hook as a `data-*` attribute and query it in the matching module. Keep Webflow's own
`data-wf--*` attributes untouched — the exported CSS variants depend on them.

## Assets — case-sensitivity

Vercel/Linux is case-sensitive, macOS is not: a casing mismatch works locally and 404s in
production. Filenames in `public/images/` come straight from Webflow and are irregular
(`Card2_1-p-800.avif`, `logo-8_1logo-8.avif`). Verify the exact filename and extension before
referencing an asset — never guess `.jpg` vs `.avif`.

## SEO

`BaseLayout` handles title, description, canonical, OG and Twitter tags — pass props, don't
add duplicate tags in a page. JSON-LD goes in the `head` slot as an `is:inline` script (see
[`index.astro`](src/pages/index.astro), which ships `Organization` and `WebSite` schemas).

## Conventions

- Fonts: **Inter** (body) and **Facultyglyphic** (display), self-hosted, preloaded in the layout
- Comments only when the WHY is non-obvious — the ported modules document the original Webflow
  or Figma references they reproduce; keep those when touching them
- Prefer editing existing files over creating new ones
- New GSAP plugin → register it in the module that uses it (`gsap.registerPlugin(...)`)
- Commits: small, atomic, conventional (`feat:`, `fix:`, `refactor:`, `docs:`)

See [CLAUDE.md](CLAUDE.md) for the same conventions in the form consumed by Claude Code.
