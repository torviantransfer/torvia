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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          name="firstName"
          type="text"
          required
          placeholder={t("firstNamePlaceholder")}
          className="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all"
          style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
        />
        <input
          name="lastName"
          type="text"
          required
          placeholder={t("lastNamePlaceholder")}
          className="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all"
          style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
        />
      </div>
      <input
        name="email"
        type="email"
        required
        placeholder={t("emailPlaceholder")}
        className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all"
        style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
      />
      <textarea
        name="message"
        rows={5}
        required
        placeholder={t("messagePlaceholder")}
        className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 resize-none transition-all"
        style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
      />

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
