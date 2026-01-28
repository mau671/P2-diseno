import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  useRecurringOrders,
  useRunRecurringOrder,
  useUpdateRecurringOrderStatus,
} from "@/hooks/use-recurring-orders";
import { Button } from "@/components/ui/button";

export function RecurringOrdersSection() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const recurringQuery = useRecurringOrders(accessToken);
  const updateStatus = useUpdateRecurringOrderStatus(accessToken);
  const runNow = useRunRecurringOrder(accessToken);

  const orders = recurringQuery.data?.recurring_orders ?? [];

  return (
    <div className="space-y-4">
      {orders.length ? (
        orders.map((recurring) => (
          <div key={recurring.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("recurringOrders.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("recurringOrders.frequency")}: {recurring.frequency}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{recurring.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recurring.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus.mutate({ id: recurring.id, status: "paused" })}
                >
                  {t("recurringOrders.pause")}
                </Button>
              )}
              {recurring.status === "paused" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus.mutate({ id: recurring.id, status: "active" })}
                >
                  {t("recurringOrders.resume")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus.mutate({ id: recurring.id, status: "cancelled" })}
              >
                {t("recurringOrders.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => runNow.mutate(recurring.id)}
                disabled={runNow.isPending}
              >
                {t("recurringOrders.runNow")}
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{t("recurringOrders.empty")}</p>
      )}
    </div>
  );
}
