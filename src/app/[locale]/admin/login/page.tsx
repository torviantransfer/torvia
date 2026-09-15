import { redirect } from "next/navigation";

/**
 * The admin layout already puts the sign-in form in front of every admin page
 * for a visitor who is not signed in, so this address has nothing of its own
 * to show. Kept so old bookmarks land on the panel.
 */
export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin`);
}
