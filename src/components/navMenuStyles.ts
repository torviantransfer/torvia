import type { CSSProperties } from "react";

/**
 * The one look every menu that drops out of the navbar shares — currency,
 * language, the account menu and the overflow menu. They were four separate
 * copies of a near-identical style block that had drifted apart in radius,
 * padding and text size, so opening two of them in a row showed two different
 * menus.
 *
 * Translucent rather than solid: the navbar itself is a blurred pane over the
 * page, and a menu that drops out of it opaque reads as a different surface
 * pasted on top.
 */
export const menuSurface = "shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-black/[0.06]";

export const menuSurfaceStyle: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.82)",
  backdropFilter: "saturate(180%) blur(20px)",
  WebkitBackdropFilter: "saturate(180%) blur(20px)",
};

/** A row in one of those menus: 36px tall, full-width, its own rounded hover. */
export const menuItem =
  "flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-[#1d1d1f] transition hover:bg-black/[0.05]";
