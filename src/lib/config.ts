import { createAdminClient } from "@/lib/supabase/admin";

// ─── Server-side config: reads from DB settings, falls back to env vars ───

const ENV_MAP: Record<string, string> = {
  stripe_secret_key: "STRIPE_SECRET_KEY",
  stripe_publishable_key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  stripe_webhook_secret: "STRIPE_WEBHOOK_SECRET",
  resend_api_key: "RESEND_API_KEY",
  telegram_bot_token: "TELEGRAM_BOT_TOKEN",
  telegram_chat_id: "TELEGRAM_CHAT_ID",
  whatsapp_number: "NEXT_PUBLIC_WHATSAPP_NUMBER",
  site_url: "NEXT_PUBLIC_SITE_URL",
  admin_emails: "ADMIN_EMAILS",
};

// In-memory cache (TTL: 5 min)
let cache: Record<string, string> = {};
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function loadFromDB(): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient();
    const keys = Object.keys(ENV_MAP);
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", keys);

    const map: Record<string, string> = {};
    if (data) {
      for (const row of data) {
        if (row.value && String(row.value).trim()) {
          map[row.key] = String(row.value);
        }
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function getConfig(key: string): Promise<string> {
  // Refresh cache if stale
  if (Date.now() - cacheTime > CACHE_TTL) {
    cache = await loadFromDB();
    cacheTime = Date.now();
  }

  // DB value first, but ignore placeholder entries
  const dbValue = cache[key];
  if (dbValue && dbValue !== "placeholder") return dbValue;

  // Fallback to env var
  const envKey = ENV_MAP[key];
  if (envKey && process.env[envKey]) return process.env[envKey]!;

  return "";
}

// Force refresh cache (called after admin saves settings)
export function invalidateConfigCache() {
  cacheTime = 0;
}
