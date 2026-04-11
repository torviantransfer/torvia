"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, X, User } from "lucide-react";

const t: Record<string, Record<string, string>> = {
  loginTitle: { en: "Sign In", tr: "Giriş Yap", de: "Anmelden", pl: "Zaloguj się", ru: "Войти" },
  registerTitle: { en: "Create Account", tr: "Hesap Oluştur", de: "Konto erstellen", pl: "Utwórz konto", ru: "Создать аккаунт" },
  subtitle: { en: "Track your transfers & manage bookings", tr: "Transferlerinizi takip edin ve yönetin", de: "Verfolgen Sie Ihre Transfers", pl: "Śledź swoje transfery", ru: "Отслеживайте свои трансферы" },
  googleBtn: { en: "Continue with Google", tr: "Google ile devam et", de: "Weiter mit Google", pl: "Kontynuuj z Google", ru: "Продолжить через Google" },
  or: { en: "or", tr: "veya", de: "oder", pl: "lub", ru: "или" },
  firstName: { en: "First Name", tr: "Ad", de: "Vorname", pl: "Imię", ru: "Имя" },
  lastName: { en: "Last Name", tr: "Soyad", de: "Nachname", pl: "Nazwisko", ru: "Фамилия" },
  email: { en: "Email", tr: "E-posta", de: "E-Mail", pl: "Email", ru: "Эл. почта" },
  password: { en: "Password", tr: "Şifre", de: "Passwort", pl: "Hasło", ru: "Пароль" },
  loginBtn: { en: "Sign In", tr: "Giriş Yap", de: "Anmelden", pl: "Zaloguj", ru: "Войти" },
  registerBtn: { en: "Create Account", tr: "Hesap Oluştur", de: "Registrieren", pl: "Utwórz konto", ru: "Создать" },
  noAccount: { en: "Don't have an account?", tr: "Hesabınız yok mu?", de: "Kein Konto?", pl: "Nie masz konta?", ru: "Нет аккаунта?" },
  hasAccount: { en: "Already have an account?", tr: "Zaten hesabınız var mı?", de: "Bereits registriert?", pl: "Masz już konto?", ru: "Уже есть аккаунт?" },
  registerLink: { en: "Register", tr: "Kayıt Ol", de: "Registrieren", pl: "Zarejestruj", ru: "Регистрация" },
  loginLink: { en: "Sign In", tr: "Giriş Yap", de: "Anmelden", pl: "Zaloguj", ru: "Войти" },
  checkEmail: { en: "Check your email to confirm your account.", tr: "Hesabınızı onaylamak için e-postanızı kontrol edin.", de: "Überprüfen Sie Ihre E-Mail.", pl: "Sprawdź swój email.", ru: "Проверьте почту для подтверждения." },
  forgotPassword: { en: "Forgot Password?", tr: "Şifremi Unuttum", de: "Passwort vergessen?", pl: "Zapomniałeś hasła?", ru: "Забыли пароль?" },
  alreadyRegistered: { en: "This email is already registered.", tr: "Bu e-posta zaten kayıtlı.", de: "Diese E-Mail ist bereits registriert.", pl: "Ten email jest już zarejestrowany.", ru: "Этот email уже зарегистрирован." },
  alreadyRegisteredHint: { en: "An account was created with your booking. Use 'Forgot Password' to set your password.", tr: "Rezervasyonunuzla birlikte hesap oluşturuldu. 'Şifremi Unuttum' ile şifre belirleyin.", de: "Mit Ihrer Buchung wurde ein Konto erstellt. Verwenden Sie 'Passwort vergessen'.", pl: "Konto utworzone z rezerwacją. Użyj 'Zapomniałeś hasła?'.", ru: "Аккаунт создан при бронировании. Используйте 'Забыли пароль?'." },
  resetEmailSent: { en: "Password reset link sent to your email.", tr: "Şifre sıfırlama linki e-postanıza gönderildi.", de: "Link zum Zurücksetzen wurde gesendet.", pl: "Link do resetowania wysłany.", ru: "Ссылка для сброса отправлена." },
  enterEmailFirst: { en: "Enter your email first.", tr: "Önce e-postanızı girin.", de: "Bitte E-Mail eingeben.", pl: "Najpierw wpisz email.", ru: "Сначала введите email." },
  pwMinLength: { en: "Password must be at least 8 characters", tr: "Şifre en az 8 karakter olmalı", de: "Mindestens 8 Zeichen", pl: "Minimum 8 znaków", ru: "Минимум 8 символов" },
  pwRequirements: { en: "Must contain uppercase, lowercase, and a number", tr: "Büyük harf, küçük harf ve rakam içermeli", de: "Groß-, Kleinbuchstaben und Zahl erforderlich", pl: "Wielka litera, mała litera i cyfra", ru: "Заглавная, строчная буква и цифра" },
};

