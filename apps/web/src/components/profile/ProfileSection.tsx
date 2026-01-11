"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";

export function ProfileSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, updateDisplayName, updatePhotoURL } = useUserProfile();

  const [displayName, setDisplayName] = React.useState("");
  const [photoURL, setPhotoURL] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = React.useState(false);

  // Initialize displayName and photoURL from profile only once when profile/user loads
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitialized.current && (profile || user)) {
      if (profile?.displayName) {
        setDisplayName(profile.displayName);
      } else if (user?.displayName) {
        setDisplayName(user.displayName);
      }

      if (profile?.photoURL) {
        setPhotoURL(profile.photoURL);
      } else if (user?.photoURL) {
        setPhotoURL(user.photoURL);
      }

      hasInitialized.current = true;
    }
  }, [profile, user]);

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error(t("profile.error"));
      return;
    }

    setIsSaving(true);

    try {
      await updateDisplayName(displayName.trim());
      toast.success(t("profile.saved"));
    } catch (error) {
      console.error("Error saving display name:", error);
      toast.error(t("profile.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhotoURL = async () => {
    // Validate URL format (optional - allow empty to remove avatar)
    if (photoURL.trim() && !isValidURL(photoURL.trim())) {
      toast.error(t("profile.invalidURL"));
      return;
    }

    setIsSavingAvatar(true);

    try {
      const urlToSave = photoURL.trim() || null;
      await updatePhotoURL(urlToSave);
      toast.success(t("profile.saved"));
    } catch (error) {
      console.error("Error saving photo URL:", error);
      toast.error(t("profile.error"));
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const isValidURL = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const currentDisplayName = profile?.displayName || user?.displayName || t("user.defaultName");
  const currentPhotoURL = photoURL || profile?.photoURL || user?.photoURL || undefined;
  const initials = currentDisplayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{t("profile.userInfo")}</h2>

      {/* Avatar */}
      <div className="space-y-2">
        <label htmlFor="photoURL" className="text-sm font-medium">
          {t("profile.avatar")}
        </label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={currentPhotoURL || undefined}
              alt={currentDisplayName}
            />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                id="photoURL"
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://ejemplo.com/avatar.jpg"
                className="flex-1"
              />
              <Button
                onClick={handleSavePhotoURL}
                disabled={isSavingAvatar || photoURL === (profile?.photoURL || user?.photoURL || "")}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavingAvatar ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("profile.save")
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("profile.avatarURLHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          {t("profile.displayName")}
        </label>
        <div className="flex gap-2">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("profile.displayNamePlaceholder")}
            className="flex-1"
          />
            <Button
              onClick={handleSaveDisplayName}
              disabled={isSaving || displayName.trim() === currentDisplayName}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("profile.saving")}
                </>
              ) : (
                t("profile.save")
              )}
            </Button>
        </div>
      </div>
    </div>
  );
}

