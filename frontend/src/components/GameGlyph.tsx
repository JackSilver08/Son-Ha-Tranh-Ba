export const WOODCUTS = [
  'capital','province','infantry','archer','cavalry','militia',
  'food','timber','ore','stone','gold','lord','terrain','political',
  'map','order','locate','flag','build'
] as const;
export type WoodcutName = (typeof WOODCUTS)[number];
export const woodcutUrl = (name: WoodcutName): string => `/assets/woodcuts/${name}.svg`;

type GameGlyphProps = {
  name: WoodcutName;
  className?: string;
  title?: string;
  decorative?: boolean;
};
/** Shared hand-authored SVG icon vocabulary, matching the assets used in PixiJS. */
export function GameGlyph({ name, className, title, decorative = true }: GameGlyphProps) {
  return <img
    className={`game-glyph ${className ?? ''}`}
    src={woodcutUrl(name)}
    alt={decorative ? '' : title ?? name}
    aria-hidden={decorative ? true : undefined}
    draggable={false}
    loading="eager"
  />;
}
