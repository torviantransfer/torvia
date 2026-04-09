"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

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
          <div className="rounded-2xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {done ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(52,211,153,0.12)" }}>
                  <CheckCircle size={32} className="text-emerald-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Password Updated!</h1>
                <p className="text-[#86868b] text-sm">Redirecting you to your account…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.12)" }}>
                    <Lock size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Set New Password</h1>
                    <p className="text-xs text-[#86868b]">Choose a strong password</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 rounded-xl text-red-400 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-[#86868b] mb-1.5">
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
                        className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-[#86868b] mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-60 mt-2"
                    style={{ backgroundColor: "#f97316" }}
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
