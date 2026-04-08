"use client";

import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";

interface Setting {
  key: string;
  value: unknown;
  updated_at: string;
}

interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  last_updated: string;
}

interface Props {
  initialSettings: Setting[];
  exchangeRates: ExchangeRate[];
}

const SETTING_LABELS: Record<string, { label: string; type: "number" | "text" }> = {
  night_surcharge_percent: { label: "Gece Ek Ücreti (%)", type: "number" },
  child_seat_fee: { label: "Çocuk Koltuğu Ücreti (USD)", type: "number" },
  welcome_sign_fee: { label: "Karşılama Tabelası Ücreti (USD)", type: "number" },
  cancellation_free_hours: { label: "Ücretsiz İptal Süresi (saat önce)", type: "number" },
  company_name: { label: "Şirket Adı", type: "text" },
  contact_email: { label: "İletişim E-postası", type: "text" },
  whatsapp_number: { label: "WhatsApp Numarası", type: "text" },
};

export default function SettingsManager({
  initialSettings,
  exchangeRates,
}: Props) {
  const [settings, setSettings] = useState<Setting[]>(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of initialSettings) {
      const v = s.value;
      map[s.key] = typeof v === "string" ? v : String(v ?? "");
    }
    return map;
  });

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const meta = SETTING_LABELS[key];
      let jsonValue: unknown;
      if (meta?.type === "number") {
        jsonValue = parseFloat(values[key]) || 0;
      } else {
        jsonValue = values[key];
      }

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "settings",
          action: "update",
          id: key,
          data: { value: jsonValue },
        }),
      });
      const result = await res.json();
      if (result.data) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? result.data : s))
        );
      }
    } finally {
      setSaving(null);
    }
  };

  const handleRefreshRates = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/cron/exchange-rates");
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Uygulama Ayarları</h2>
        <div className="space-y-4">
          {settings.map((setting) => {
            const meta = SETTING_LABELS[setting.key] ?? {
              label: setting.key,
              type: "text",
            };
            return (
              <div
                key={setting.key}
                className="flex items-center gap-4"
              >
                <label className="w-64 text-sm font-medium text-gray-700">
                  {meta.label}
                </label>
                <input
                  type={meta.type}
                  step={meta.type === "number" ? "0.01" : undefined}
                  value={values[setting.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [setting.key]: e.target.value })
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm max-w-xs"
                />
                <button
                  onClick={() => handleSave(setting.key)}
                  disabled={saving === setting.key}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                >
                  <Save size={14} />
                  {saving === setting.key ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Döviz Kurları (USD baz)</h2>
          <button
            onClick={handleRefreshRates}
            disabled={refreshing}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            API'den Güncelle
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {exchangeRates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between border border-gray-100 rounded-lg p-4"
            >
              <div>
                <p className="font-mono font-bold text-lg">
                  1 USD = {rate.rate} {rate.target_currency}
                </p>
                <p className="text-xs text-gray-400">
                  Güncelleme:{" "}
                  {new Date(rate.last_updated).toLocaleString()}
                </p>
              </div>
              <span className="text-2xl">
                {rate.target_currency === "EUR" ? "€" : "₺"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
