import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { inspectPage, type PageInspection } from "@/lib/seoInspect";
import { locales } from "@/i18n/config";

/**
 * Reads what a page actually serves, so the admin panel can show effective
 * values instead of only the overrides stored in the database.
 *
 * Which deployment it reads is the whole question, and getting it wrong is
 * not a cosmetic bug. This originally used the requesting deployment's own
 * origin, on the reasoning that a preview should report on itself. But a
 * preview with Vercel Deployment Protection enabled answers every request
 * with Vercel's login page — valid HTML, with its own <title>, canonical and
 * og:title. The panel dutifully displayed `Title: Login – Vercel` and
 * `Canonical: https://vercel.com/login` as though they were this site's SEO,
 * which is worse than showing nothing: it tells an editor their working,
 * ranking metadata is broken and invites them to overwrite it.
 *
 * So the default source is the public production domain, which is what Google
 * actually crawls and therefore what "effective value" means. Reading the
 * current deployment is still possible but has to be asked for explicitly and
 * is labelled as such in the response, because a preview's values and
 * production's values must never be presented as the same number.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The public site, as a crawler sees it. Overridable per environment for a
 * staging domain, but never silently derived from the request — that is the
 * mistake described above.
 */
const PUBLIC_ORIGIN = (
  process.env.SEO_INSPECT_BASE_URL ?? "https://torviantransfer.com"
).replace(/\/+$/, "");

type Target = "public" | "deployment";

/** Paths are restricted to this site's own public routes. */
function safePath(raw: string): string | null {
  if (!raw.startsWith("/")) return null;
  // A protocol-relative "//evil.com" is still a valid pathname to URL(), so it
  // has to be rejected explicitly or this becomes an open proxy.
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

  let body: { paths?: unknown; target?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const target: Target = body.target === "deployment" ? "deployment" : "public";
  const origin = target === "deployment" ? request.nextUrl.origin : PUBLIC_ORIGIN;

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

  // Rendering a region page hits Supabase several times, so the batch runs
  // with a small concurrency rather than all at once — twelve parallel renders
  // is enough to exhaust the connection pool on a cold instance.
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

  const blocked = Object.values(results).filter((r) => r.blocked).length;

  return NextResponse.json({
    origin,
    target,
    // The panel labels every value with where it came from, so this is not
    // decoration — it is what keeps a preview reading from being mistaken for
    // production.
    isPublicSource: target === "public",
    blockedCount: blocked,
    results,
  });
}
