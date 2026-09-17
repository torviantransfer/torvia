"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  User,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { menuSurface, menuSurfaceStyle, menuItem } from "@/components/navMenuStyles";
import Image from "next/image";
import { localeNames, type Locale } from "@/i18n/config";
import CurrencySelector from "./CurrencySelector";
import FlagIcon from "./FlagIcon";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import AuthModal from "./auth/AuthModal";

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Open one popover and close the others.
   *
   * The navbar carries four of them — currency, language, the user menu and
   * the mobile menu — in a strip narrow enough that two open at once overlap.
   * Each trigger used to flip only its own flag, so opening the currency menu
   * left the language menu standing. Routing every trigger through here makes
   * "only one is open" a property of the code rather than of the order the
   * customer happened to click in.
   */
  const openOnly = (which: "currency" | "lang" | "user" | "menu" | null) => {
    setCurrencyOpen(which === "currency");
    setLangOpen(which === "lang");
    setUserMenuOpen(which === "user");
    setMenuOpen(which === "menu");
  };

  // Pages with dark hero images get transparent navbar
  // On booking page, only when NO region is selected (hero is shown)
  const isHeroPage = pathname === "/" || (pathname === "/booking" && !searchParams.get("region"));
  // On non-hero pages, always show dark text (light bg). On hero pages, depends on scroll.
  // `menuOpen` counts too: the mobile panel drops out of the bar as a light
  // surface, so leaving the bar transparent over the hero left a see-through
  // strip sitting on top of a solid white sheet, joined by nothing.
  const showDarkNav = scrolled || !isHeroPage || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    // Read the position we are actually at, not just the ones we scroll to
    // later. A reload or a back-navigation restores the previous offset before
    // this mounts, so on a hero page the bar kept its transparent state over
    // white content — a white logo and white links on white, reading as an
    // empty bar that only fixed itself once the visitor happened to scroll.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        (!mobileMenuRef.current || !mobileMenuRef.current.contains(e.target as Node))
      ) {
        setMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    // Escape closes whatever is open. A popover reachable by keyboard has to
    // be dismissible by keyboard; without this the only way out of the
    // language menu was a mouse click somewhere else on the page.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") openOnly(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Auth state management
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Every source of a name here can be absent. `full_name` and `first_name`
   * are only set when a provider sends them, and an OAuth or phone signup can
   * arrive with no email at all — so `displayName` falls all the way through
   * to "", and `"".charAt(0)` is "".
   *
   * That rendered as an empty coloured circle. On a phone it is the worst
   * place for it to happen: the name beside the avatar is `hidden sm:inline`,
   * so that circle is the only thing on the screen telling the customer they
   * are signed in. A person glyph says it with no name to say it with.
   */
  const displayName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.first_name || authUser?.email?.split("@")[0] || "";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthUser(null);
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push(`/${locale}`);
    router.refresh();
  };

  // Primary links: visible on desktop next to logo
  const primaryNav = [
    { href: "/regions", label: t("regions") },
    { href: "/about", label: t("about") },
    { href: "/faq", label: t("faq") },
    { href: "/contact", label: t("contact") },
  ];

  // Secondary links: only in hamburger menu
  const secondaryNav = [
    { href: "/blog", label: t("blog") },
    { href: "/track", label: t("trackReservation") },
    { href: "/booking", label: t("bookNow") },
  ];

  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <header className="fixed top-0 start-0 end-0 z-[1100]">
      <nav
        className="transition-all duration-500"
        style={{
          backgroundColor: showDarkNav ? "rgba(255,255,255,0.72)" : "transparent",
          backdropFilter: showDarkNav ? "saturate(180%) blur(20px)" : "none",
          WebkitBackdropFilter: showDarkNav ? "saturate(180%) blur(20px)" : "none",
          borderBottom: showDarkNav ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        {/* Tighter than px-6 on a phone, where the page below the header —
            the hero headline, the booking card — starts at 12px and px-6 left
            the whole nav row standing 12px inside it. The row settles at 16px
            so the controls on the other end are not against the screen edge;
            the logo alone takes the last 4px back (see its -ms-1) so the stem
            of the T lands on the headline's own margin. */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo.

                Both artworks are rendered and cross-faded rather than swapping
                one `src`: over the hero the nav is transparent and the dark
                wordmark would be unreadable, but switching the source on scroll
                would fetch the other file at the moment it has to appear and
                flash an empty box on a slow connection. Two images, one opacity
                transition, no request in the middle of a scroll. */}
            <Link href="/" className="relative flex items-center shrink-0 h-8 sm:h-9 -ms-1 sm:ms-0" aria-label="TORVIAN Transfer">
              {/* The mark is raised by a tenth of its own height because the
                  aeroplane overhangs the wordmark: measured, the letters sit
                  10.7% of the box below the box's centre, so centring the box
                  leaves the word reading low against the currency, language
                  and menu controls beside it. A percentage, not a pixel count,
                  so it holds at both the phone and desktop sizes.

                  `sizes` is what stops the optimiser guessing. Without it Next
                  assumes these are viewport-wide and serves a 750px variant of
                  a mark that draws 136px, twice over — ~48KB of a phone's
                  first megabyte spent on the logo. And neither is `priority`:
                  that preloads them ahead of the hero photograph, which is the
                  LCP element and the one thing worth the head start. */}
              <Image
                src="/images/logo.png"
                alt="TORVIAN Transfer"
                width={720}
                height={170}
                sizes="(min-width: 640px) 152px, 136px"
                className={`h-full w-auto -translate-y-[10.7%] transition-opacity duration-300 ${showDarkNav ? "opacity-100" : "opacity-0"}`}
              />
              {/* Only where the nav is ever transparent. Everywhere else the
                  dark mark is the only one that shows, and rendering this as
                  well downloaded a second logo no visitor would ever see. */}
              {isHeroPage && (
                <Image
                  src="/images/logo-light.png"
                  alt=""
                  aria-hidden="true"
                  width={720}
                  height={172}
                  sizes="(min-width: 640px) 152px, 136px"
                  className={`absolute inset-y-0 start-0 h-full w-auto -translate-y-[10.7%] transition-opacity duration-300 ${showDarkNav ? "opacity-0" : "opacity-100"}`}
                />
              )}
            </Link>

            {/* Desktop primary nav - next to logo */}
            <div className="hidden lg:flex items-center gap-1 ms-8">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap rounded-lg ${
                    showDarkNav
                      ? (pathname === item.href ? "text-gray-900" : "text-gray-600 hover:text-gray-900")
                      : (pathname === item.href ? "text-white" : "text-white/90 hover:text-white")
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              <div ref={currencyRef}>
                <CurrencySelector
                  darkText={showDarkNav}
                  open={currencyOpen}
                  onOpenChange={(next) => openOnly(next ? "currency" : null)}
                />
              </div>

              {/* Language selector */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => openOnly(langOpen ? null : "lang")}
                  aria-label="Select language"
                  aria-expanded={langOpen}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] transition ${showDarkNav ? "text-[#1d1d1f] hover:bg-black/[0.05]" : "text-white/90 hover:bg-white/15 hover:text-white"}`}
                >
                  {/* The flag of the language in force, not a globe: the globe
                      said "this is a language control" to someone already
                      looking at one, while the flag says which language. */}
                  <FlagIcon locale={locale} className="h-[13px] w-[18px]" />
                  <span className="font-medium">{locale.toUpperCase()}</span>
                  <ChevronDown size={11} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>
                {langOpen && (
                  <div className={`absolute end-0 top-full z-50 mt-2 min-w-[180px] rounded-[14px] p-1 ${menuSurface}`} style={menuSurfaceStyle}>
                    {(Object.keys(localeNames) as Locale[]).map((loc) => {
                      const qs = searchParams.toString();
                      const hrefWithParams = qs ? `${pathname}?${qs}` : pathname;
                      return (
                        <Link
                          key={loc}
                          href={hrefWithParams}
                          locale={loc}
                          className={menuItem}
                          onClick={() => setLangOpen(false)}
                        >
                          <FlagIcon locale={loc} />
                          <span className="flex-1">{localeNames[loc]}</span>
                          {loc === locale && <Check size={15} className="shrink-0 text-[#007AFF]" aria-hidden="true" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Auth: User menu or Login button */}
              {authUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => openOnly(userMenuOpen ? null : "user")}
                    className={`flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-full transition-colors ${showDarkNav ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                  >
                    {/* 24px on phones so the filled circle reads at the same
                        weight as the 22px hamburger beside it — at 28px it was
                        the heaviest thing in the bar. */}
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {userInitial ? (
                        <span className="text-white text-[10px] sm:text-xs font-bold leading-none">{userInitial}</span>
                      ) : (
                        <User className="h-3.5 w-3.5 text-white sm:h-[17px] sm:w-[17px]" strokeWidth={2.5} aria-hidden="true" />
                      )}
                    </div>
                    <span className={`hidden sm:inline text-xs font-medium max-w-[100px] truncate ${showDarkNav ? 'text-gray-700' : 'text-white/90'}`}>
                      {displayName}
                    </span>
                    <ChevronDown size={10} className={`hidden sm:inline transition-transform ${showDarkNav ? 'text-gray-500' : 'text-white/70'} ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div className={`absolute end-0 top-full z-50 mt-2 min-w-[220px] rounded-[14px] p-1 ${menuSurface}`} style={menuSurfaceStyle}>
                      <div className="border-b border-black/[0.06] px-3 py-2.5">
                        {displayName && (
                          <p className="truncate text-[14px] font-semibold text-[#1d1d1f]">{displayName}</p>
                        )}
                        <p className="truncate text-[12px] text-[#86868b]">{authUser.email}</p>
                      </div>
                      <Link
                        href="/account/reservations"
                        className={menuItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CalendarCheck size={15} />
                        {t("myReservations")}
                      </Link>
                      <Link
                        href="/account/profile"
                        className={menuItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={15} />
                        {t("profile")}
                      </Link>
                      <div className="mt-1 border-t border-black/[0.06] pt-1">
                        <button
                          onClick={handleSignOut}
                          className={`${menuItem} text-[#D70015] hover:bg-[#FFF2F1]`}
                        >
                          <LogOut size={15} />
                          {t("signOut")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`hidden h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition sm:inline-flex ${showDarkNav ? "text-[#1d1d1f] ring-1 ring-black/[0.12] hover:bg-black/[0.05]" : "text-white/90 ring-1 ring-white/40 hover:bg-white/15 hover:text-white"}`}
                >
                  <User size={14} />
                  {t("login")}
                </button>
              )}

              {/* Hamburger menu - visible on all screen sizes */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => openOnly(menuOpen ? null : "menu")}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  className={`grid size-9 place-items-center rounded-full transition ${showDarkNav ? "text-[#1d1d1f] hover:bg-black/[0.05]" : "text-white/90 hover:bg-white/15 hover:text-white"}`}
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Desktop dropdown menu */}
                {menuOpen && (
                  <div className={`absolute end-0 top-full z-50 mt-2 hidden min-w-[220px] rounded-[14px] p-1 lg:block ${menuSurface}`} style={menuSurfaceStyle}>
                    {secondaryNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${menuItem} ${pathname === item.href ? "font-medium" : ""}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="flex-1">{item.label}</span>
                        {pathname === item.href && <Check size={15} className="shrink-0 text-[#007AFF]" aria-hidden="true" />}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu.
          A flat run of same-weight links down the page, with "Rezervasyon Yap"
          reading exactly like "Blog" even though it is the action the whole
          site exists for. Now a grouped list with separators and chevrons, the
          way a phone presents a menu, and the booking link pulled out of it as
          the one filled button. */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden"
          style={{
            backgroundColor: "rgba(255,255,255,0.72)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[16px] bg-white/70 ring-1 ring-black/[0.06]">
              {allNav
                .filter((item) => item.href !== "/booking")
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex h-12 items-center justify-between gap-3 px-4 text-[15px] text-[#1d1d1f] transition active:bg-black/[0.04]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={pathname === item.href ? "font-semibold" : "font-medium"}>{item.label}</span>
                    <ChevronRight size={16} className="shrink-0 text-[#c7c7cc]" aria-hidden="true" />
                  </Link>
                ))}
            </div>

            {authUser ? (
              <div className="mt-3 overflow-hidden rounded-[16px] bg-white/70 ring-1 ring-black/[0.06]">
                <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#007AFF]">
                    {userInitial ? (
                      <span className="text-[13px] font-semibold text-white">{userInitial}</span>
                    ) : (
                      <User className="h-[17px] w-[17px] text-white" strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    {displayName && (
                      <p className="truncate text-[14px] font-semibold text-[#1d1d1f]">{displayName}</p>
                    )}
                    <p className="truncate text-[12px] text-[#86868b]">{authUser.email}</p>
                  </div>
                </div>
                <div className="divide-y divide-black/[0.06]">
                  <Link
                    href="/account/reservations"
                    className="flex h-12 items-center gap-2.5 px-4 text-[15px] font-medium text-[#1d1d1f] transition active:bg-black/[0.04]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <CalendarCheck size={17} className="shrink-0 text-[#86868b]" />
                    {t("myReservations")}
                  </Link>
                  <Link
                    href="/account/profile"
                    className="flex h-12 items-center gap-2.5 px-4 text-[15px] font-medium text-[#1d1d1f] transition active:bg-black/[0.04]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={17} className="shrink-0 text-[#86868b]" />
                    {t("profile")}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex h-12 w-full items-center gap-2.5 px-4 text-[15px] font-medium text-[#D70015] transition active:bg-[#FFF2F1]"
                  >
                    <LogOut size={17} className="shrink-0" />
                    {t("signOut")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); setShowAuthModal(true); }}
                className="mt-3 flex h-12 w-full items-center gap-2.5 rounded-[16px] bg-white/70 px-4 text-[15px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06] transition active:bg-black/[0.04]"
              >
                <User size={17} className="shrink-0 text-[#86868b]" />
                {t("login")}
              </button>
            )}

            <Link
              href="/booking"
              onClick={() => setMenuOpen(false)}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#007AFF] text-[16px] font-semibold text-white transition active:scale-[0.99]"
            >
              {t("bookNow")}
            </Link>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          locale={locale}
        />
      )}
    </header>
  );
}
