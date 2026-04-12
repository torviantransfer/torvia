"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || t("errorSendFailed"));
      }

      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("errorGeneric"));
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(52,211,153,0.1)" }}>
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t("successTitle")}</h3>
        <p className="text-gray-500">{t("successDesc")}</p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";
  const inputStyle = { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("firstNamePlaceholder")}</label>
          <input
            name="firstName"
            type="text"
            required
            placeholder="John"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("lastNamePlaceholder")}</label>
          <input
            name="lastName"
            type="text"
            required
            placeholder="Doe"
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("emailPlaceholder")}</label>
        <input
          name="email"
          type="email"
          required
          placeholder="john@example.com"
          className={inputClass}
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("messagePlaceholder")}</label>
        <textarea
          name="message"
          rows={5}
          required
          placeholder="..."
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-red-700" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertCircle size={15} className="flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ boxShadow: "0 4px 20px rgba(37,99,235,0.25)" }}
      >
        {status === "loading" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {t("sendMessage")}
      </button>
    </form>
  );
}
