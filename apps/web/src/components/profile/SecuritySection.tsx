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
import { Shield, Trash2, Lock, Mail } from "lucide-react";

export function SecuritySection() {
  const { t } = useTranslation();
  const { changePassword, deleteAccount, hasPassword, hasGoogle, linkPassword, linkGoogle, unlinkGoogle } = useAuth();

  //Change Password states
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  //Add Password states
  const [addPassword, setAddPassword] = React.useState("");
  const [addConfirmPassword, setAddConfirmPassword] = React.useState("");
  const [isAddingPassword, setIsAddingPassword] = React.useState(false);

  //Link Google state
  const [isLinkingGoogle, setIsLinkingGoogle] = React.useState(false);

  //Unlink Google state
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = React.useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = React.useState(false);

  //Delete Account states
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

  const handleAddPassword = async () => {
    if (!addPassword || !addConfirmPassword) {
      toast.error(t("profile.passwordRequired"));
      return;
    }

    if (addPassword !== addConfirmPassword) {
      toast.error(t("profile.passwordsDoNotMatch"));
      return;
    }

    if (addPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }

    setIsAddingPassword(true);
    try {
      await linkPassword(addPassword);
      toast.success(t("profile.passwordAdded"));
      setAddPassword("");
      setAddConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error adding password:", error);
      toast.error(t("profile.error"));
    } finally {
      setIsAddingPassword(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      await linkGoogle();
      toast.success(t("profile.googleLinked"));
    } catch (error: unknown) {
      console.error("Error linking Google:", error);
      if (error instanceof Error && error.message.includes("credential-already-in-use")) {
        toast.error(t("profile.googleAlreadyInUse"));
      } else {
        toast.error(t("profile.error"));
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!hasPassword) {
      toast.error(t("profile.cannotUnlinkOnlyMethod"));
      return;
    }

    setIsUnlinkingGoogle(true);
    try {
      await unlinkGoogle();
      toast.success(t("profile.googleUnlinked"));
      setShowUnlinkDialog(false);
    } catch (error: unknown) {
      console.error("Error unlinking Google:", error);
      if (error instanceof Error && error.message.includes("only authentication method")) {
        toast.error(t("profile.cannotUnlinkOnlyMethod"));
      } else {
        toast.error(t("profile.error"));
      }
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword && hasPassword) {
      toast.error(t("profile.passwordRequired"));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      toast.success(t("profile.accountDeleted"));
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
      {/*Change Password, solo si tiene password */}
      {hasPassword && (
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
              className="cursor-pointer"
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
      )}

      {/* Add Password, solo si no tiene password */}
      {!hasPassword && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t("profile.addPassword")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("profile.addPasswordHint")}
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addPassword">{t("profile.newPassword")}</Label>
              <Input
                id="addPassword"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder={t("profile.newPasswordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addConfirmPassword">{t("profile.confirmPassword")}</Label>
              <Input
                id="addConfirmPassword"
                type="password"
                value={addConfirmPassword}
                onChange={(e) => setAddConfirmPassword(e.target.value)}
                placeholder={t("profile.confirmPasswordPlaceholder")}
              />
            </div>
            <Button
              onClick={handleAddPassword}
              disabled={isAddingPassword || !addPassword || !addConfirmPassword}
              className="cursor-pointer"
            >
              {isAddingPassword ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("profile.adding")}
                </>
              ) : (
                t("profile.addPassword")
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Link Google, solo si no tiene Google */}
      {!hasGoogle && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <h2 className="text-xl font-semibold">{t("profile.linkGoogle")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("profile.linkGoogleHint")}
          </p>
          <Button
            onClick={handleLinkGoogle}
            disabled={isLinkingGoogle}
            variant="outline"
            className="cursor-pointer"
          >
            {isLinkingGoogle ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("profile.linking")}
              </>
            ) : (
              t("profile.linkWithGoogle")
            )}
          </Button>
        </div>
      )}

      {/* Unlink Google, solo si tiene Google y tiene password */}
      {hasGoogle && hasPassword && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <h2 className="text-xl font-semibold">{t("profile.unlinkGoogle")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("profile.unlinkGoogleHint")}
          </p>
          <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                {t("profile.unlinkGoogle")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("profile.unlinkGoogleConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("profile.unlinkGoogleConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnlinkGoogle}
                  disabled={isUnlinkingGoogle}
                  className="cursor-pointer"
                >
                  {isUnlinkingGoogle ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t("profile.unlinking")}
                    </>
                  ) : (
                    t("profile.unlinkGoogle")
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

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
            <Button variant="destructive" type="button" className="cursor-pointer">
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
            {hasPassword && (
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
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || (hasPassword && !deletePassword)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer disabled:cursor-not-allowed"
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