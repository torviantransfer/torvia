"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  User,
} from "lucide-react";
import { localeNames, localeFlags, type Locale } from "@/i18n/config";
import CurrencySelector from "./CurrencySelector";

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

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
          backgroundColor: scrolled ? "rgba(0,0,0,0.9)" : "transparent",
          backdropFilter: scrolled ? "saturate(180%) blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "saturate(180%) blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <img
                src="/images/logo.webp"
                alt="TORVIAN Transfer"
                width={180}
                height={42}
                style={{ height: "32px", width: "auto", maxWidth: "140px", objectFit: "contain" }}
              />
            </Link>

            {/* Desktop primary nav - next to logo */}
            <div className="hidden lg:flex items-center gap-1 ml-8">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap rounded-lg ${
                    pathname === item.href
                      ? "text-white"
                      : "text-white/90 hover:text-white"
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
              <CurrencySelector />

              {/* Language selector */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  aria-label="Select language"
                  aria-expanded={langOpen}
                  className="flex items-center gap-1 text-white/90 hover:text-white transition-colors text-xs px-2 py-1.5 rounded-lg"
                >
                  <Globe size={14} />
                  <span className="font-medium">{locale.toUpperCase()}</span>
                  <ChevronDown size={10} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-1 min-w-[150px] z-50" style={{ backgroundColor: "rgba(29,29,31,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {(Object.keys(localeNames) as Locale[]).map((loc) => (
                      <Link
                        key={loc}
                        href={pathname}
                        locale={loc}
                        className={`block px-3.5 py-2 text-xs transition-colors ${
                          loc === locale
                            ? "text-orange-400 font-medium"
                            : "text-gray-400 hover:text-white"
                        }`}
                        onClick={() => setLangOpen(false)}
                      >
                        {localeFlags[loc]} {localeNames[loc]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Login button with circle border */}
              <Link
                href="/account/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-white/90 hover:text-white text-xs font-medium transition-colors rounded-full border border-white/40 hover:border-white/70"
              >
                <User size={14} />
                {t("login")}
              </Link>

              {/* Hamburger menu - visible on all screen sizes */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  className="p-2 text-white/90 hover:text-white transition-colors rounded-lg"
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Desktop dropdown menu */}
                {menuOpen && (
                  <div className="hidden lg:block absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-2 min-w-[200px] z-50" style={{ backgroundColor: "rgba(29,29,31,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {secondaryNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
                          pathname === item.href
                            ? "text-orange-400 font-medium"
                            : "text-gray-400 hover:text-white"
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
        <div ref={mobileMenuRef} className="lg:hidden" style={{ backgroundColor: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-0.5">
            {allNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2.5 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account/login"
              className="flex items-center gap-2 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <User size={16} />
              {t("login")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
