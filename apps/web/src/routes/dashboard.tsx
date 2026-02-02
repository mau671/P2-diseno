import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/context/restaurant-context";
import { useDashboard } from "@/hooks/use-dashboard";

import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function toNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyCRC(value: unknown) {
  const n = toNumber(value);
  return `₡${n.toFixed(2).replace(".", ",")}`;
}

function formatTime(value: unknown) {
  if (!value) return "--:--";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "--:--";

  return new Intl.DateTimeFormat("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusLabel(status: string) {
  switch (status) {
    case "preparing":
      return "Preparando";
    case "pending":
      return "Pendiente";
    case "delivering":
      return "En camino";
    case "paid":
      return "Pagado";
    case "completed":
      return "Entregado";
    default:
      return status;
  }
}

function StatusPill({ status }: { status: string }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border";

  // ✅ Colores como pediste: pendiente amarillo, pagado verde, preparando azul, en camino morado
  const cls =
    status === "preparing"
      ? "border-blue-500/30 text-blue-300"
      : status === "pending"
      ? "border-yellow-500/30 text-yellow-300"
      : status === "delivering"
      ? "border-purple-500/30 text-purple-300"
      : status === "paid"
      ? "border-green-500/30 text-green-300"
      : status === "completed"
      ? "border-emerald-500/30 text-emerald-300"
      : "border-muted-foreground/30 text-muted-foreground";

  return <span className={`${base} ${cls}`}>{statusLabel(status)}</span>;
}

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { session, user, loading: authLoading } = useAuth();
  const { selectedRestaurantId } = useRestaurant();

  // ✅ Hook SIEMPRE se llama
  const dashboardQuery = useDashboard(selectedRestaurantId, session?.access_token);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, navigate, user]);

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  if (!selectedRestaurantId) {
    return (
      <EmptyState
        message={t("dashboard.selectRestaurant", {
          defaultValue: "Selecciona un restaurante para ver el tablero.",
        })}
      />
    );
  }

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <LoadingState />;
  }

  if (dashboardQuery.isError) {
    const message =
      dashboardQuery.error instanceof Error
        ? dashboardQuery.error.message
        : t("common.loadError", { defaultValue: "Ocurrió un error cargando." });

    return <ErrorState message={message} onRetry={() => dashboardQuery.refetch()} />;
  }

  const raw = (dashboardQuery.data ?? {}) as any;

  // RPC devuelve anidado: today.orders, today.revenue, etc.
  const today = raw.today ?? {};

  const restaurantName =
    raw.restaurant_name ??
    raw.restaurantName ??
    t("dashboard.restaurant", { defaultValue: "Restaurante" });

  const ordersToday = toNumber(raw.orders_today ?? raw.ordersToday ?? today.orders ?? 0);
  const revenueToday = toNumber(raw.revenue_today ?? raw.revenueToday ?? today.revenue ?? 0);

  // en SQL ahora es "clientes del día" (usuarios únicos que ordenaron hoy)
  const activeCustomers = toNumber(
    raw.active_customers ?? raw.activeCustomers ?? today.active_customers ?? 0
  );

  const avgMinutes = toNumber(
    raw.avg_minutes ??
      raw.avgMinutes ??
      raw.avg_time_minutes ??
      today.avg_prep_minutes ??
      raw.avg_prep_minutes ??
      0
  );

  const activeOrders = (raw.active_orders ?? raw.activeOrders ?? []) as any[];
  const popularDishes = (raw.popular_dishes ?? raw.popularDishes ?? []) as any[];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">
          {t("dashboard.title", { defaultValue: "Tablero" })}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.subtitle", { defaultValue: "Panel de {{name}}", name: restaurantName })}
          {dashboardQuery.isFetching
            ? ` · ${t("common.loading", { defaultValue: "Cargando..." })}`
            : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.cards.ordersToday", { defaultValue: "Órdenes del día (00:00–23:59)" })}
          </p>
          <p className="mt-2 text-3xl font-bold">{ordersToday}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.cards.revenueToday", { defaultValue: "Ingresos del día (00:00–23:59)" })}
          </p>
          <p className="mt-2 text-3xl font-bold">{formatMoneyCRC(revenueToday)}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.cards.activeCustomers", { defaultValue: "Clientes del día" })}
          </p>
          <p className="mt-2 text-3xl font-bold">{activeCustomers}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.cards.avgTime", { defaultValue: "Tiempo promedio (del día)" })}
          </p>
          <p className="mt-2 text-3xl font-bold">{Math.round(avgMinutes)} min</p>
        </div>
      </div>

      {/* Órdenes activas (TABLA) */}
      <div className="rounded-xl border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {t("dashboard.activeOrders.title", { defaultValue: "Órdenes activas" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.activeOrders.subtitle", {
                defaultValue: "Pedidos de hoy (00:00–23:59)",
              })}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/orders" as any })}
          >
            {t("dashboard.activeOrders.manage", { defaultValue: "Gestionar pedidos" })}
          </Button>
        </div>

        <div className="mt-4">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.activeOrders.empty", { defaultValue: "No hay órdenes activas." })}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-left">
                      {t("dashboard.table.customer", { defaultValue: "CLIENTE" })}
                    </th>
                    <th className="py-2 text-left">
                      {t("dashboard.table.items", { defaultValue: "ITEMS" })}
                    </th>
                    <th className="py-2 text-right">
                      {t("dashboard.table.total", { defaultValue: "TOTAL" })}
                    </th>
                    <th className="py-2 text-right">
                      {t("dashboard.table.status", { defaultValue: "ESTADO" })}
                    </th>
                    <th className="py-2 text-right">
                      {t("dashboard.table.time", { defaultValue: "HORA" })}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activeOrders.slice(0, 10).map((o) => {
                    const customer =
                      o.customer_name ??
                      o.customerName ??
                      o.full_name ??
                      o.fullName ??
                      o.username ??
                      "Cliente";

                    const items = toNumber(o.items_count ?? o.itemsCount ?? o.items ?? 0);
                    const total = o.total ?? o.amount ?? 0;
                    const status = String(o.status ?? "");
                    const time = o.created_at ?? o.createdAt ?? o.updated_at ?? o.updatedAt;

                    return (
                      <tr key={o.id} className="border-b last:border-b-0">
                        <td className="py-3">
                          <p className="font-medium">{customer}</p>
                        </td>

                        <td className="py-3 text-muted-foreground">
                          {items} {t("dashboard.table.dishes", { defaultValue: "platillos" })}
                        </td>

                        <td className="py-3 text-right font-semibold">
                          {formatMoneyCRC(total)}
                        </td>

                        <td className="py-3 text-right font-semibold">
                          <StatusPill status={status} />
                        </td>

                        <td className="py-3 text-right text-muted-foreground">
                          {formatTime(time)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Platillos populares (MES) */}
      <div className="rounded-xl border p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {t("dashboard.popular.title", { defaultValue: "Platillos populares del mes" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.popular.subtitle", {
              defaultValue: "Del 1 al último día del mes (mes calendario)",
            })}
          </p>
        </div>

        <div className="mt-4">
          {popularDishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.popular.empty", {
                defaultValue: "Aún no hay suficientes órdenes para calcular platillos populares.",
              })}
            </p>
          ) : (
            <div className="space-y-2">
              {popularDishes.slice(0, 8).map((p) => {
                const name = p.name ?? p.base_name ?? p.baseName ?? "Platillo";
                const count = toNumber(p.orders_count ?? p.count ?? p.qty ?? p.orders ?? 0);

                return (
                  <div
                    key={p.base_id ?? p.id ?? name}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{count}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
