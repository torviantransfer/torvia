import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["admin@velora.test"];

export async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
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
