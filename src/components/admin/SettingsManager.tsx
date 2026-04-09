"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, EyeOff, CheckCircle2, XCircle, CreditCard, Mail, Send, Globe, Shield } from "lucide-react";

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

interface IntegrationSetting {
  key: string;
  value: string;
  hasValue: boolean;
  updated_at: string | null;
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

const INTEGRATION_FIELDS: {
  key: string;
  label: string;
  group: string;
  icon: typeof CreditCard;
  placeholder: string;
  sensitive: boolean;
}[] = [
  { key: "stripe_publishable_key", label: "Publishable Key", group: "Stripe Ödeme", icon: CreditCard, placeholder: "pk_live_...", sensitive: true },
  { key: "stripe_secret_key", label: "Secret Key", group: "Stripe Ödeme", icon: CreditCard, placeholder: "sk_live_...", sensitive: true },
  { key: "stripe_webhook_secret", label: "Webhook Secret", group: "Stripe Ödeme", icon: CreditCard, placeholder: "whsec_...", sensitive: true },
  { key: "resend_api_key", label: "API Key", group: "E-posta (Resend)", icon: Mail, placeholder: "re_...", sensitive: true },
  { key: "telegram_bot_token", label: "Bot Token", group: "Telegram Bildirim", icon: Send, placeholder: "123456:ABC-DEF...", sensitive: true },
  { key: "telegram_chat_id", label: "Chat ID", group: "Telegram Bildirim", icon: Send, placeholder: "-1001234567890", sensitive: false },
  { key: "site_url", label: "Site URL", group: "Genel", icon: Globe, placeholder: "https://torviantransfer.com", sensitive: false },
  { key: "admin_emails", label: "Admin E-postalar (virgülle ayır)", group: "Genel", icon: Shield, placeholder: "admin@firma.com, admin2@firma.com", sensitive: false },
];

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

  // Integration settings
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>([]);
  const [intValues, setIntValues] = useState<Record<string, string>>({});
  const [intSaving, setIntSaving] = useState<string | null>(null);
  const [intVisible, setIntVisible] = useState<Record<string, boolean>>({});
  const [intEditing, setIntEditing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"general" | "integrations">("general");

  useEffect(() => {
    fetch("/api/admin/integrations")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setIntegrations(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleIntSave = async (key: string) => {
    const val = intValues[key];
    if (val === undefined || val === "") return;
    setIntSaving(key);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });
      if (res.ok) {
        // Refresh integrations list
        const r = await fetch("/api/admin/integrations");
        const data = await r.json();
        if (data.data) setIntegrations(data.data);
        setIntValues((prev) => ({ ...prev, [key]: "" }));
        setIntEditing((prev) => ({ ...prev, [key]: false }));
      }
    } finally {
      setIntSaving(null);
    }
  };

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
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "general"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Genel Ayarlar
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "integrations"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Entegrasyonlar
        </button>
      </div>

      {activeTab === "general" && (
        <>
          {/* App Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Uygulama Ayarları</h2>
            <div className="space-y-4">
              {settings.map((setting) => {
                const meta = SETTING_LABELS[setting.key] ?? {
                  label: setting.key,
                  type: "text",
                };
                return (
                  <div key={setting.key} className="flex items-center gap-4">
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
                API&apos;den Güncelle
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
        </>
      )}

      {activeTab === "integrations" && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Not:</strong> API anahtarlarınız güvenli şekilde veritabanında saklanır. 
              Alternatif olarak Vercel ortam değişkenlerinde de tanımlayabilirsiniz — 
              her ikisi de desteklenir, buradaki değerler önceliklidir.
            </p>
          </div>

          {/* Group integrations */}
          {["Stripe Ödeme", "E-posta (Resend)", "Telegram Bildirim", "Genel"].map((group) => {
            const fields = INTEGRATION_FIELDS.filter((f) => f.group === group);
            const Icon = fields[0]?.icon;
            return (
              <div key={group} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  {Icon && <Icon size={18} className="text-gray-400" />}
                  <h2 className="font-bold text-gray-900">{group}</h2>
                  {/* Group status badge */}
                  {(() => {
                    const allSet = fields.every(
                      (f) => integrations.find((i) => i.key === f.key)?.hasValue
                    );
                    return allSet ? (
                      <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Bağlı
                      </span>
                    ) : (
                      <span className="ml-auto flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <XCircle size={12} /> Yapılandırılmadı
                      </span>
                    );
                  })()}
                </div>
                <div className="space-y-4">
                  {fields.map((field) => {
                    const int = integrations.find((i) => i.key === field.key);
                    const isEditing = intEditing[field.key];
                    const isVisible = intVisible[field.key];

                    return (
                      <div key={field.key} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-52">
                            {field.label}
                          </label>
                          {int?.hasValue ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Tanımlı
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Tanımlı değil</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-md">
                              <input
                                type={field.sensitive && !isVisible ? "password" : "text"}
                                placeholder={field.placeholder}
                                value={intValues[field.key] ?? ""}
                                onChange={(e) =>
                                  setIntValues({ ...intValues, [field.key]: e.target.value })
                                }
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 font-mono"
                              />
                              {field.sensitive && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setIntVisible({ ...intVisible, [field.key]: !isVisible })
                                  }
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => handleIntSave(field.key)}
                              disabled={intSaving === field.key || !intValues[field.key]}
                              className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Save size={14} />
                              {intSaving === field.key ? "..." : "Kaydet"}
                            </button>
                            <button
                              onClick={() => {
                                setIntEditing({ ...intEditing, [field.key]: false });
                                setIntValues({ ...intValues, [field.key]: "" });
                              }}
                              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {int?.hasValue && (
                              <span className="text-sm font-mono text-gray-400 bg-gray-50 px-3 py-1.5 rounded border border-gray-100">
                                {int.value || "••••••••"}
                              </span>
                            )}
                            <button
                              onClick={() => setIntEditing({ ...intEditing, [field.key]: true })}
                              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 text-gray-700"
                            >
                              {int?.hasValue ? "Değiştir" : "Ekle"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