interface AuthModalProps {
  onClose: () => void;
  locale: string;
}

export default function AuthModal({ onClose, locale }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t.enterEmailFirst[locale] ?? t.enterEmailFirst.en);
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setShowAlreadyRegistered(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(t.resetEmailSent[locale] ?? t.resetEmailSent.en);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setShowAlreadyRegistered(false);

    if (mode === "register") {
      if (password.length < 8) {
        setError(t.pwMinLength[locale] ?? t.pwMinLength.en);
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        setError(t.pwRequirements[locale] ?? t.pwRequirements.en);
        setLoading(false);
        return;
      }
    }

    if (mode === "register") {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `${firstName} ${lastName}`, first_name: firstName, last_name: lastName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account`,
        },
      });
      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already been registered") ||
          error.message.toLowerCase().includes("user already exists")
        ) {
          setShowAlreadyRegistered(true);
        } else {
          setError(error.message);
        }
      } else if (data?.user?.identities?.length === 0) {
        setShowAlreadyRegistered(true);
      } else {
        setSuccess(t.checkEmail[locale] ?? t.checkEmail.en);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        onClose();
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "login" ? (t.loginTitle[locale] ?? t.loginTitle.en) : (t.registerTitle[locale] ?? t.registerTitle.en)}
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {t.subtitle[locale] ?? t.subtitle.en}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-60 text-sm"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t.googleBtn[locale] ?? t.googleBtn.en}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t.or[locale] ?? t.or.en}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t.firstName[locale] ?? t.firstName.en}
                  className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t.lastName[locale] ?? t.lastName.en}
                  className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                />
              </div>
            )}

            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email[locale] ?? t.email.en}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password[locale] ?? t.password.en}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            {/* Already registered */}
            {showAlreadyRegistered && (
              <div className="bg-blue-50 rounded-xl p-3 space-y-1.5" style={{ border: "1px solid rgba(0,122,255,0.15)" }}>
                <p className="text-blue-600 text-xs font-medium">
                  {t.alreadyRegistered[locale] ?? t.alreadyRegistered.en}
                </p>
                <p className="text-gray-500 text-[11px]">
                  {t.alreadyRegisteredHint[locale] ?? t.alreadyRegisteredHint.en}
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium underline"
                >
                  {t.forgotPassword[locale] ?? t.forgotPassword.en}
                </button>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 px-3 py-2 rounded-lg">
                <Mail size={14} className="shrink-0" /> {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-sm"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === "login" ? (t.loginBtn[locale] ?? t.loginBtn.en) : (t.registerBtn[locale] ?? t.registerBtn.en)}
            </button>

            {/* Forgot password */}
            {mode === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-center text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                {t.forgotPassword[locale] ?? t.forgotPassword.en}
              </button>
            )}
          </form>

          {/* Switch mode */}
          <p className="text-center text-xs text-gray-400 mt-4">
            {mode === "login" ? (t.noAccount[locale] ?? t.noAccount.en) : (t.hasAccount[locale] ?? t.hasAccount.en)}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); setShowAlreadyRegistered(false); }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === "login" ? (t.registerLink[locale] ?? t.registerLink.en) : (t.loginLink[locale] ?? t.loginLink.en)}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
