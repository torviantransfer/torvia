"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function NewsletterForm() {
  const t = useTranslations("footer");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail || newsletterStatus === "loading") return;
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus("success");
        setNewsletterEmail("");
      } else if (res.status === 409 || data?.error === "duplicate") {
        setNewsletterStatus("duplicate");
      } else {
        setNewsletterStatus("error");
      }
    } catch {
      setNewsletterStatus("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto md:min-w-[360px]">
        <input
          type="email"
          value={newsletterEmail}
          onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus("idle"); }}
          placeholder={t("newsletterPlaceholder")}
          required
          disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
          className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#007AFF" }}
        >
          {newsletterStatus === "loading" ? "..." : t("newsletterButton")}
        </button>
      </form>
      {newsletterStatus === "success" && (
        <p className="mt-3 text-emerald-500 text-sm">{t("newsletterSuccess")}</p>
      )}
      {newsletterStatus === "duplicate" && (
        <p className="mt-3 text-yellow-500 text-sm">{t("newsletterDuplicate")}</p>
      )}
      {newsletterStatus === "error" && (
        <p className="mt-3 text-red-500 text-sm">{t("newsletterError")}</p>
      )}
    </div>
  );
}
