import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";

function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <a href="#" className="flex items-center gap-2 self-center font-medium">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        {t("app.name")}
      </a>
      <LoginForm />
    </div>
  );
}

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});
