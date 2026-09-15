import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyAdmin } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { SIDEBAR_COOKIE } from "@/components/admin/nav";

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

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <AdminShell
      userEmail={user.email ?? ""}
      userName={meta.full_name || meta.name || null}
      initialCollapsed={collapsed}
    >
      {children}
    </AdminShell>
  );
}
