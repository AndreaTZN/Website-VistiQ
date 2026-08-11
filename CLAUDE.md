# VistIQ — Marketing website

Static marketing site for **VistIQ**, an AI investment operating system for private markets.
The codebase is a Webflow export ported to Astro: the markup and CSS class names come from
Webflow, the interactions were rewritten by hand in GSAP.

## Stack

- **Framework**: Astro 5 (static output, no UI framework — `.astro` components only)
- **Language**: plain JavaScript, typed through JSDoc. `tsconfig.json` extends
  `astro/tsconfigs/base` with `allowJs: true` / `checkJs: false` — the editor reads the JSDoc
  for IntelliSense, but the scripts are not type-checked. `.astro` frontmatter is still
  TypeScript (see the `Props` interface in `BaseLayout`).
- **Styling**: plain CSS with custom properties, imported through a single `main.css`
- **Animations**: GSAP — always use GSAP (never CSS transitions, never another library)
- **Smooth scroll**: Lenis, driven by the GSAP ticker
- **Sliders**: Swiper 11
- **Package manager**: pnpm

## Commands

```bash
pnpm dev       # astro dev
pnpm build     # astro build → dist/
pnpm preview   # serve the build
pnpm check     # astro check (TypeScript + template diagnostics)
```

## Project structure

```
src/
  pages/                 # index, 404, style-guide
  layouts/BaseLayout.astro   # <head>, meta/OG, font preloads, reveal guard
  components/sections/   # Nav, Hero, Bloc01…Bloc06, Slider, SubFooter, Footer
  scripts/               # main.js entry + one module per behaviour
  styles/                # base/ · components/ · pages/ · sections/, via main.css
public/
  images/                # AVIF exports from Webflow (+ a few svg/png)
  fonts/                 # Inter (400/500/600) + FacultyGlyphic, woff2
```

`index.astro` composes section components inside `BaseLayout`, then loads behaviour with a
single `<script>import '../scripts/main';</script>`. Astro bundles it — never add inline
handlers. The lighter pages (`404`, `style-guide`) skip `main` and import only
`initButtonCharacterStagger` from `scripts/buttons`.

## Scripts — entry order matters

[main.js](src/scripts/main.js) runs the init functions in a fixed order:

1. `initSmoothScroll()` **first** — the other modules register ScrollTriggers that must read
   positions after Lenis has taken over scrolling
2. `initMenu()` → `initSliders()` → `initAnimations()` → `initReveals()` → `initYear()`

| Module                                           | Responsibility                                       |
| ------------------------------------------------ | ---------------------------------------------------- |
| [smooth-scroll.js](src/scripts/smooth-scroll.js) | Lenis instance, GSAP ticker integration              |
| [menu.js](src/scripts/menu.js)                   | Mobile menu (ported from Webflow IX2)                |
| [sliders.js](src/scripts/sliders.js)             | Swiper instances, declared in the `SLIDERS` array    |
| [animations.js](src/scripts/animations.js)       | Hero/footer drifting SVG shapes, Flip, scroll scenes |
| [buttons.js](src/scripts/buttons.js)             | Per-character split of button labels                 |
| [reveals.js](src/scripts/reveals.js)             | Scroll reveals (ported from Webflow IX3)             |

`initYear()` lives in `main.js` itself. `buttons.js` has no `init*` entry in that list — it is
called by [animations.js](src/scripts/animations.js), and imported directly by the pages that
don't load `main`.

## Scroll — Lenis

- The instance is exported as `lenis` from [smooth-scroll.js](src/scripts/smooth-scroll.js)
  (`null` until `initSmoothScroll()` runs). Import it, don't create a second one.
- Lenis scrolls `window`/`document` — there is **no** custom scroll wrapper, so ScrollTrigger
  uses its default scroller. Do not set a `scroller` option.
- `lenis.on('scroll', ScrollTrigger.update)` keeps the two in sync; `gsap.ticker` drives
  `lenis.raf()` and `lagSmoothing(0)` is set.
- Lock/unlock the scroll with `lenis?.stop()` / `lenis?.start()` (see the menu) — never touch
  `body { overflow }`.
- Anchor links are handled by Lenis (`anchors: true`).

