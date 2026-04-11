"use client";

import { useState, useEffect, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Check for error in URL hash (expired/invalid link)
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("error=access_denied") || hash.includes("error_code=otp_expired")) {
        setExpired(true);
        return;
      }
    }

    // Listen for PASSWORD_RECOVERY event — Supabase processes the hash token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if session already exists (came via /auth/callback cookie)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push(`/${locale}/account`), 2500);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center min-h-[70vh] px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
            {done ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(52,211,153,0.12)" }}>
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Password Updated!</h1>
                <p className="text-gray-500 text-sm">Redirecting you to your account…</p>
              </div>
            ) : expired ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(239,68,68,0.12)" }}>
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Link Expired</h1>
                <p className="text-gray-500 text-sm">This password reset link has expired or already been used. Please request a new one.</p>
                <button
                  onClick={() => router.push(`/${locale}/account/login`)}
                  className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : !sessionReady ? (
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 text-sm">Verifying your reset link…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.1)" }}>
                    <Lock size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Set New Password</h1>
                    <p className="text-xs text-gray-500">Choose a strong password</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 rounded-xl text-red-600 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-500 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-500 mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 mt-2"
                  >
                    {loading ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
