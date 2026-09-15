"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, EyeOff, CheckCircle2, CreditCard, Mail, Send, Globe, Shield, Moon, Settings2, Wallet, Plug } from "lucide-react";
import { Button, Card, Chip, IconButton, Input, PageHeader, cx } from "@/components/admin/ui";

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

/**
 * Only the currencies the site quotes in. Falling back to the code itself keeps
 * a currency added later readable instead of printing the wrong symbol, which
 * is what the old `=== "EUR" ? "€" : "₺"` did the moment the base moved and the
 * dollar row started showing a lira sign.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  TRY: "₺",
};

const SETTING_LABELS: Record<string, { label: string; type: "number" | "text" | "toggle"; hint?: string }> = {
  night_surcharge_percent: { label: "Gece Ek Ücreti (%)", type: "number" },
  // These ride on top of the fare, so they are in the fare's currency.
  child_seat_fee: { label: "Çocuk Koltuğu Ücreti (EUR)", type: "number" },
  welcome_sign_fee: { label: "Karşılama Tabelası Ücreti (EUR)", type: "number" },
  cancellation_free_hours: { label: "Ücretsiz İptal Süresi (saat önce)", type: "number" },
  company_name: { label: "Şirket Adı", type: "text" },
  contact_email: { label: "İletişim E-postası", type: "text" },
  whatsapp_number: { label: "WhatsApp Numarası", type: "text" },
  cash_payment_enabled: { label: "Araçta Ödeme (Nakit)", type: "toggle", hint: "Açık olduğunda müşteriler araçta nakit ödeme seçebilir" },
  online_payment_discount_percent: { label: "Online Ödeme İndirimi (%)", type: "number", hint: "Online ödemelerde uygulanacak indirim yüzdesi. 0 = indirim yok" },
};

// Keys managed in dedicated sections (hidden from the generic settings list)
const HIDDEN_KEYS = new Set(["night_tariff_enabled", "night_tariff_start", "night_tariff_end", "night_tariff_percent"]);

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

type Section = "general" | "rates" | "night" | "integrations";

const SECTIONS: { key: Section; label: string; icon: typeof Settings2 }[] = [
  { key: "general", label: "Genel", icon: Settings2 },
  { key: "rates", label: "Döviz kurları", icon: Wallet },
  { key: "night", label: "Gece tarifesi", icon: Moon },
  { key: "integrations", label: "Entegrasyonlar", icon: Plug },
];

function Toggle({ on, onClick, disabled, tone = "green" }: { on: boolean; onClick: () => void; disabled?: boolean; tone?: "green" | "blue" }) {
  const bg = tone === "blue" ? "bg-adm-blue" : "bg-adm-green";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={cx("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50", on ? bg : "bg-adm-seg")}
    >
      <span className={cx("inline-block size-4 transform rounded-full bg-adm-surface shadow transition-transform", on ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

/** Ayarlar: docs/admin-tasarim.md, bölüm 5.17. */
export default function SettingsManager({ initialSettings, exchangeRates }: Props) {
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
  const [section, setSection] = useState<Section>("general");
  const [sendingPriceList, setSendingPriceList] = useState(false);
  const [priceListSent, setPriceListSent] = useState(false);

  const handleSendPriceList = async () => {
    setSendingPriceList(true);
    setPriceListSent(false);
    try {
      const res = await fetch("/api/admin/telegram-price-list", { method: "POST" });
      if (res.ok) {
        setPriceListSent(true);
        setTimeout(() => setPriceListSent(false), 3000);
      }
    } catch {
      /* ignore */
    }
    setSendingPriceList(false);
  };

  useEffect(() => {
    fetch("/api/admin/integrations")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setIntegrations(res.data);
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

  const handleSave = async (key: string, overrideValue?: unknown) => {
    setSaving(key);
    try {
      const meta = SETTING_LABELS[key];
      let jsonValue: unknown;
      if (overrideValue !== undefined) jsonValue = overrideValue;
      else if (meta?.type === "number") jsonValue = parseFloat(values[key]) || 0;
      else jsonValue = values[key];

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "settings", action: "update", id: key, data: { value: jsonValue } }),
      });
      const result = await res.json();
      if (result.data) {
        setSettings((prev) => prev.map((s) => (s.key === key ? result.data : s)));
        const saved = result.data.value;
        setValues((prev) => ({ ...prev, [key]: typeof saved === "string" ? saved : String(saved ?? "") }));
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

  const enabled = values.night_tariff_enabled === "true";
  const isSavingNight = saving === "night_tariff_percent" || saving === "night_tariff_start" || saving === "night_tariff_end";

  return (
    <>
      <PageHeader title="Ayarlar" />

      <div className="grid gap-5 min-[901px]:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Ayar bölümleri" className="grid gap-0.5 min-[901px]:sticky min-[901px]:top-[76px] min-[901px]:self-start">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-9 items-center gap-2.5 rounded-adm px-3 text-[13.5px] font-medium transition-colors",
                  active ? "bg-adm-surface text-adm-ink shadow-adm-sm ring-1 ring-inset ring-adm-line" : "text-adm-ink-2 hover:bg-adm-line-2"
                )}
              >
                <Icon size={16} aria-hidden="true" className={active ? "text-adm-brand" : "text-adm-faint"} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="grid min-w-0 gap-5">
          {section === "general" && (
            <Card title="Uygulama Ayarları">
              <div className="grid gap-4">
                {settings
                  .filter((s) => !HIDDEN_KEYS.has(s.key))
                  .map((setting) => {
                    const meta = SETTING_LABELS[setting.key] ?? { label: setting.key, type: "text" as const };
                    const isToggle = meta.type === "toggle";
                    const toggleOn = values[setting.key] === "true" || (values[setting.key] as unknown as boolean) === true;
                    return (
                      <div key={setting.key} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="w-full min-[600px]:w-56 min-[600px]:shrink-0">
                          <label className="text-[13px] font-medium text-adm-ink-2">{meta.label}</label>
                          {meta.hint && <p className="mt-0.5 text-xs text-adm-muted">{meta.hint}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          {isToggle ? (
                            <>
                              <Toggle on={Boolean(toggleOn)} onClick={() => handleSave(setting.key, !toggleOn)} disabled={saving === setting.key} />
                              <span className={cx("text-[13px] font-medium", toggleOn ? "text-adm-green" : "text-adm-muted")}>
                                {saving === setting.key ? "Kaydediliyor…" : toggleOn ? "Açık" : "Kapalı"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Input
                                type={meta.type}
                                step={meta.type === "number" ? "0.01" : undefined}
                                value={values[setting.key] ?? ""}
                                onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                                className="w-40"
                              />
                              <Button size="sm" icon={Save} loading={saving === setting.key} onClick={() => handleSave(setting.key)}>
                                Kaydet
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {section === "rates" && (
            <Card
              title="Döviz Kurları (EUR baz)"
              actions={
                <Button size="sm" icon={RefreshCw} loading={refreshing} onClick={handleRefreshRates}>
                  API&apos;den güncelle
                </Button>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {exchangeRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between rounded-adm border border-adm-line-2 p-4">
                    <div>
                      {/* The base is read from the row rather than written in, so
                          this line cannot drift from what the rate actually means
                          the next time the base currency moves. */}
                      <p className="font-mono text-lg font-bold tabular-nums">
                        1 {rate.base_currency} = {rate.rate} {rate.target_currency}
                      </p>
                      <p className="text-xs text-adm-muted">Güncelleme: {new Date(rate.last_updated).toLocaleString("tr-TR")}</p>
                    </div>
                    <span className="text-2xl">{CURRENCY_SYMBOLS[rate.target_currency] ?? rate.target_currency}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === "night" && (
            <Card
              title="Gece Tarifesi"
              subtitle="Belirtilen saatler arasındaki rezervasyonlara ek ücret uygular"
              actions={
                <div className="flex items-center gap-2">
                  <Toggle on={enabled} tone="blue" onClick={() => handleSave("night_tariff_enabled", !enabled)} disabled={saving === "night_tariff_enabled"} />
                  <span className={cx("text-[13px] font-medium", enabled ? "text-adm-blue" : "text-adm-muted")}>
                    {saving === "night_tariff_enabled" ? "…" : enabled ? "Açık" : "Kapalı"}
                  </span>
                </div>
              }
            >
              <div className={cx("grid gap-4 transition-opacity sm:grid-cols-3", !enabled && "pointer-events-none opacity-40")}>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-adm-muted">Başlangıç saati</label>
                  <div className="flex gap-2">
                    <Input type="time" value={values.night_tariff_start ?? "00:00"} onChange={(e) => setValues((v) => ({ ...v, night_tariff_start: e.target.value }))} className="flex-1 font-mono" />
                    <IconButton icon={Save} label="Kaydet" onClick={() => handleSave("night_tariff_start")} disabled={saving === "night_tariff_start"} className="border border-adm-line bg-adm-ink text-white hover:bg-adm-ink-hover" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-adm-muted">Bitiş saati</label>
                  <div className="flex gap-2">
                    <Input type="time" value={values.night_tariff_end ?? "07:00"} onChange={(e) => setValues((v) => ({ ...v, night_tariff_end: e.target.value }))} className="flex-1 font-mono" />
                    <IconButton icon={Save} label="Kaydet" onClick={() => handleSave("night_tariff_end")} disabled={saving === "night_tariff_end"} className="border border-adm-line bg-adm-ink text-white hover:bg-adm-ink-hover" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-adm-muted">Ek ücret (%)</label>
                  <div className="flex gap-2">
                    <Input type="number" min="0" max="100" step="1" value={values.night_tariff_percent ?? "0"} onChange={(e) => setValues((v) => ({ ...v, night_tariff_percent: e.target.value }))} className="w-20 flex-1" placeholder="0" />
                    <IconButton icon={Save} label="Kaydet" onClick={() => handleSave("night_tariff_percent")} disabled={saving === "night_tariff_percent"} className="border border-adm-line bg-adm-ink text-white hover:bg-adm-ink-hover" />
                  </div>
                </div>
              </div>

              {enabled && (
                <div className="mt-4 flex items-center gap-2 rounded-adm-sm border border-adm-blue-soft bg-adm-blue-soft px-4 py-3">
                  <Moon size={14} aria-hidden="true" className="shrink-0 text-adm-blue" />
                  <p className="text-xs text-adm-blue">
                    <strong>
                      {values.night_tariff_start ?? "00:00"} – {values.night_tariff_end ?? "07:00"}
                    </strong>{" "}
                    saatleri arasındaki rezervasyonlara <strong>%{values.night_tariff_percent ?? "0"}</strong> gece tarifesi uygulanır.
                    {isSavingNight && <span className="ms-2">Kaydediliyor…</span>}
                  </p>
                </div>
              )}
            </Card>
          )}

          {section === "integrations" && (
            <div className="grid gap-5">
              <p className="rounded-adm border border-adm-blue-soft bg-adm-blue-soft px-4 py-3 text-[13px] text-adm-blue">
                <strong>Not:</strong> API anahtarlarınız güvenli şekilde veritabanında saklanır. Alternatif olarak Vercel ortam
                değişkenlerinde de tanımlayabilirsiniz — her ikisi de desteklenir, buradaki değerler önceliklidir.
              </p>

              {["Stripe Ödeme", "E-posta (Resend)", "Telegram Bildirim", "Genel"].map((group) => {
                const fields = INTEGRATION_FIELDS.filter((f) => f.group === group);
                const Icon = fields[0]?.icon;
                const allSet = fields.every((f) => integrations.find((i) => i.key === f.key)?.hasValue);
                return (
                  <Card
                    key={group}
                    title={
                      <span className="inline-flex items-center gap-2">
                        {Icon && <Icon size={16} aria-hidden="true" className="text-adm-muted" />}
                        {group}
                      </span>
                    }
                    actions={
                      allSet ? (
                        <Chip tone="green">Bağlı</Chip>
                      ) : (
                        <Chip tone="amber">Yapılandırılmadı</Chip>
                      )
                    }
                  >
                    <div className="grid gap-4">
                      {fields.map((field) => {
                        const int = integrations.find((i) => i.key === field.key);
                        const isEditing = intEditing[field.key];
                        const isVisible = intVisible[field.key];

                        return (
                          <div key={field.key} className="grid gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="w-52 text-[13px] font-medium text-adm-ink-2">{field.label}</label>
                              {int?.hasValue ? (
                                <span className="flex items-center gap-1 text-xs text-adm-green">
                                  <CheckCircle2 size={12} aria-hidden="true" /> Tanımlı
                                </span>
                              ) : (
                                <span className="text-xs text-adm-muted">Tanımlı değil</span>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="relative max-w-md flex-1">
                                  <Input
                                    type={field.sensitive && !isVisible ? "password" : "text"}
                                    placeholder={field.placeholder}
                                    value={intValues[field.key] ?? ""}
                                    onChange={(e) => setIntValues({ ...intValues, [field.key]: e.target.value })}
                                    className="pe-10 font-mono"
                                  />
                                  {field.sensitive && (
                                    <button
                                      type="button"
                                      onClick={() => setIntVisible({ ...intVisible, [field.key]: !isVisible })}
                                      aria-label={isVisible ? "Gizle" : "Göster"}
                                      className="absolute end-2 top-1/2 -translate-y-1/2 text-adm-muted hover:text-adm-ink-2"
                                    >
                                      {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  )}
                                </div>
                                <Button size="sm" icon={Save} loading={intSaving === field.key} disabled={!intValues[field.key]} onClick={() => handleIntSave(field.key)}>
                                  Kaydet
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setIntEditing({ ...intEditing, [field.key]: false });
                                    setIntValues({ ...intValues, [field.key]: "" });
                                  }}
                                >
                                  İptal
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                {int?.hasValue && (
                                  <span className="rounded-adm-sm border border-adm-line-2 bg-adm-surface-2 px-3 py-1.5 font-mono text-[13px] text-adm-muted">
                                    {int.value || "••••••••"}
                                  </span>
                                )}
                                <Button size="sm" onClick={() => setIntEditing({ ...intEditing, [field.key]: true })}>
                                  {int?.hasValue ? "Değiştir" : "Ekle"}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {group === "Telegram Bildirim" && (
                      <div className="mt-5 border-t border-adm-line-2 pt-4">
                        <p className="mb-3 text-xs text-adm-muted">Fiyat listesini Telegram grubuna gönderin ve sabitleyin.</p>
                        <Button
                          variant="primary"
                          icon={priceListSent ? CheckCircle2 : Send}
                          loading={sendingPriceList}
                          onClick={handleSendPriceList}
                          className="bg-[#1f55c7] hover:bg-[#1a49ab]"
                        >
                          {priceListSent ? "Gönderildi" : "Fiyat listesini Telegram'a gönder"}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