## Reduced motion

`initSmoothScroll()` and `initReveals()` both bail out on
`(prefers-reduced-motion: reduce)` — native scrolling stays intact and reveal targets are
shown immediately. Any new animation must respect the same guard (or `gsap.matchMedia()`).

## Reveal guard (flash prevention)

Pages that animate pass `animated` to `BaseLayout`. That adds `.has-reveals` on `<html>` and
inlines a style hiding reveal targets until `initReveals()` sets `.is-ready`. If you add a new
reveal target, add its selector to that inline style in
[BaseLayout.astro](src/layouts/BaseLayout.astro) — otherwise it flashes in its final state.

## Styling

- Everything is imported by [main.css](src/styles/main.css) in a deliberate cascade order:
  `normalize → webflow-reset → webflow-components → fonts → tokens → fluid-type → elements →
utilities → grid-nodes → components/* → sections/* → globals`. **Several rules win by
  source order, not specificity — keep the order when adding an import.**
- `globals.css` comes last on purpose: it holds what were inline `<style>` embeds in the
  Webflow export, and must override everything above it.
- Design tokens live in [tokens.css](src/styles/base/tokens.css) as Webflow-style custom
  properties (`--base-color--*`, `--size--*`, `--text-color--*`). Use them; don't hardcode.
- Class names follow the Webflow export convention: `section_element` /
  `bloc01_card-bar` / `is-*` variants. Match it — do not introduce BEM or utility classes.
- **Always size and space in `rem`, never `px`.** The root font-size is fluid
  ([fluid-type.css](src/styles/base/fluid-type.css)), so every rem value scales with the
  viewport instead of stepping at breakpoints.
- A new section gets its own file in `styles/sections/` plus one import in `main.css`.
- One exception to the single-entry rule: [styleguide.css](src/styles/pages/styleguide.css)
  is imported by `style-guide.astro` directly, so page-only CSS stays out of the main bundle.

## JS hooks — `data-*`, not `id`

Scripts target elements through classes and `data-*` attributes, never `id`:

| Attribute                                                                    | Used by                    |
| ---------------------------------------------------------------------------- | -------------------------- |
| `data-el="year"`                                                             | current year injection     |
| `data-menu-open` / `data-menu-close`                                         | menu triggers              |
| `data-button-animate`, `data-button-animate-chars`, `data-button-animate-bg` | button hover               |
| `data-select="title"`                                                        | per-character title reveal |

Add a new hook as a `data-*` attribute and query it in the matching module. Keep Webflow's
own `data-wf--*` attributes untouched — the exported CSS variants depend on them.

## Assets — case-sensitivity

Vercel/Linux is case-sensitive, macOS is not: a casing mismatch works locally and 404s in
production. Filenames in `public/images/` come straight from Webflow and are irregular
(`Card2_1-p-800.avif`, `logo-8_1logo-8.avif`). Verify the exact filename and extension before
referencing an asset — never guess `.jpg` vs `.avif`.

## SEO

`BaseLayout` handles title, description, canonical, OG and Twitter tags — pass props, don't
add duplicate tags in a page. JSON-LD goes in the `head` slot as an `is:inline` script
(see [index.astro](src/pages/index.astro)).

## Conventions

- Fonts: **Inter** (body) and **Facultyglyphic** (display), self-hosted, preloaded in the layout
- Comments only when the WHY is non-obvious (the ported modules document the original Webflow
  timings they reproduce — keep that when touching them)
- Prefer editing existing files over creating new ones
- New GSAP plugin → register it in the module that uses it (`gsap.registerPlugin(...)`)

## GSAP skills

Invoke these with `/gsap-*` when needed:

| Skill                | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `gsap-core`          | Tweens, defaults, `gsap.to/from/set`, `matchMedia` |
| `gsap-timeline`      | `gsap.timeline()`, sequencing                      |
| `gsap-scrolltrigger` | Scroll-driven animations                           |
| `gsap-plugins`       | SplitText, Flip, Draggable, etc.                   |
| `gsap-performance`   | Perf best-practices, will-change, GPU layers       |
| `gsap-utils`         | `gsap.utils` helpers                               |
