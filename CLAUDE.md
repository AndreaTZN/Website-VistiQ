# VistIQ — Marketing website

Static marketing site for **VistIQ**, an AI investment operating system for private markets.
The codebase is a Webflow export ported to Astro: the markup and CSS class names come from
Webflow, the interactions were rewritten by hand in GSAP.

## Stack

- **Framework**: Astro 7 (static output, no UI framework — `.astro` components only)
- **Language**: plain JavaScript, typed through JSDoc. `tsconfig.json` extends
  `astro/tsconfigs/base` with `allowJs: true` / `checkJs: false` — the editor reads the JSDoc
  for IntelliSense, but the scripts are not type-checked. `.astro` frontmatter is still
  TypeScript (see the `Props` interface in `BaseLayout`).
- **Styling**: Tailwind CSS v4, via `@tailwindcss/vite` (no `tailwind.config.js` — the theme
  is declared in a CSS `@theme` block). Utilities in the markup are the default; the CSS files
  under `src/styles/` hold what utilities can't express, and are imported through a single
  `main.css`.
- **Animations**: GSAP — always use GSAP (never CSS transitions, never another library)
- **Smooth scroll**: Lenis, driven by the GSAP ticker
- **WebGL**: three.js — only in [globe-particles.js](src/scripts/globe-particles.js)
- **Sitemap**: `@astrojs/sitemap`, registered in [astro.config.mjs](astro.config.mjs)
- **Package manager**: pnpm

No slider library: the testimonial carousel and the mobile coverage slider are hand-written
in [testimonials.js](src/scripts/testimonials.js) and
[coverage-slider.js](src/scripts/coverage-slider.js).

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
  pages/                 # index, contact, request-a-demo, 404
  layouts/BaseLayout.astro   # <head>, meta/OG, font preloads, reveal guard
  components/global/     # chrome reused across pages: Nav, AnnouncementBar, SubFooter, FooterV2
  components/home/       # index-only sections: HeroV2 (+HeroV2Cards), ValueProp, HowItWorks, Coverage, Benefits, Architecture, Testimonials, Security
  components/contact/    # contact page: ContactHero, ContactForm
  components/demo/       # request-a-demo page: DemoHero
  components/ui/         # Button, Corners, Eyebrow, Dock — shared primitives
  scripts/               # main.js entry + one module per behaviour
  styles/                # main.css (Tailwind import + @theme) → base/ · components/ · sections/
  assets/                # images imported through astro:assets (benefits, testimonials)
public/
  images/                # AVIF/PNG/SVG exports from Webflow (+ per-section subfolders)
  fonts/                 # Inter (400/500/600) + FacultyGlyphic, woff2
  robots.txt · llms.txt  # crawler + AI-assistant metadata, served as-is
