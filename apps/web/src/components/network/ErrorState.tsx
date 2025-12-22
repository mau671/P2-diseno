import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-3 text-sm text-destructive">{message}</div>
      <Button onClick={onRetry}>{t("common.retry")}</Button>
    </div>
  );
}

