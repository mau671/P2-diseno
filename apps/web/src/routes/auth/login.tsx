// apps/web/src/routes/auth/login.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || t("auth.errors.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-6 sm:p-8 bg-card rounded-lg shadow-lg border">
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold">{t("auth.login.title")}</h2>
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
              {t("auth.login.email")}
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
              {t("auth.login.password")}
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
        </div>

        <div className="flex items-center justify-between">
          <a
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            {t("auth.login.forgotPassword")}
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium text-base"
        >
          {loading ? t("auth.login.loading") : t("auth.login.submit")}
        </button>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <a href="/auth/register" className="text-primary hover:underline font-medium">
              {t("auth.login.registerLink")}
            </a>
          </span>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});