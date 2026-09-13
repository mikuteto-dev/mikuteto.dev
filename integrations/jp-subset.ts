/// <reference path="../types/subset-font.d.ts" />
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import subsetFont from "subset-font";

/**
 * Japanese webfonts are ~800KB per weight, and the usual fix (Fontsource's
 * ~120 unicode-range subsets) costs 108KB of @font-face CSS per weight before a
 * single glyph is fetched. Splitting one file per character is worse still: WOFF2
 * carries a fixed per-file table overhead, and you would need one @font-face rule
 * per codepoint.
 *
 * A static build knows its own text, so we cut the exact glyph set instead:
 * scan the emitted HTML/JS/CSS, collect every CJK codepoint that can reach the
 * screen, and bake a single subset containing only those.
 */

const CJK =
  /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/u;

const SCANNED = new Set([".html", ".js", ".css"]);

type Options = {
  /** Path to a full-coverage source font, relative to the project root. */
  source: string;
  /** CSS font-family name to declare. */
  family: string;
  weight?: string;
};

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectFiles(full)));
    else if (SCANNED.has(extname(entry.name))) out.push(full);
  }
  return out;
}

export function jpSubset(options: Options): AstroIntegration {
  const { source, family, weight = "400" } = options;

  return {
    name: "jp-subset",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const files = await collectFiles(outDir);

        const glyphs = new Set<string>();
        for (const file of files) {
          const text = await readFile(file, "utf8");
          for (const ch of text) if (CJK.test(ch)) glyphs.add(ch);
        }

        const htmlFiles = files.filter((f) => f.endsWith(".html"));

        if (glyphs.size === 0) {
          logger.info("no CJK glyphs in output, skipping Japanese webfont");
          return;
        }

        // Sorted by codepoint purely so the subset (and its hash) is stable
        // across builds when the glyph set has not changed.
        const chars = [...glyphs]
          .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
          .join("");
        const original = await readFile(source);
        const subset = await subsetFont(original, chars, {
          targetFormat: "woff2",
        });

        const hash = createHash("sha256")
          .update(subset)
          .digest("hex")
          .slice(0, 8);
        const fontName = `jp-subset.${hash}.woff2`;
        await writeFile(join(outDir, "_astro", fontName), subset);

        const style = [
          "<style>@font-face{",
          `font-family:"${family}";`,
          "font-style:normal;",
          `font-weight:${weight};`,
          "font-display:swap;",
          `src:url("/_astro/${fontName}") format("woff2");`,
          "}</style>",
        ].join("");

        for (const file of htmlFiles) {
          const html = await readFile(file, "utf8");
          if (html.includes(fontName)) continue;
          await writeFile(file, html.replace("</head>", `${style}</head>`));
        }

        const kb = (subset.length / 1024).toFixed(1);
        logger.info(
          `subset ${glyphs.size} glyph(s) into ${fontName} (${kb}KB), from ${(
            original.length / 1024
          ).toFixed(0)}KB source`,
        );
      },
    },
  };
}
