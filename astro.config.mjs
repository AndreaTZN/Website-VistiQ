import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://www.vistiq.ai",

  // Webflow markup relies on class attributes only; no scoped-style rewriting needed.
  scopedStyleStrategy: "class",

  build: {
    inlineStylesheets: "auto",
  },

  integrations: [
    sitemap({
      // The 404 is a real route, so the sitemap would list it otherwise.
      filter: (page) => !page.endsWith("/404"),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});