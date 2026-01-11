"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Shield, Trash2, Lock } from "lucide-react";

export function SecuritySection() {
  const { t } = useTranslation();
  const { changePassword, deleteAccount } = useAuth();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const [deletePassword, setDeletePassword] = React.useState("");
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("profile.passwordRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(t("profile.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      if (error instanceof Error) {
        if (error.message.includes("wrong-password") || error.message.includes("invalid-credential")) {
          toast.error(t("profile.incorrectPassword"));
        } else {
          toast.error(t("profile.error"));
        }
      } else {
        toast.error(t("profile.error"));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(t("profile.passwordRequired"));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      toast.success(t("profile.accountDeleted"));
      // The user will be logged out automatically
    } catch (error: unknown) {
      console.error("Error deleting account:", error);
      if (error instanceof Error) {
        if (error.message.includes("wrong-password") || error.message.includes("invalid-credential")) {
          toast.error(t("profile.incorrectPassword"));
        } else {
          toast.error(t("profile.error"));
        }
      } else {
        toast.error(t("profile.error"));
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
      setDeletePassword("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t("profile.changePassword")}</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t("profile.currentPassword")}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("profile.currentPasswordPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("profile.newPasswordPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("profile.confirmPasswordPlaceholder")}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? (
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

      {/* 2FA Section (Disabled) */}
      <div className="space-y-4 rounded-lg border bg-card p-6 opacity-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t("profile.twoFactorAuth")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("profile.twoFactorAuthHint")}
        </p>
        <Button disabled variant="outline">
          {t("profile.enable")}
        </Button>
      </div>

      {/* Delete Account */}
      <div className="space-y-4 rounded-lg border border-destructive/50 bg-card p-6">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h2 className="text-xl font-semibold text-destructive">
            {t("profile.deleteAccount")}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("profile.deleteAccountWarning")}
        </p>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" type="button">
              {t("profile.deleteAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profile.deleteAccountConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("profile.deleteAccountConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deletePassword">{t("profile.currentPassword")}</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || !deletePassword}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("profile.deleting")}
                  </>
                ) : (
                  t("profile.deleteAccount")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

