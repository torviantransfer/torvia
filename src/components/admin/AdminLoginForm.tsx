"use client";

import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { Button } from "./ui/Button";
import { Field, Input } from "./ui/Field";

/** Supabase answers in English; the one message anyone actually sees gets a Turkish line. */
function explain(message: string) {
  if (/invalid login credentials/i.test(message)) return "E-posta ya da şifre hatalı.";
  if (/email not confirmed/i.test(message)) return "Bu e-posta adresi henüz doğrulanmamış.";
  return message;
}

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(explain(error.message));
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div
      className="adm-root flex min-h-screen w-full items-center justify-center bg-adm-bg px-4 py-10 text-adm-ink"
      style={{ colorScheme: "light" }}
    >
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-adm-ink text-base font-bold text-white">T</span>
          <h1 className="mt-4 text-[21px] font-bold tracking-[-0.02em]">Torvian Admin</h1>
          <p className="mt-1 text-[13px] text-adm-muted">Devam etmek için giriş yapın</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-adm-lg border border-adm-line bg-adm-surface p-6 shadow-adm-sm"
        >
          <Field label="E-posta" htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              icon={Mail}
              inputSize="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad@ornek.com"
            />
          </Field>

          <Field label="Şifre" htmlFor="admin-password" error={error || undefined}>
            <Input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              icon={Lock}
              inputSize="lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              placeholder="••••••••"
            />
          </Field>

          <Button type="submit" variant="primary" icon={LogIn} loading={loading} className="h-10 w-full">
            Giriş yap
          </Button>
        </form>
      </div>
    </div>
  );
}
