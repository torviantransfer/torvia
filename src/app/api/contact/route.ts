import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyContactForm } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { firstName, lastName, email, message } = body;

    // Validation
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 messages per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("notification_log")
      .select("*", { count: "exact", head: true })
      .eq("channel", "contact_form")
      .eq("recipient", email)
      .gte("created_at", oneHourAgo);

    if (count && count >= 3) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    // Log the contact message
    await supabase.from("notification_log").insert({
      type: "contact_form",
      channel: "contact_form",
      recipient: email,
      subject: `Contact from ${firstName} ${lastName}`,
      content: message,
      metadata: { firstName, lastName, email },
      status: "received",
    });

    // Send Telegram notification to admin
    notifyContactForm({
      name: `${firstName} ${lastName}`,
      email,
      message,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
