// apps/web/src/components/query-state.tsx
import { Button } from "@/components/ui/button";
import { ApiError } from "@/api/jikan";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

type QueryStateProps = {
  title?: string;
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyText?: string; // si querés override desde afuera
};

export function QueryState({
  title,
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyText,
}: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-xl border p-4">
        {title ? <h3 className="mb-2 text-lg font-semibold">{title}</h3> : null}
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    const msg = getErrorMessage(error, t("common.loadError"));
    return (
      <div className="rounded-xl border p-4 space-y-3">
        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
        <p className="text-sm text-destructive">{msg}</p>
        {onRetry ? <Button onClick={onRetry}>{t("common.retry")}</Button> : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-xl border p-4">
        {title ? <h3 className="mb-2 text-lg font-semibold">{title}</h3> : null}
        <p className="text-sm text-muted-foreground">
          {emptyText ?? t("search.empty")}
        </p>
      </div>
    );
  }

  return null;
}
