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
          className="h-11 flex-1 rounded-[12px] bg-white px-4 text-[15px] text-[#1d1d1f] outline-none ring-1 ring-black/[0.08] transition placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#007AFF] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
          className="h-11 shrink-0 rounded-[12px] bg-[#007AFF] px-5 text-[15px] font-semibold text-white transition hover:bg-[#0062CC] active:scale-[0.98] disabled:opacity-50"
        >
          {newsletterStatus === "loading" ? "..." : t("newsletterButton")}
        </button>
      </form>
      {newsletterStatus === "success" && (
        <p className="mt-2.5 text-[13px] text-[#248A3D]">{t("newsletterSuccess")}</p>
      )}
      {newsletterStatus === "duplicate" && (
        <p className="mt-2.5 text-[13px] text-[#8a6d00]">{t("newsletterDuplicate")}</p>
      )}
      {newsletterStatus === "error" && (
        <p className="mt-2.5 text-[13px] text-[#D70015]">{t("newsletterError")}</p>
      )}
    </div>
  );
}
