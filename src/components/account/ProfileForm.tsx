"use client";

import { useState } from "react";
import { User, Mail, Phone, Save, Check } from "lucide-react";

const t: Record<string, Record<string, string>> = {
  title: { en: "Profile", tr: "Profil", de: "Profil", pl: "Profil", ru: "Профиль" },
  firstName: { en: "First Name", tr: "Ad", de: "Vorname", pl: "Imię", ru: "Имя" },
  lastName: { en: "Last Name", tr: "Soyad", de: "Nachname", pl: "Nazwisko", ru: "Фамилия" },
  email: { en: "Email", tr: "E-posta", de: "E-Mail", pl: "Email", ru: "Эл. почта" },
  phone: { en: "Phone", tr: "Telefon", de: "Telefon", pl: "Telefon", ru: "Телефон" },
  save: { en: "Save Changes", tr: "Değişiklikleri Kaydet", de: "Änderungen speichern", pl: "Zapisz zmiany", ru: "Сохранить" },
  saved: { en: "Saved!", tr: "Kaydedildi!", de: "Gespeichert!", pl: "Zapisano!", ru: "Сохранено!" },
  error: { en: "Failed to save", tr: "Kayıt başarısız", de: "Speichern fehlgeschlagen", pl: "Nie udało się zapisać", ru: "Ошибка сохранения" },
};

interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function ProfileForm({
  locale,
  customer,
}: {
  locale: string;
  customer: CustomerData;
}) {
  const [form, setForm] = useState({
    first_name: customer.first_name ?? "",
    last_name: customer.last_name ?? "",
    phone: customer.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t.error[locale] ?? t.error.en);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <h1 className="text-2xl font-bold text-gray-900">{t.title[locale] ?? t.title.en}</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 max-w-lg" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {/* First name */}
        <div>
          <label className="text-[10px] text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider font-medium">
            <User size={12} /> {t.firstName[locale] ?? t.firstName.en}
          </label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          />
        </div>

        {/* Last name */}
        <div>
          <label className="text-[10px] text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider font-medium">
            <User size={12} /> {t.lastName[locale] ?? t.lastName.en}
          </label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="text-[10px] text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider font-medium">
            <Mail size={12} /> {t.email[locale] ?? t.email.en}
          </label>
          <input
            type="email"
            value={customer.email}
            readOnly
            className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-[10px] text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider font-medium">
            <Phone size={12} /> {t.phone[locale] ?? t.phone.en}
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          } disabled:opacity-50`}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? (t.saved[locale] ?? t.saved.en) : (t.save[locale] ?? t.save.en)}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
