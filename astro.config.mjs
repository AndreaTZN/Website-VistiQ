import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.vistiq.ai",
  // Webflow markup relies on class attributes only; no scoped-style rewriting needed.
  scopedStyleStrategy: "class",
  build: {
    inlineStylesheets: "auto",
  },
});
