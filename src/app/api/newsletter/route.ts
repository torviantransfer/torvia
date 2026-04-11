import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limit (resets on cold start — good enough for serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: unknown };

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "rate_limit" }, { status: 429 });
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      return NextResponse.json({ error: "misconfigured" }, { status: 500 });
    }

    // Add to Resend Audience
    const contactRes = await resend.contacts.create({
      email: email.toLowerCase().trim(),
      audienceId,
      unsubscribed: false,
    });

    if (contactRes.error) {
      // Resend returns error code "validation_error" if already exists — treat as duplicate
      const code = (contactRes.error as { name?: string }).name ?? "";
      if (code === "validation_error" || code === "already_exists") {
        return NextResponse.json({ error: "duplicate" }, { status: 409 });
      }
      console.error("[newsletter] Resend contact error:", contactRes.error);
      return NextResponse.json({ error: "resend_error" }, { status: 500 });
    }

    // Send welcome email
    await resend.emails.send({
      from: "TORVIAN Transfer <noreply@torviantransfer.com>",
      to: email.toLowerCase().trim(),
      subject: "Welcome to TORVIAN Transfer! 🎉",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111113;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="background:#C2410C;padding:32px;text-align:center;">
          <img src="https://torviantransfer.com/images/logo.webp" alt="TORVIAN Transfer" height="40" style="height:40px;max-width:180px;object-fit:contain;" />
        </td></tr>
        <tr><td style="padding:40px 36px;">
          <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;font-weight:700;">You're subscribed! 🎉</h1>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Thank you for subscribing to TORVIAN Transfer. You'll be the first to hear about exclusive offers, travel tips, and seasonal discounts for VIP airport transfers in Antalya.
          </p>
          <div style="background:rgba(194,65,12,0.1);border:1px solid rgba(194,65,12,0.3);border-radius:8px;padding:20px;margin-bottom:28px;">
            <p style="color:#fb923c;font-size:14px;font-weight:600;margin:0 0 6px;">🎁 Welcome Offer</p>
            <p style="color:#f3f4f6;font-size:15px;margin:0;">Use code <strong style="color:#ffffff;">WELCOME10</strong> for 10% off your first booking.</p>
          </div>
          <a href="https://torviantransfer.com" style="display:inline-block;background:#C2410C;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">Book Your Transfer</a>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:#6b7280;font-size:12px;margin:0;text-align:center;">
            © ${new Date().getFullYear()} TORVIAN Transfer · Antalya, Turkey<br/>
            <a href="https://torviantransfer.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#6b7280;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[newsletter] Unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
