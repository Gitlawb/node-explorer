declare module '@shuding/opentype.js' {
  export interface OpenTypeFont {
    charToGlyphIndex(character: string): number;
  }

  export function parse(buffer: ArrayBuffer): OpenTypeFont;
}
