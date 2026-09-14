"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface WhatsAppButtonProps {
  /**
   * Lift the button clear of the mobile sticky bar.
   *
   * Region and blog pages render a sticky bottom bar on phones. The bar is
   * 72px tall plus the home-indicator inset, and this button is z-50 against
   * its z-40 — so at the default offset it lands on top of the booking
   * button. Those pages pass `aboveStickyBar`, which raises it just above the
   * bar on mobile and leaves the desktop position untouched, since the bar is
   * not rendered there at all.
   */
  aboveStickyBar?: boolean;
}

/* ─── The nudge ──────────────────────────────────────────────────────────────
 * A one-line offer of help beside the button. The whole point is that it is
 * easy to ignore, so it is bounded on every side: it waits, it shows once a
 * day, it leaves on its own, and it never shares the screen with the cookie
 * bar — a visitor meeting both at once is being talked at twice.
 */

/** When the nudge was last shown, so it is offered once a day and not on every page. */
const NUDGE_SEEN_KEY = "TORVIAN_wa_nudge_seen";
const NUDGE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Set by CookieConsent once the visitor has answered it, either way. */
const COOKIE_CONSENT_KEY = "TORVIAN_cookie_consent";

/** Long enough that it reads as an offer rather than a pop-up on arrival. */
const NUDGE_DELAY_MS = 5000;
/** Long enough to read twice; after that it withdraws rather than sitting there. */
const NUDGE_VISIBLE_MS = 15000;
/** Stop waiting for the cookie bar to be answered. */
const NUDGE_GIVE_UP_MS = 60000;

function nudgeIsDue(): boolean {
  try {
    // Until the cookie bar is answered it owns the bottom of the screen.
    if (!window.localStorage.getItem(COOKIE_CONSENT_KEY)) return false;
    const seen = Number(window.localStorage.getItem(NUDGE_SEEN_KEY));
    return !seen || Date.now() - seen > NUDGE_INTERVAL_MS;
  } catch {
    // Storage blocked: no way to remember having shown it, so never start.
    return false;
  }
}

function markNudgeSeen(): void {
  try {
    window.localStorage.setItem(NUDGE_SEEN_KEY, String(Date.now()));
  } catch {
    /* nothing to remember it with — the nudge simply came and went */
  }
}

export default function WhatsAppButton({ aboveStickyBar = false }: WhatsAppButtonProps = {}) {
  const t = useTranslations("common");
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "902426060763";
  const message = encodeURIComponent(t("whatsappMessage"));
  const href = `https://wa.me/${phone}?text=${message}`;

  /* Two flags, not one: `mounted` puts the card in the DOM in its closed
     state and `open` is flipped a frame later, which is what gives the
     transition something to animate from. */
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const closeNudge = useCallback(() => {
    setOpen(false);
    markNudgeSeen();
    // Leave it in the DOM until the fade has finished.
    setTimeout(() => setMounted(false), 300);
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    // Polled rather than checked once: the cookie bar is usually still
    // unanswered when this mounts, and a visitor who accepts it a second later
    // should still be offered the nudge on the page they are already reading.
    const poll = setInterval(() => {
      const waited = Date.now() - startedAt;
      if (waited > NUDGE_GIVE_UP_MS) {
        clearInterval(poll);
        return;
      }
      if (waited < NUDGE_DELAY_MS || !nudgeIsDue()) return;
      clearInterval(poll);
      setMounted(true);
      openTimer = setTimeout(() => setOpen(true), 30);
      hideTimer = setTimeout(closeNudge, NUDGE_VISIBLE_MS);
    }, 1000);

    return () => {
      clearInterval(poll);
      clearTimeout(openTimer);
      clearTimeout(hideTimer);
    };
  }, [closeNudge]);

  return (
    /* One fixed box holding both, so the nudge is placed by the button rather
       than by its own set of offsets that would have to be kept in step with
       `aboveStickyBar`. The row reverses under `dir="rtl"` on its own, which
       puts the card on the inward side of the button in either direction. */
    <div
      className={`fixed end-4 sm:end-6 z-50 flex items-end gap-2.5 ${
        aboveStickyBar
          ? "bottom-[calc(84px+env(safe-area-inset-bottom))] sm:bottom-6"
          : "bottom-5 sm:bottom-6"
      }`}
    >
      {mounted && (
        <div
          className={`relative mb-0.5 transition-all duration-300 ease-out ${
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeNudge}
            className="block max-w-[190px] rounded-2xl bg-white/95 ps-3.5 pe-4 py-2.5 text-start shadow-[0_6px_24px_rgba(0,0,0,0.16)] ring-1 ring-black/[0.06] backdrop-blur transition-colors hover:bg-white"
          >
            <span className="block text-[13px] font-semibold leading-snug text-gray-900">
              {t("whatsappNudgeTitle")}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
              {t("whatsappNudgeBody")}
            </span>
          </a>
          {/* On the outer corner, away from the button, so dismissing it is
              never a near-miss on the thing it is pointing at. */}
          <button
            type="button"
            onClick={closeNudge}
            aria-label={t("whatsappNudgeClose")}
            className="absolute -top-2 -start-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-400 shadow-md ring-1 ring-black/[0.06] transition-colors hover:text-gray-700"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
        onClick={closeNudge}
        className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform hover:scale-105"
      >
        {/* The mark brings its own green disc and white ring, so the button is
            the artwork itself rather than a tinted square around a line icon.
            The depth is a drop-shadow on the image and not a box-shadow on the
            link: a box-shadow traces the link's own square-ish box, which sits
            outside the disc and read as a second faint circle behind it. */}
        <Image
          src="/images/whatsapp.png"
          alt=""
          width={128}
          height={128}
          className="w-full h-full drop-shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
