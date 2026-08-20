import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

/**
 * Pathnames kept out of the sitemap. Astro emits normal routes with a trailing
 * slash but the 404 without one, so both forms are listed rather than trimmed
 * at match time.
 */
const SITEMAP_EXCLUDE = new Set([
  "/404",
  "/privacy-policy",
  "/privacy-policy/",
  "/terms-of-use",
  "/terms-of-use/",
]);

export default defineConfig({
  site: "https://www.vistiq.ai",

  // Webflow markup relies on class attributes only; no scoped-style rewriting needed.
  scopedStyleStrategy: "class",

  build: {
    inlineStylesheets: "auto",
  },

  integrations: [
    sitemap({
      // Routes that exist but should not be advertised to crawlers: the 404 is
      // a real route, and the legal pages carry no search intent.
      filter: (page) => !SITEMAP_EXCLUDE.has(new URL(page).pathname),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});