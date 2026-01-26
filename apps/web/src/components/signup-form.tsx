import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
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
      const result = await signUp(email, password, fullName.trim() || undefined);
      if (result.session) {
        navigate({ to: "/" });
        return;
      }
      const params = new URLSearchParams({ status: "pending", email });
      navigate({ to: `/auth/verify?${params.toString()}` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.errors.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("auth.register.createYourAccount")}</CardTitle>
          <CardDescription>
            {t("auth.register.enterEmailToCreate")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <Field>
                  <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="fullName">{t("auth.register.fullName")}</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("auth.register.fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">{t("auth.register.email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.register.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">{t("auth.register.password")}</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      {t("auth.register.confirmPassword")}
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  {t("auth.register.passwordMinLength")}
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? t("auth.register.loading") : t("auth.register.submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("auth.register.hasAccount")}{" "}
                  <a href="/auth/login" className="text-primary hover:underline font-medium">
                    {t("auth.register.loginLink")}
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t("auth.legal.byClickingContinue")} <a href="#">{t("auth.legal.termsOfService")}</a>{" "}
        {t("auth.legal.and")} <a href="#">{t("auth.legal.privacyPolicy")}</a>.
      </FieldDescription>
    </div>
  );
}
