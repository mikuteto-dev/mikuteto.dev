// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import { jpSubset } from "./integrations/jp-subset";

// https://astro.build/config
export default defineConfig({
  // Pinned so dev and preview always answer on the same URL.
  server: { port: 4321 },

  integrations: [
    react(),
    // Bakes a Japanese webfont containing only the glyphs this build renders.
    jpSubset({
      source:
        "node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-japanese-400-normal.woff2",
      family: "Zen Kaku Subset",
      weight: "400",
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