```

`index.astro` composes section components inside `BaseLayout`, then loads behaviour with a
single `<script>import '../scripts/main';</script>`. Astro bundles it — never add inline
handlers. `404.astro` skips both `main` and the baseline (no nav, no menu, no footer year, one
viewport tall) and imports only `initButtonCharacterStagger` from `scripts/buttons`.

Two image pipelines coexist, on purpose: `src/assets/` goes through `astro:assets`
(`<Image>` emits WebP variants and a srcset — see [Benefits.astro](src/components/home/Benefits.astro)),
while `public/images/` is copied verbatim for SVGs and anything referenced from CSS.

## Scripts — baseline vs page entry

Behaviour is split in two, so a new page doesn't pay for the home page's WebGL:

- **[baseline.js](src/scripts/baseline.js)** — what every page gets: `initSmoothScroll()`
  (**first**, the section modules register ScrollTriggers that must read positions after Lenis
  has taken over), `initMenu()`, `initButtonCharacterStagger()`, `initYear()`. It imports no
  section module and **no three.js**.
- **[main.js](src/scripts/main.js)** — the home page's entry: `initBaseline()`, then the
  home-only sections, then `revealPage()` **last**.

A new page imports `baseline` plus only the sections it uses, then calls `revealPage()` if it
passes `animated`. Transitive JS cost today (measured on `dist/`): home ~683 KB, `/contact`
~133 KB, `/request-a-demo` ~71 KB (no baseline — no Lenis), `/404` ~0 KB.

Home order after `initBaseline()`: `initHowItWorksVideo()` → `initAccordions()` →
`initTestimonials()` → `initAnimations()` → `initGlobeParticles()` → `initGlobeParticles(".sub-footer_section", { introOnEnter: true })`
→ `initCoveragePattern()` → `initArchitectureCards()` → `initHeroCards()` → `initChatbox()` →
`initDock()` → `initWatermark()` → `revealPage()`

The other pages compose their own entry in a `<script>` block instead of importing `main`:

| Page               | Entry                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| `index`            | `import '../scripts/main'`                                                   |
| `contact`          | `initBaseline()` + `initContactForm()` + `initWatermark()`                    |
| `request-a-demo`   | `initButtonCharacterStagger()` + `initContactForm()` + `initDemoClose()`      |
| `404`              | `initButtonCharacterStagger()` only                                          |

| Module                                                     | Responsibility                                                  |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [baseline.js](src/scripts/baseline.js)                     | Shared chrome: smooth scroll, menu, buttons, year               |
| [reveal.js](src/scripts/reveal.js)                         | `revealPage()` — lifts the reveal guard, called last            |
| [smooth-scroll.js](src/scripts/smooth-scroll.js)           | Lenis instance, GSAP ticker integration                         |
| [menu.js](src/scripts/menu.js)                             | Mobile menu (ported from Webflow IX2)                           |
| [buttons.js](src/scripts/buttons.js)                       | Per-character split of button labels                            |
| [accordion.js](src/scripts/accordion.js)                   | Benefits accordion + its visual — desktop widths only           |
| [testimonials.js](src/scripts/testimonials.js)             | Testimonials auto-playing carousel, word stagger, progress bars |
| [animations.js](src/scripts/animations.js)                 | Scroll scenes — currently a placeholder, nav scene parked       |
| [globe-particles.js](src/scripts/globe-particles.js)       | three.js particle ring background                               |
| [coverage-pattern.js](src/scripts/coverage-pattern.js)     | Coverage background pattern — crosses face the cursor           |
| [architecture-cards.js](src/scripts/architecture-cards.js) | Architecture card visuals (sources, agents, memory)             |
| [hero-cards.js](src/scripts/hero-cards.js)                 | Hero floating cards                                             |
| [chatbox.js](src/scripts/chatbox.js)                       | Hero chatbox teaser — wired to nothing, makes no request        |
| [watermark.js](src/scripts/watermark.js)                   | Footer watermark, emboss light follows the cursor               |
| [coverage-slider.js](src/scripts/coverage-slider.js)       | Coverage lifecycle pager — progressive enhancement over a native-scrolling grid, controls stay hidden without real overflow |
| [dock.js](src/scripts/dock.js)                             | Floating section dock — label follows the section on screen. `SECTIONS` must mirror `DOCK_SECTIONS` in [Dock.astro](src/components/ui/Dock.astro) |
| [how-it-works-video.js](src/scripts/how-it-works-video.js) | Background video — playback gated on reduced motion and visibility (~16 MB of sources, so nothing loads beyond metadata until close) |
| [contact-form.js](src/scripts/contact-form.js)             | Contact + demo form: validates in JS (`novalidate`), POSTs to `PUBLIC_CONTACT_ENDPOINT` if set, otherwise falls back to the Typeform in `data-fallback` |
| [demo-close.js](src/scripts/demo-close.js)                 | Close button on `/request-a-demo` — `history.back()` only for a same-origin referrer, else the anchor's href |

`initGlobeParticles()` is called **twice** — once with no argument, once with
`".sub-footer_section"` and `{ introOnEnter: true }` (the sub-footer is far down the page, so
its ~6.3s intro is held until the section scrolls in rather than being over on arrival) —
because the same ring renders behind two sections. Each call builds
its own WebGL context, so both are gated on visibility: a ScrollTrigger flips a flag and the
ticker skips `renderer.render()` while its section is offscreen. Only the draw call is skipped
— `uTime` and the entrance timeline keep running, so the ring is already settled when the
section scrolls in rather than replaying its intro.

Every `init*` already no-ops when its DOM is absent (early return, or an empty
`querySelectorAll` loop), so a module landing on a page without its section is harmless. Keep
that property when adding one.

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

Every animated module guards on `(prefers-reduced-motion: reduce)` — `accordion`,
`architecture-cards`, `chatbox`, `contact-form`, `coverage-pattern`, `coverage-slider`, `dock`,
`globe-particles`, `hero-cards`, `how-it-works-video`, `testimonials`, `watermark` — each
returns early, so its reveal targets are shown immediately instead of animating in.

`smooth-scroll` is the exception: Lenis is installed unconditionally, so smooth scrolling is
**not** disabled under reduced motion. Treat that as a known gap, not as the pattern to copy —
any new animation must carry the guard (or `gsap.matchMedia()`).

## Reveal guard (flash prevention)

Pages that animate pass `animated` to `BaseLayout` (today only `index.astro`). That adds
`.has-reveals` on `<html>` and inlines a style hiding reveal targets until `.is-ready` lands.

`revealPage()` in [reveal.js](src/scripts/reveal.js) adds that class, and the page entry calls
it **last** — after every animating module has written its hidden state as inline styles, so
dropping the CSS guard cannot flash. It lives outside the section modules on purpose: a page
that has no hero (or no sections at all) still reveals itself. **An `animated` page that never
calls `revealPage()` stays invisible.**

If you add a new reveal target, add its selector to that inline style in
[BaseLayout.astro](src/layouts/BaseLayout.astro) — otherwise it flashes in its final state.

## Styling — Tailwind v4

Tailwind is wired through the Vite plugin in [astro.config.mjs](astro.config.mjs). **There is
no `tailwind.config.js`** — v4 is configured in CSS, in the `@theme` block at the top of
[main.css](src/styles/main.css).

**Write utilities in the markup first.** Reach for a CSS file only when utilities genuinely
can't express it: a shape driven by custom properties the scripts write to
([corners.css](src/styles/components/corners.css)), a keyframed or measured effect, or a
Webflow class a script still queries by name.

### The theme

`@theme` in `main.css` declares the design tokens, and Tailwind derives utilities from them —
so a token is used as `bg-beige` / `text-light-black` / `font-facultyglyphic`, not as a raw
`var()`:

| Token group   | Names                                                     | Utilities                        |
| ------------- | --------------------------------------------------------- | -------------------------------- |
| `--color-*`   | `white`, `light-black`, `beige`, `beige-dark`, `sage`, `green` | `bg-*`, `text-*`, `border-*` |
| `--font-*`    | `inter` (body), `facultyglyphic` (display)                | `font-inter`, `font-facultyglyphic` |
| `--breakpoint-*` | `tablet` 991px, `mobile-landscape` 767px, `mobile` 479px | `max-tablet:`, `max-mobile-landscape:`, `max-mobile:` |

The breakpoints are **named after the Webflow ones and used max-width first** — the design is
desktop-down, so `max-tablet:` is the common direction, not `md:`. Don't redefine `sm`/`md`/`lg`
to mean something non-standard, and don't hardcode a pixel query when a named variant exists.

Colours outside the theme appear as arbitrary values with the alpha baked in
(`text-[#1d1e2199]`, `bg-[#1d1e211a]`) — that's the convention for the Webflow greys that were
never tokens.

### Cascade order — still load-bearing

`main.css` imports in a deliberate order: `tailwindcss` + `@theme` → `base/` → `components/` →
`sections/` → `base/globals.css`. **Keep it when adding an import** — several project rules win
by source order, not specificity, and `globals.css` comes last on purpose (it holds what were
inline `<style>` embeds in the Webflow export and must override everything above).

Importing `tailwindcss` first is for readability, not correctness: Tailwind's output lives in
internal `@layer` blocks, which the cascade-layers spec always ranks below un-layered rules. So
every project rule outranks a utility regardless of import order — which also means **a utility
in the markup will not override a section rule targeting the same element.** Fix the CSS rather
than stacking `!` on the utility.

### Rules that survive the migration

- **Always size and space in `rem`, never `px`** — including inside arbitrary values
  (`tracking-[-0.00875rem]`, `inset-[0.125em]`). The root font-size is fluid
  ([fluid-type.css](src/styles/base/fluid-type.css)), so every rem scales with the viewport
  instead of stepping at breakpoints. A `px` arbitrary value silently opts out of that.
- Class names in the remaining CSS follow the Webflow export convention: `section_element` /
  `architecture_memory-chip` / `is-*` variants. Match it there — don't introduce BEM.
- A section that still needs CSS gets one file in `styles/sections/` plus one import in
  `main.css`. `main.css` is the single entry point — no page imports its own stylesheet.
- `@apply` is used sparingly, only in [globals.css](src/styles/base/globals.css), to give a
  Webflow class a Tailwind body (`.noise`, `.container-medium`, `.image-fit-cover`). Prefer
  utilities in the markup over adding a new `@apply` class.

## JS hooks — `data-*`, not `id`

Scripts target elements through classes and `data-*` attributes, never `id`:

| Attribute                                                                               | Used by                    |
| --------------------------------------------------------------------------------------- | -------------------------- |
| `data-el="year"`                                                                        | current year injection     |
| `data-menu-open` / `data-menu-close`                                                    | menu triggers              |
| `data-lenis-stop` / `data-lenis-start`                                                  | scroll lock (Lenis' own)   |
| `data-button-animate`, `data-button-animate-chars`, `data-button-animate-bg`            | button hover               |
| `data-accordion*` (`-item`, `-trigger`, `-panel`, `-visual`, `-illu`, `-square`)        | Benefits accordion         |
| `data-testimonials`, `data-testimonial-*` (`quote`, `text`, `picture`, `dot`, `dot-fill`) | Testimonials carousel      |
| `data-chatbox`, `data-chatbox-input`, `data-chatbox-send`                               | hero chatbox               |
| `data-coverage-slider` (+ `-viewport`, `-track`, `-step`, `-controls`, `-prev`, `-next`, `-dots`) | Coverage lifecycle pager |
| `data-dock` (+ `-prev`, `-next`, `-label`, `-index`, `-announce`)                       | section dock               |
| `data-how-it-works-video`                                                               | gated background video     |
| `data-contact-form` (+ `-status`, `-submit`, `-submit-label`), `data-fallback`          | contact / demo form        |
| `data-demo-close`                                                                       | `/request-a-demo` close button |
| `data-line`                                                                             | line-drawing scroll scenes |

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
(see [index.astro](src/pages/index.astro), which declares `Organization` + `WebSite`).

- **Sitemap**: generated at build by `@astrojs/sitemap` → `dist/sitemap-index.xml`. A `filter`
  in [astro.config.mjs](astro.config.mjs) keeps `/404` out. New pages are picked up
  automatically — nothing to maintain by hand.
- **[robots.txt](public/robots.txt)**: static. AI crawlers are listed and **allowed** on
  purpose (VistIQ wants to be citable); the file documents how to opt out of training while
  staying citable. `Disallow: /_astro/`.
- **[llms.txt](public/llms.txt)**: product summary for AI assistants. It restates section
  copy, so update it when Coverage/Benefits/Security wording changes.
- Both live in `public/` and are served verbatim at the domain root.

## Conventions

- Fonts: **Inter** (body) and **Facultyglyphic** (display), self-hosted, preloaded in the layout
- Comments only when the WHY is non-obvious (the ported modules document the original Webflow
  timings they reproduce — keep that when touching them)
- Components are filed by scope: `global/` when more than one page uses it (or it is page
  chrome), `<page>/` when it belongs to a single page, `ui/` for shared primitives. A section
  promoted to a second page moves to `global/`. Stylesheets keep their flat `styles/sections/`
  layout — the folders above only apply to `components/`.
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
