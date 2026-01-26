import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VerificationState = {
  status: "success" | "error" | "pending";
  message?: string;
  email?: string | null;
};

const parseParams = () => {
  if (typeof window === "undefined") {
    return { search: new URLSearchParams(), hash: new URLSearchParams() };
  }

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return { search, hash };
};

export const Route = createFileRoute("/auth/verify")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = React.useState<VerificationState>({ status: "pending" });

  React.useEffect(() => {
    const { search, hash } = parseParams();
    const error = search.get("error") || hash.get("error");
    const errorDescription = search.get("error_description") || hash.get("error_description");
    const type = search.get("type") || hash.get("type");
    const token = search.get("token") || hash.get("access_token");
    const status = search.get("status");
    const email = search.get("email");

    if (error || errorDescription) {
      setState({
        status: "error",
        message: errorDescription || error || t("auth.verify.errorDefault"),
      });
      return;
    }

    if (type === "signup" || token) {
      setState({ status: "success", email });
      return;
    }

    if (status === "pending") {
      setState({ status: "pending", email });
      return;
    }

    setState({ status: "pending", email });
  }, [t]);

  React.useEffect(() => {
    if (state.status !== "success") return;
    const timeout = window.setTimeout(() => {
      navigate({ to: "/auth/login" });
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [navigate, state.status]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.verify.title")}</CardTitle>
        <CardDescription>{t("auth.verify.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "success" && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">
              {t("auth.verify.success")}
            </div>
            <div>{t("auth.verify.redirecting")}</div>
          </div>
        )}
        {state.status === "error" && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.message}
          </div>
        )}
        {state.status === "pending" && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">
              {t("auth.verify.checkEmail")}
            </div>
            <div>
              {state.email
                ? t("auth.verify.pendingWithEmail", { email: state.email })
                : t("auth.verify.pending")}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to="/auth/login">{t("auth.verify.goToLogin")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
