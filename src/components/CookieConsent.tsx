"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { X } from "lucide-react";

export default function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("TORVIAN_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("TORVIAN_cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("TORVIAN_cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div
        className="max-w-4xl mx-auto rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          backgroundColor: "rgba(30,30,32,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex-1 text-sm text-gray-400 leading-relaxed">
          {t("message")}{" "}
          <Link href="/cookies" className="text-orange-400 underline underline-offset-2 hover:text-orange-300" aria-label={t("learnMoreAriaLabel")}>
            {t("learnMore")}
          </Link>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg border border-white/10 hover:border-white/20"
          >
            {t("decline")}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-medium text-white bg-orange-700 hover:bg-orange-800 transition-colors rounded-lg"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
