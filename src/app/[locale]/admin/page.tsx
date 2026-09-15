import { createAdminClient } from "@/lib/supabase/admin";
import { loadToday, parseTodayScope } from "@/lib/todayData";
import TodayScreen from "@/components/admin/today/TodayScreen";

// The day changes under it; never served from a prerender.
export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminToday({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const data = await loadToday(createAdminClient(), parseTodayScope(first(sp.day)));

  return <TodayScreen data={data} adminBase={`/${locale}/admin`} />;
}
