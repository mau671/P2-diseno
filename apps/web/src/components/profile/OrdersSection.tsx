// web/src/components/profile/OrdersSection.tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/hooks/use-auth";

import { LoadingState } from "@/components/network/LoadingState";
import { EmptyState } from "@/components/network/EmptyState";

import { Button } from "@/components/ui/button";

type OrdersSectionProps = {
  // Permite que lo uses dentro de tu layout sin romper imports existentes.
  className?: string;

  // Si tu app tiene una ruta de "mis pedidos", podés pasarla desde el padre.
  // Por defecto no navega a nada para no asumir rutas y no afectar el resto del sistema.
  viewOrdersTo?: string;

  // Igual para recurrencias si existe una pantalla dedicada.
  viewRecurringTo?: string;
};

export function OrdersSection({ className, viewOrdersTo, viewRecurringTo }: OrdersSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Aquí se espera que el Profile ya exija sesión; si no hay user, no renderizamos nada para no alterar flujos.
  if (authLoading) return <LoadingState />;
  if (!user) return null;

  // Sección simple, segura y sin dependencias a APIs/hook obsoletos.
  return (
    <section className={className}>
      <div className="rounded-xl border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {t("orders.title", { defaultValue: "My orders" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("orders.emptyDesc", {
                defaultValue: "When you place your first order, it will show up here",
              })}
            </p>
          </div>

          {viewOrdersTo ? (
            <Button variant="outline" size="sm" onClick={() => navigate({ to: viewOrdersTo as any })}>
              {t("common.loadMore", { defaultValue: "Load more" })}
            </Button>
          ) : null}
        </div>

        <div className="mt-4">
          <EmptyState
            message={t("orders.empty", { defaultValue: "You have no orders yet" })}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {t("recurringOrders.title", { defaultValue: "Recurring orders" })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("recurringOrders.emptyDesc", {
                defaultValue: "Create a recurrence to automate your orders",
              })}
            </p>
          </div>

          {viewRecurringTo ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: viewRecurringTo as any })}
            >
              {t("recurringOrders.create", { defaultValue: "Create recurrence" })}
            </Button>
          ) : null}
        </div>

        <div className="mt-4">
          <EmptyState
            message={t("recurringOrders.empty", { defaultValue: "You have no recurring orders" })}
          />
        </div>
      </div>
    </section>
  );
}

export default OrdersSection;
