import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/context/restaurant-context";
import { useDashboard } from "@/hooks/use-dashboard";

import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";

import { Button } from "@/components/ui/button";

// Aquí registra la ruta /dashboard y asigna el componente principal
export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

// Aquí normaliza un valor a número (por si viene string desde el backend)
function toNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

// Aquí formatea colones CRC con dos decimales y coma decimal
function formatMoneyCRC(value: unknown) {
  const n = toNumber(value);
  return `₡${n.toFixed(2).replace(".", ",")}`;
}

// Aquí decide el locale para Intl en función del idioma de i18n
function resolveLocale(lang?: string) {
  const l = String(lang ?? "").toLowerCase();
  if (l.startsWith("es")) return "es-CR";
  if (l.startsWith("en")) return "en-US";
  if (l.startsWith("pt")) return "pt-BR";
  if (l.startsWith("fr")) return "fr-FR";
  if (l.startsWith("it")) return "it-IT";
  return "es-CR";
}

// Aquí formatea hora:minuto y valida fechas inválidas con placeholders
function formatTime(value: unknown, locale: string) {
  if (!value) return "--:--";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "--:--";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Aquí traduce el status interno a texto de UI usando i18n
function statusLabel(status: string, t: TFunction) {
  switch (status) {
    case "preparing":
      return t("orders.statusPreparing", { defaultValue: "Preparando" });
    case "pending":
      return t("orders.statusPending", { defaultValue: "Pendiente" });
    case "delivering":
      return t("orders.statusDelivering", { defaultValue: "En camino" });
    case "paid":
      return t("orders.statusPaid", { defaultValue: "Pagado" });
    case "completed":
      return t("orders.statusCompleted", { defaultValue: "Entregado" });
    default:
      return status;
  }
}

// Aquí renderiza un pill de estado con colores por status (lectura rápida en tabla)
function StatusPill({ status, t }: { status: string; t: TFunction }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border";

  // Aquí asigna colores según el estado, para diferenciar el flujo visualmente
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

  return <span className={`${base} ${cls}`}>{statusLabel(status, t)}</span>;
}

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language); // Aquí define locale para formato de hora

  const navigate = useNavigate();

  const { session, user, loading: authLoading } = useAuth();
  const { selectedRestaurantId } = useRestaurant();

  // Aquí se llama el hook siempre (regla de hooks), aunque selectedRestaurantId sea null
  const dashboardQuery = useDashboard(selectedRestaurantId, session?.access_token);

  // Aquí redirige a login si ya terminó authLoading y no hay usuario
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, navigate, user]);

  // Aquí se maneja loading inicial de auth y evita render prematuro
  if (authLoading) return <LoadingState />;
  if (!user) return null;

  // Aquí exige selección de restaurante antes de cargar dashboard
  if (!selectedRestaurantId) {
    return (
      <EmptyState
        message={t("dashboard.selectRestaurant", {
          defaultValue: "Selecciona un restaurante para ver el tablero.",
        })}
      />
    );
  }

  // Aquí maneja loading mientras no exista data inicial
  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <LoadingState />;
  }

  // Aquí maneja error de consulta y ofrece reintentar
  if (dashboardQuery.isError) {
    const message =
      dashboardQuery.error instanceof Error
        ? dashboardQuery.error.message
        : t("common.loadError", { defaultValue: "Ocurrió un error cargando." });

    return <ErrorState message={message} onRetry={() => dashboardQuery.refetch()} />;
  }

  const raw = (dashboardQuery.data ?? {}) as any;

  // Aquí el RPC puede devolver datos anidados bajo today (today.orders, today.revenue, etc.)
  const today = raw.today ?? {};

  // Aquí define el nombre del restaurante con compatibilidad de keys (snake_case y camelCase)
  const restaurantName =
    raw.restaurant_name ??
    raw.restaurantName ??
    t("dashboard.restaurant", { defaultValue: "Restaurante" });

  // Aquí normaliza métricas de "hoy" soportando varias keys posibles del backend
  const ordersToday = toNumber(raw.orders_today ?? raw.ordersToday ?? today.orders ?? 0);
  const revenueToday = toNumber(raw.revenue_today ?? raw.revenueToday ?? today.revenue ?? 0);

  // Aquí "clientes del día" representa usuarios únicos que ordenaron hoy
  const activeCustomers = toNumber(
    raw.active_customers ?? raw.activeCustomers ?? today.active_customers ?? 0
  );

  // Aquí obtiene el promedio de minutos (varias keys por cambios de SQL/RPC)
  const avgMinutes = toNumber(
    raw.avg_minutes ??
      raw.avgMinutes ??
      raw.avg_time_minutes ??
      today.avg_prep_minutes ??
      raw.avg_prep_minutes ??
      0
  );

  // Aquí lista órdenes activas y platillos populares, con compatibilidad de nombres
  const activeOrders = (raw.active_orders ?? raw.activeOrders ?? []) as any[];
  const popularDishes = (raw.popular_dishes ?? raw.popularDishes ?? []) as any[];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{t("dashboard.title", { defaultValue: "Tablero" })}</h1>

        {/* Aquí agrega un indicador de "fetching" sin bloquear la UI */}
        <p className="text-muted-foreground">
          {t("dashboard.subtitle", { defaultValue: "Panel de {{name}}", name: restaurantName })}
          {dashboardQuery.isFetching ? ` · ${t("common.loading", { defaultValue: "Cargando..." })}` : ""}
        </p>
      </div>

      {/* Aquí renderiza tarjetas resumen con métricas del día */}
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
          <p className="mt-2 text-3xl font-bold">
            {Math.round(avgMinutes)} {t("dashboard.minutes", { defaultValue: "min" })}
          </p>
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

          {/* Aquí navega a /orders para gestión completa */}
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/orders" as any })}>
            {t("dashboard.activeOrders.manage", { defaultValue: "Gestionar pedidos" })}
          </Button>
        </div>

        <div className="mt-4">
          {/* Aquí muestra empty state cuando no hay órdenes activas */}
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
                  {/* Aquí limita a 10 filas para mantener dashboard liviano */}
                  {activeOrders.slice(0, 10).map((o) => {
                    // Aquí soporta múltiples posibles nombres para el cliente (compatibilidad backend)
                    const customer =
                      o.customer_name ??
                      o.customerName ??
                      o.full_name ??
                      o.fullName ??
                      o.username ??
                      t("dashboard.customerFallback", { defaultValue: "Cliente" });

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
                          {items}{" "}
                          {t("dashboard.table.dishes", {
                            defaultValue: "platillos",
                          })}
                        </td>

                        <td className="py-3 text-right font-semibold">{formatMoneyCRC(total)}</td>

                        <td className="py-3 text-right font-semibold">
                          <StatusPill status={status} t={t} />
                        </td>

                        <td className="py-3 text-right text-muted-foreground">
                          {formatTime(time, locale)}
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
          {/* Aquí se muestra un mensaje si aún no hay data suficiente */}
          {popularDishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.popular.empty", {
                defaultValue: "Aún no hay suficientes órdenes para calcular platillos populares.",
              })}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Aquí limita a 8 para que el dashboard no se haga largo */}
              {popularDishes.slice(0, 8).map((p) => {
                const name =
                  p.name ??
                  p.base_name ??
                  p.baseName ??
                  t("dashboard.popular.fallbackDish", { defaultValue: "Platillo" });

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
