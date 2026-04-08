"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle, User, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AccountLoginPage() {
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
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const supabase = createClient();

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
      redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account`,
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

    // Password strength check for registration
    if (mode === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        setError("Password must contain uppercase, lowercase, and a number");
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
        // Check if user already exists (auto-created from booking)
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
        // Supabase returns empty identities when user already exists
        setShowAlreadyRegistered(true);
      } else {
        setSuccess(t.checkEmail[locale] ?? t.checkEmail.en);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(`/${locale}/account`);
        router.refresh();
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account`,
      },
    });
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#111113]">
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <User size={28} className="text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {mode === "login" ? (t.loginTitle[locale] ?? t.loginTitle.en) : (t.registerTitle[locale] ?? t.registerTitle.en)}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t.subtitle[locale] ?? t.subtitle.en}
            </p>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 mb-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t.googleBtn[locale] ?? t.googleBtn.en}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">{t.or[locale] ?? t.or.en}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t.firstName[locale] ?? t.firstName.en}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.lastName[locale] ?? t.lastName.en}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email[locale] ?? t.email.en}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password[locale] ?? t.password.en}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {showAlreadyRegistered && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-2">
                <p className="text-orange-400 text-sm font-medium">
                  {t.alreadyRegistered[locale] ?? t.alreadyRegistered.en}
                </p>
                <p className="text-gray-400 text-xs">
                  {t.alreadyRegisteredHint[locale] ?? t.alreadyRegisteredHint.en}
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-orange-500 hover:text-orange-400 text-sm font-medium underline"
                >
                  {t.forgotPassword[locale] ?? t.forgotPassword.en}
                </button>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Mail size={16} /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? (t.loginBtn[locale] ?? t.loginBtn.en) : (t.registerBtn[locale] ?? t.registerBtn.en)}
            </button>

            {mode === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-center text-sm text-gray-500 hover:text-orange-400 transition-colors"
              >
                {t.forgotPassword[locale] ?? t.forgotPassword.en}
              </button>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === "login" ? (t.noAccount[locale] ?? t.noAccount.en) : (t.hasAccount[locale] ?? t.hasAccount.en)}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              {mode === "login" ? (t.registerLink[locale] ?? t.registerLink.en) : (t.loginLink[locale] ?? t.loginLink.en)}
            </button>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Inline i18n — avoids complex namespace setup for a single page
const t: Record<string, Record<string, string>> = {
  loginTitle: { en: "Sign In", tr: "Giriş Yap", de: "Anmelden", pl: "Zaloguj się", ru: "Войти" },
  registerTitle: { en: "Create Account", tr: "Hesap Oluştur", de: "Konto erstellen", pl: "Utwórz konto", ru: "Создать аккаунт" },
  subtitle: { en: "Track your transfers & manage bookings", tr: "Transferlerinizi takip edin ve rezervasyonlarınızı yönetin", de: "Verfolgen Sie Ihre Transfers", pl: "Śledź swoje transfery", ru: "Отслеживайте свои трансферы" },
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
  alreadyRegistered: { en: "This email is already registered.", tr: "Bu e-posta adresi zaten kayıtlı.", de: "Diese E-Mail ist bereits registriert.", pl: "Ten email jest już zarejestrowany.", ru: "Этот email уже зарегистрирован." },
  alreadyRegisteredHint: { en: "An account was automatically created with your booking. Use 'Forgot Password' to set your password and access your account.", tr: "Rezervasyonunuzla birlikte otomatik olarak bir hesap oluşturuldu. Şifrenizi belirlemek için 'Şifremi Unuttum' butonunu kullanın.", de: "Mit Ihrer Buchung wurde automatisch ein Konto erstellt. Verwenden Sie 'Passwort vergessen', um Ihr Passwort festzulegen.", pl: "Konto zostało automatycznie utworzone z rezerwacją. Użyj 'Zapomniałeś hasła?' aby ustawić hasło.", ru: "Аккаунт был автоматически создан при бронировании. Используйте 'Забыли пароль?' для установки пароля." },
  resetEmailSent: { en: "Password reset link has been sent to your email.", tr: "Şifre sıfırlama linki e-posta adresinize gönderildi.", de: "Der Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail gesendet.", pl: "Link do resetowania hasła został wysłany na Twój email.", ru: "Ссылка для сброса пароля отправлена на вашу почту." },
  enterEmailFirst: { en: "Please enter your email address first.", tr: "Lütfen önce e-posta adresinizi girin.", de: "Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.", pl: "Najpierw wpisz swój adres email.", ru: "Сначала введите адрес электронной почты." },
};
