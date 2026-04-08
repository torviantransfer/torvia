import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS;
  if (!envEmails) return [];
  return envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return null;

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await verifyAdmin();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  return { error: null, user };
}
