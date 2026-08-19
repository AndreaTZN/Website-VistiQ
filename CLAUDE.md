# VistIQ — Marketing website

Static marketing site for **VistIQ**, an AI investment OS for private markets.
Webflow export ported to Astro: markup and CSS class names come from Webflow, the
interactions were rewritten by hand in GSAP.

## Stack

- **Astro 7**, static output, `.astro` components only — no UI framework
- **JS + JSDoc** (`checkJs: false` — scripts aren't type-checked; `.astro` frontmatter is TS)
- **Tailwind v4** via `@tailwindcss/vite` — no `tailwind.config.js`, theme lives in the
  `@theme` block of [main.css](src/styles/main.css)
- **GSAP** for every animation (never CSS transitions, never another library)
- **Lenis** for smooth scroll, driven by the GSAP ticker
- **three.js** only in [globe-particles.js](src/scripts/globe-particles.js)
- **pnpm** · `pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm check`

No slider library — testimonials and the coverage slider are hand-written.

## Structure

```
src/
  pages/         index, contact, request-a-demo, 404
  layouts/       BaseLayout.astro — head, meta/OG, fonts, reveal guard
  components/    global/ (multi-page chrome) · home/ · contact/ · demo/ · ui/ (primitives)
  scripts/       main.js entry + one module per behaviour
  styles/        main.css → base/ · components/ · sections/
  assets/        images via astro:assets
public/images/   Webflow exports, copied verbatim (SVG + anything used from CSS)
public/fonts/    Inter 400/500/600 + FacultyGlyphic
```

Components are filed by scope: `global/` when more than one page uses it, `<page>/` when it
belongs to a single page, `ui/` for shared primitives. Stylesheets stay flat in
`styles/sections/`.

## Scripts

Behaviour is split so a new page doesn't pay for the home page's WebGL:

- **[baseline.js](src/scripts/baseline.js)** — every page: `initSmoothScroll()` **first**
  (section modules register ScrollTriggers that must read positions after Lenis takes over),
  then menu, buttons, year. No section module, no three.js.
- **[main.js](src/scripts/main.js)** — home entry: `initBaseline()`, home sections,
  `revealPage()` **last**.
- Other pages compose their own entry in a `<script>` block (see the page files).

Every `init*` no-ops when its DOM is absent — keep that property when adding one.
`initGlobeParticles()` runs twice (hero + `.sub-footer_section`); each builds its own WebGL
context, both gated on visibility.

## Rules that matter

**Lenis** — import the exported `lenis` from [smooth-scroll.js](src/scripts/smooth-scroll.js),
never create a second one. It scrolls `window` (no scroll wrapper, so don't set ScrollTrigger's
`scroller`). Lock with `lenis?.stop()` / `lenis?.start()`, never `body { overflow }`.

**Reduced motion** — every animated module returns early on `(prefers-reduced-motion: reduce)`
and shows its targets immediately. Any new animation must carry the guard (or
`gsap.matchMedia()`). `smooth-scroll` is a known exception, not a pattern to copy.

**Reveal guard** — pages passing `animated` to `BaseLayout` hide reveal targets via an inline
style until `revealPage()` runs last. A new reveal selector must be added to that inline style
in [BaseLayout.astro](src/layouts/BaseLayout.astro), or it flashes. An `animated` page that
never calls `revealPage()` stays invisible.

**Cascade** — `main.css` imports `tailwindcss` + `@theme` → `base/` → `components/` →
`sections/` → `base/globals.css` (last on purpose). Keep that order. Tailwind's output is
layered, so **project CSS always outranks a utility** — a utility in the markup will not
override a section rule. Fix the CSS instead of adding `!`.

**rem, never px** — including in arbitrary values (`tracking-[-0.00875rem]`). The root
font-size is fluid ([fluid-type.css](src/styles/base/fluid-type.css)); a `px` value opts out.

**Assets are case-sensitive in prod** (Vercel/Linux, not macOS). Webflow filenames are
irregular (`Card2_1-p-800.avif`) — verify the exact name and extension, never guess.

**JS hooks are `data-*`, never `id`.** Add a new hook as a `data-*` attribute and query it in
the matching module. Leave Webflow's `data-wf--*` attributes untouched.

**Styling** — utilities in the markup first. A CSS file only for what utilities can't express
(script-driven custom properties, keyframes, a Webflow class a script queries). Class names
there follow the Webflow convention (`section_element`, `is-*`) — no BEM. `@apply` only in
`globals.css`.

**SEO** — `BaseLayout` owns title/description/canonical/OG/Twitter; pass props, don't duplicate
tags. JSON-LD goes in the `head` slot. Sitemap is generated at build. Update
[llms.txt](public/llms.txt) when Coverage/Benefits/Security copy changes.

## Theme tokens

| Group            | Names                                                          | Utilities                            |
| ---------------- | -------------------------------------------------------------- | ------------------------------------ |
| `--color-*`      | `white`, `light-black`, `beige`, `beige-dark`, `sage`, `green` | `bg-*`, `text-*`, `border-*`         |
| `--font-*`       | `inter`, `facultyglyphic`                                      | `font-inter`, `font-facultyglyphic`  |
| `--breakpoint-*` | `tablet` 991px, `mobile-landscape` 767px, `mobile` 479px       | `max-tablet:` … (max-width first)    |

The design is desktop-down: `max-tablet:` is the common direction, not `md:`. Off-theme Webflow
greys stay arbitrary values with baked alpha (`text-[#1d1e2199]`).

## GSAP skills

`/gsap-core` · `/gsap-timeline` · `/gsap-scrolltrigger` · `/gsap-plugins` · `/gsap-performance` · `/gsap-utils`
