import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";

export function OrdersSection() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [page, setPage] = React.useState(1);
  const ordersQuery = useOrders({ page, limit: 10 }, accessToken);

  const orders = ordersQuery.data?.orders ?? [];
  const pagination = ordersQuery.data?.pagination;

  return (
    <div className="space-y-4">
      {orders.length ? (
        orders.map((order) => (
          <div key={order.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("orders.orderId", { id: order.id })}</p>
                <p className="text-sm text-muted-foreground">
                  {t("orders.status")} · {order.status}
                </p>
              </div>
              <p className="text-sm font-medium">
                {order.total} {order.currency}
              </p>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>{item.baseName}</span>
                  <span>{item.quantity}×</span>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{t("orders.empty")}</p>
      )}

      {pagination && pagination.total > pagination.limit && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            {t("ingredients.prev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page * pagination.limit >= pagination.total}
          >
            {t("ingredients.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
