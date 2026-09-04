import type { Locale } from "@/i18n/config";

/**
 * Flags for the language menu, drawn inline.
 *
 * Not emoji. The regional-indicator pairs (🇹🇷) that every flag emoji is built
 * from have no glyph in the Windows system fonts, so on the largest desktop
 * platform they fall back to rendering the two letters — "TR" beside the word
 * "Türkçe", which is what the menu already said without them. Not an image
 * host either: `img-src` in the CSP does not list one, so the request would be
 * blocked with nothing shown and no visible error.
 *
 * Inline SVG draws the same on every platform, costs no request, and scales.
 * The designs are simplified — the Turkish star and the Union Jack's diagonals
 * are approximations, since at 20x14 the difference is invisible.
 */

const RADIUS = 2.5;

function TR() {
  return (
    <>
      <rect width="20" height="14" fill="#E30A17" />
      <circle cx="7.2" cy="7" r="3.1" fill="#fff" />
      <circle cx="8.3" cy="7" r="2.5" fill="#E30A17" />
      <path
        d="M11.9 7 13.9 6.35 12.66 8.05 12.66 5.95 13.9 7.65Z"
        fill="#fff"
      />
    </>
  );
}

function GB() {
  return (
    <>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0 20 14M20 0 0 14" stroke="#fff" strokeWidth="2.8" />
      <path d="M0 0 20 14M20 0 0 14" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4.6" />
      <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2.8" />
    </>
  );
}

/** Three equal horizontal bands, top to bottom. */
function Bands({ colors }: { colors: [string, string, string] }) {
  return (
    <>
      <rect width="20" height="4.667" y="0" fill={colors[0]} />
      <rect width="20" height="4.667" y="4.667" fill={colors[1]} />
      <rect width="20" height="4.666" y="9.334" fill={colors[2]} />
    </>
  );
}

function PL() {
  return (
    <>
      <rect width="20" height="7" fill="#fff" />
      <rect width="20" height="7" y="7" fill="#DC143C" />
    </>
  );
}

const FLAGS: Record<Locale, React.ReactNode> = {
  tr: <TR />,
  en: <GB />,
  de: <Bands colors={["#000000", "#DD0000", "#FFCE00"]} />,
  pl: <PL />,
  ru: <Bands colors={["#FFFFFF", "#0039A6", "#D52B1E"]} />,
  nl: <Bands colors={["#AE1C28", "#FFFFFF", "#21468B"]} />,
};

export default function FlagIcon({
  locale,
  className = "",
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 14"
      width="20"
      height="14"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {/* The corners are rounded by a clip rather than a CSS radius so the
          shape holds wherever the icon is dropped, and a hairline overlay
          keeps a white band (Poland, the Netherlands) from disappearing into
          a white menu. */}
      <clipPath id={`flag-clip-${locale}`}>
        <rect width="20" height="14" rx={RADIUS} ry={RADIUS} />
      </clipPath>
      <g clipPath={`url(#flag-clip-${locale})`}>{FLAGS[locale]}</g>
      <rect
        width="20"
        height="14"
        rx={RADIUS}
        ry={RADIUS}
        fill="none"
        stroke="rgba(0,0,0,0.14)"
        strokeWidth="1"
      />
    </svg>
  );
}
