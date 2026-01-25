"use client";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function ProfileSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name || t("user.defaultName");
  const email = user?.email || t("common.na");

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{t("profile.userInfo")}</h2>

      <div className="grid gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{t("profile.fullName")}</p>
          <p className="text-base font-medium">{fullName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("profile.email")}</p>
          <p className="text-base font-medium">{email}</p>
        </div>
      </div>
    </div>
  );
}
