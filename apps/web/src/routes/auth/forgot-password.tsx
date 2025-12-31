import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.errors.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-6 sm:p-8 bg-card rounded-lg shadow-lg border">
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold">{t("auth.forgot.title")}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("auth.forgot.description")}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/15 border border-green-500 text-green-600 dark:text-green-400 px-4 py-3 rounded text-sm">
            {t("auth.forgot.success")}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            {t("auth.forgot.email")}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium text-base"
        >
          {loading ? t("auth.forgot.loading") : t("auth.forgot.submit")}
        </button>

        <div className="text-center">
          <a href="/auth/login" className="text-sm text-primary hover:underline">
            {t("auth.forgot.backToLogin")}
          </a>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});