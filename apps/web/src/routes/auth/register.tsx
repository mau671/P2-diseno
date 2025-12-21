// apps/web/src/routes/auth/register.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

function RegisterPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.register.passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || t("auth.errors.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-6 sm:p-8 bg-card rounded-lg shadow-lg border">
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold">{t("auth.register.title")}</h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              {t("auth.register.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-base"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              {t("auth.register.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-base"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
              {t("auth.register.confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-base"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium text-base"
        >
          {loading ? t("auth.register.loading") : t("auth.register.submit")}
        </button>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {t("auth.register.hasAccount")}{" "}
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              {t("auth.register.loginLink")}
            </a>
          </span>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});