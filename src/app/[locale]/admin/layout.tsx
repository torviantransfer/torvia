import { verifyAdmin } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

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
