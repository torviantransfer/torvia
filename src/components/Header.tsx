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
  ArrowRight,
  User,
} from "lucide-react";
import { localeNames, localeFlags, type Locale } from "@/i18n/config";
import CurrencySelector from "./CurrencySelector";

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/regions", label: t("regions") },
    { href: "/about", label: t("about") },
    { href: "/faq", label: t("faq") },
    { href: "/blog", label: t("blog") },
    { href: "/contact", label: t("contact") },
    { href: "/track", label: t("trackReservation") },
  ];

  return (
    <header className="sticky top-0 z-50">
      <nav
        className="transition-all duration-500"
        style={{
          backgroundColor: scrolled ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.5)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <img
                src="/images/logo.webp"
                alt="TORVIAN Transfer"
                width={180}
                height={42}
                style={{ height: "32px", width: "auto", maxWidth: "140px", objectFit: "contain" }}
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs transition-colors whitespace-nowrap ${
                    pathname === item.href
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <CurrencySelector />
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  aria-label="Select language"
                  aria-expanded={langOpen}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs px-2 py-1"
                >
                  <Globe size={13} />
                  <span>{locale.toUpperCase()}</span>
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

              <Link
                href="/account/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white text-xs font-medium transition-colors"
              >
                <User size={13} />
                {t("login")}
              </Link>
              <Link
                href="/booking"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-all hover:brightness-110 whitespace-nowrap"
                style={{ backgroundColor: '#C2410C', color: '#fff' }}
              >
                {t("bookNow")}
                <ArrowRight size={13} />
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-md"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden" style={{ backgroundColor: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2.5 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account/login"
              className="flex items-center gap-2 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <User size={16} />
              {t("login")}
            </Link>
            <div className="pt-3">
              <Link
                href="/booking"
                className="block text-center py-3 text-sm font-semibold rounded-full transition-all"
                style={{ backgroundColor: '#C2410C', color: '#fff' }}
                onClick={() => setMobileOpen(false)}
              >
                {t("bookNow")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
