"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function ProfileSection() {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const accessToken = session?.access_token;
  const { data, isLoading } = useProfile(accessToken);
  const updateProfile = useUpdateProfile(accessToken);
  const profile = data?.profile ?? null;
  const fullName = user?.user_metadata?.full_name || t("user.defaultName");
  const email = user?.email || t("common.na");

  const [formState, setFormState] = React.useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    date_of_birth: "",
    preferred_language: "es-419",
    preferred_currency_code: "",
    email_notifications: true,
    push_notifications: false,
  });

  React.useEffect(() => {
    if (!profile) return;
    setFormState({
      full_name: profile.full_name ?? fullName,
      phone: profile.phone ?? "",
      avatar_url: profile.avatar_url ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      preferred_language: profile.preferred_language ?? "es-419",
      preferred_currency_code: profile.preferred_currency_code ?? "",
      email_notifications: profile.notification_preferences?.email ?? true,
      push_notifications: profile.notification_preferences?.push ?? false,
    });
  }, [fullName, profile]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfile.mutateAsync({
      full_name: formState.full_name,
      phone: formState.phone || null,
      avatar_url: formState.avatar_url || null,
      date_of_birth: formState.date_of_birth || null,
      preferred_language: formState.preferred_language,
      preferred_currency_code: formState.preferred_currency_code || null,
      notification_preferences: {
        email: formState.email_notifications,
        push: formState.push_notifications,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("profile.userInfo")}</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading ? t("common.loading") : t("profile.preferences")}
        </p>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.fullName")}</p>
          <Input value={formState.full_name} onChange={handleChange("full_name")} />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.email")}</p>
          <Input value={email} disabled />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.phone")}</p>
          <Input value={formState.phone} onChange={handleChange("phone")} />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.avatar")}</p>
          <Input value={formState.avatar_url} onChange={handleChange("avatar_url")} />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.dateOfBirth")}</p>
          <Input type="date" value={formState.date_of_birth} onChange={handleChange("date_of_birth")} />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.preferredLanguage")}</p>
          <Select
            value={formState.preferred_language}
            onValueChange={(value) =>
              setFormState((prev) => ({ ...prev, preferred_language: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("profile.preferredLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es-419">{t("language.es")}</SelectItem>
              <SelectItem value="en-US">{t("language.en")}</SelectItem>
              <SelectItem value="pt-BR">{t("language.pt")}</SelectItem>
              <SelectItem value="fr-FR">{t("language.fr")}</SelectItem>
              <SelectItem value="it-IT">{t("language.it")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("profile.preferredCurrency")}</p>
          <Input
            value={formState.preferred_currency_code}
            onChange={handleChange("preferred_currency_code")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("profile.notifications")}</h3>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span>{t("profile.emailNotifications")}</span>
          <Switch
            checked={formState.email_notifications}
            onCheckedChange={(checked) =>
              setFormState((prev) => ({ ...prev, email_notifications: checked }))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span>{t("profile.pushNotifications")}</span>
          <Switch
            checked={formState.push_notifications}
            onCheckedChange={(checked) =>
              setFormState((prev) => ({ ...prev, push_notifications: checked }))
            }
          />
        </div>
      </div>

      {updateProfile.isError && (
        <p className="text-sm text-destructive">{t("profile.error")}</p>
      )}
      {updateProfile.isSuccess && (
        <p className="text-sm text-emerald-600">{t("profile.saved")}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? t("profile.saving") : t("profile.save")}
        </Button>
      </div>
    </form>
  );
}
