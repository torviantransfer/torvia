import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountTabs from "@/components/account/AccountTabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/account/login`);
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50/50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10" style={{ paddingTop: "88px" }}>
          <AccountTabs locale={locale} />
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
