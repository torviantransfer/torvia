import { NextRequest, NextResponse } from "next/server";
import { capiPageView, fbcFromClickId, identityFromRequest, isEventId } from "@/lib/capi";

/**
 * The server half of a PageView.
 *
 * The pixel reports every pageview from the browser, where an ad blocker, a
 * tracking-protection default or a dropped third-party request loses a good
 * share of them — which is what Events Manager means by low Conversions API
 * coverage for PageView. The browser sends its event id here so the same
 * pageview also arrives from the server; Meta keeps one of the two and merges
 * what each knew about the visitor.
 */

const FBCLID = /^[A-Za-z0-9._-]{1,400}$/;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventId = body.eventId;
  if (!isEventId(eventId)) {
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(String(body.url));
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // This endpoint is open to anyone who can reach the site, and event_source_url
  // is reported against our pixel — so it only ever speaks for our own pages.
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (sourceUrl.host !== host) {
    return NextResponse.json({ error: "Foreign url" }, { status: 400 });
  }

  const identity = identityFromRequest(request);
  if (!identity.fbc) {
    // First pageview of an ad click: the pixel has not written _fbc yet, but
    // the click id is still in the URL the browser reported.
    const fbclid =
      typeof body.fbclid === "string" ? body.fbclid : sourceUrl.searchParams.get("fbclid");
    if (fbclid && FBCLID.test(fbclid)) identity.fbc = fbcFromClickId(fbclid);
  }

  // Awaited: on serverless the function can be frozen the moment it responds,
  // and a fire-and-forget send would be cut off mid-flight.
  await capiPageView(identity, sourceUrl.toString(), eventId);

  return new NextResponse(null, { status: 204 });
}
