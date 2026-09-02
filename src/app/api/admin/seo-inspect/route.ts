import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { inspectPage, type PageInspection } from "@/lib/seoInspect";
import { locales } from "@/i18n/config";

/**
 * Reads what a page actually serves, so the admin panel can show effective
 * values instead of only the overrides stored in the database.
 *
 * The fetch happens here rather than in the browser because the pages are
 * same-origin only from the server's point of view once the panel is used
 * from a different host, and because an admin session must gate it: this
 * endpoint will fetch any path on this deployment, and an unauthenticated
 * caller must not be able to use the server as a proxy.
 *
 * The origin is taken from the incoming request, not from a constant, so a
 * preview deployment reports on itself. Verifying a change before it ships is
 * the main reason this exists, and pointing it at production would defeat it.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Paths are restricted to this site's own public routes. */
function safePath(raw: string): string | null {
  if (!raw.startsWith("/")) return null;
  // A protocol-relative "//evil.com" is still a valid pathname to URL(), so
  // it has to be rejected explicitly or this becomes an open proxy.
  if (raw.startsWith("//")) return null;
  if (raw.includes("..")) return null;
  const [pathname] = raw.split(/[?#]/);
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  if (!locales.includes(segments[0] as (typeof locales)[number])) return null;
  // Never inspect the admin or the API — nothing there has SEO, and both can
  // be expensive to render.
  if (["admin", "api", "account", "driver", "auth"].includes(segments[1] ?? "")) return null;
  return pathname;
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  let body: { paths?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const raw = Array.isArray(body.paths) ? body.paths : [];
  const paths = raw
    .filter((p): p is string => typeof p === "string")
    .map(safePath)
    .filter((p): p is string => p !== null);

  if (paths.length === 0) {
    return NextResponse.json({ error: "Taranacak geçerli yol yok" }, { status: 400 });
  }
  // A whole-site scan is thirty-plus page renders; capping the batch keeps one
  // request inside the function timeout and lets the client show progress.
  if (paths.length > 12) {
    return NextResponse.json(
      { error: "Tek seferde en fazla 12 sayfa taranabilir" },
      { status: 400 }
    );
  }

  const origin = request.nextUrl.origin;

  // Rendering a region page hits Supabase several times, so the batch runs
  // with a small concurrency rather than all at once — twelve parallel
  // renders is enough to exhaust the connection pool on a cold instance.
  const results: Record<string, PageInspection> = {};
  const queue = [...paths];
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    for (;;) {
      const path = queue.shift();
      if (!path) return;
      results[path] = await inspectPage(origin, path);
    }
  });
  await Promise.all(workers);

  return NextResponse.json({ origin, results });
}
