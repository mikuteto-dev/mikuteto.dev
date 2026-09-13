// subset-font ships no type declarations (package.json has `main` only, no
// `types`), and there is no @types/subset-font on npm. This mirrors the API we
// actually use: https://github.com/papandreou/subset-font
declare module "subset-font" {
  export interface SubsetFontOptions {
    /** Output container. Defaults to the input format. */
    targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
    /** OpenType feature tags to retain, e.g. ["palt", "liga"]. */
    preserveNameIds?: number[];
    variationAxes?: Record<
      string,
      number | { min?: number; max?: number; default?: number }
    >;
  }

  /**
   * Cuts `font` down to the glyphs needed to render `text`.
   * @param font  TTF/WOFF/WOFF2 source buffer.
   * @param text  The exact characters to keep.
   */
  export default function subsetFont(
    font: Buffer | Uint8Array,
    text: string,
    options?: SubsetFontOptions,
  ): Promise<Buffer>;
}
