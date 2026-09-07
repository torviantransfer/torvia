import type { Metadata } from "next";
import { verifyAdmin } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

/**
 * The admin is behind a login, but a login page is still a page: it answered
 * 200 with the root layout's `index, follow` on all fourteen of its URLs
 * (/tr/admin, /en/admin, /de/admin/login …). robots.txt does not cover them
 * either — it disallows `/admin/`, and with `localePrefix: "always"` there is
 * no such path; every real one starts with a locale segment.
 *
 * So the directive has to come from here. A layout's metadata is inherited by
 * every page beneath it, which is what makes this the right place: a new admin
 * screen cannot be added without it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdmin();

  if (!user) {
    return <AdminLoginForm />;
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
