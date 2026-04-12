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
  Globe,
  User,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { localeNames, localeFlags, type Locale } from "@/i18n/config";
import CurrencySelector from "./CurrencySelector";
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Pages with dark hero images get transparent navbar
  // On booking page, only when NO region is selected (hero is shown)
  const isHeroPage = pathname === "/" || (pathname === "/booking" && !searchParams.get("region"));
  // On non-hero pages, always show dark text (light bg). On hero pages, depends on scroll.
  const showDarkNav = scrolled || !isHeroPage;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
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
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="transition-all duration-500"
        style={{
          backgroundColor: showDarkNav ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: showDarkNav ? "saturate(180%) blur(20px)" : "none",
          WebkitBackdropFilter: showDarkNav ? "saturate(180%) blur(20px)" : "none",
          borderBottom: showDarkNav ? "1px solid rgba(0,0,0,0.08)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <span className="text-[22px] sm:text-2xl font-black tracking-tight transition-colors duration-300" style={{ fontFamily: "var(--font-montserrat), sans-serif", color: "#10B981" }}>TORVIAN</span>
            </Link>

            {/* Desktop primary nav - next to logo */}
            <div className="hidden lg:flex items-center gap-1 ml-8">
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
              <CurrencySelector darkText={showDarkNav} />

              {/* Language selector */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  aria-label="Select language"
                  aria-expanded={langOpen}
                  className={`flex items-center gap-1 transition-colors text-xs px-2 py-1.5 rounded-lg ${showDarkNav ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  <Globe size={14} />
                  <span className="font-medium">{locale.toUpperCase()}</span>
                  <ChevronDown size={10} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-1 min-w-[150px] z-50" style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}>
                    {(Object.keys(localeNames) as Locale[]).map((loc) => (
                      <Link
                        key={loc}
                        href={pathname}
                        locale={loc}
                        className={`block px-3.5 py-2 text-xs transition-colors ${
                          loc === locale
                            ? "text-blue-600 font-medium"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                        onClick={() => setLangOpen(false)}
                      >
                        {localeFlags[loc]} {localeNames[loc]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth: User menu or Login button */}
              {authUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-full transition-colors ${showDarkNav ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] sm:text-xs font-bold">{userInitial}</span>
                    </div>
                    <span className={`hidden sm:inline text-xs font-medium max-w-[100px] truncate ${showDarkNav ? 'text-gray-700' : 'text-white/90'}`}>
                      {displayName}
                    </span>
                    <ChevronDown size={10} className={`hidden sm:inline transition-transform ${showDarkNav ? 'text-gray-500' : 'text-white/70'} ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-1 min-w-[200px] z-50" style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{authUser.email}</p>
                      </div>
                      <Link
                        href="/account/reservations"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CalendarCheck size={15} />
                        {t("myReservations")}
                      </Link>
                      <Link
                        href="/account/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={15} />
                        {t("profile")}
                      </Link>
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50/50 transition-colors w-full"
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
                  className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-colors rounded-full ${showDarkNav ? 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400' : 'text-white/90 hover:text-white border border-white/40 hover:border-white/70'}`}
                >
                  <User size={14} />
                  {t("login")}
                </button>
              )}

              {/* Hamburger menu - visible on all screen sizes */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  className={`p-2 transition-colors rounded-lg ${showDarkNav ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Desktop dropdown menu */}
                {menuOpen && (
                  <div className="hidden lg:block absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-2 min-w-[200px] z-50" style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}>
                    {secondaryNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
                          pathname === item.href
                            ? "text-blue-600 font-medium"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu - full width panel */}
      {menuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden" style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-0.5">
            {allNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2.5 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {authUser ? (
              <>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{userInitial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{authUser.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/account/reservations"
                    className="flex items-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <CalendarCheck size={16} />
                    {t("myReservations")}
                  </Link>
                  <Link
                    href="/account/profile"
                    className="flex items-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} />
                    {t("profile")}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors w-full"
                  >
                    <LogOut size={16} />
                    {t("signOut")}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); setShowAuthModal(true); }}
                className="flex items-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <User size={16} />
                {t("login")}
              </button>
            )}
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
