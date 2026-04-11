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
          backgroundColor: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(0,0,0,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex-1 text-sm text-gray-600 leading-relaxed">
          {t("message")}{" "}
          <Link href="/cookies" className="text-blue-600 underline underline-offset-2 hover:text-blue-700" aria-label={t("learnMoreAriaLabel")}>
            {t("learnMore")}
          </Link>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors rounded-lg border border-gray-200 hover:border-gray-300"
          >
            {t("decline")}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
