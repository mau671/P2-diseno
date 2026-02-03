// src/routes/orders.tsx
import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ChevronRight, X, CheckCircle2, ArrowLeft, Eye } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/context/restaurant-context";
import { useOrderActions, useOrdersManage, useRecurringOrdersManage } from "@/hooks/use-orders-manage";

import { Button } from "@/components/ui/button";
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

import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import type { OrderManageRow, RecurringOrderManageRow } from "@/api/orders";

export const Route = createFileRoute("/orders")({
  component: OrdersManagePage,
});

const FLOW = ["pending", "paid", "preparing", "delivering", "completed"] as const;

function toNumber(v: unknown) {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyCRC(value: unknown) {
  const n = toNumber(value);
  return `₡${n.toFixed(2).replace(".", ",")}`;
}

function resolveLocale(lang?: string) {
  const l = String(lang ?? "").toLowerCase();
  if (l.startsWith("es")) return "es-CR";
  if (l.startsWith("en")) return "en-US";
  if (l.startsWith("pt")) return "pt-BR";
  if (l.startsWith("fr")) return "fr-FR";
  if (l.startsWith("it")) return "it-IT";
  return "es-CR";
}

function formatTime(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "--:--";
  }
}

function formatDateTime(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  try {
    const s = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
    return s.replace(",", ""); // quita coma para que sea 1 línea más limpio
  } catch {
    return "—";
  }
}

function statusLabel(status: string, t: TFunction) {
  switch (status) {
    case "pending":
      return t("orders.statusPending", { defaultValue: "Pendiente" });
    case "paid":
      return t("orders.statusPaid", { defaultValue: "Pagado" });
    case "preparing":
      return t("orders.statusPreparing", { defaultValue: "Preparando" });
    case "delivering":
      return t("orders.statusDelivering", { defaultValue: "En camino" });
    case "completed":
      return t("orders.statusCompleted", { defaultValue: "Finalizado" });
    default:
      return status;
  }
}

function recurringStatusLabel(status: string, t: TFunction) {
  const s = String(status ?? "").toLowerCase();
  if (s === "active") return t("recurringOrders.statusActive", { defaultValue: "Activa" });
  if (s === "paused") return t("recurringOrders.statusPaused", { defaultValue: "Pausada" });
  if (s === "cancelled" || s === "canceled") {
    return t("recurringOrders.statusCancelled", { defaultValue: "Cancelada" });
  }
  return status;
}

function StatusPill({ status, t }: { status: string; t: TFunction }) {
  const base = "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs border whitespace-nowrap";

  const cls =
    status === "pending"
      ? "border-yellow-500/30 text-yellow-300 bg-yellow-500/10"
      : status === "paid"
      ? "border-green-500/30 text-green-300 bg-green-500/10"
      : status === "preparing"
      ? "border-blue-500/30 text-blue-300 bg-blue-500/10"
      : status === "delivering"
      ? "border-purple-500/30 text-purple-300 bg-purple-500/10"
      : status === "completed"
      ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
      : "border-muted-foreground/30 text-muted-foreground";

  return <span className={`${base} ${cls}`}>{statusLabel(status, t)}</span>;
}

function canGoNext(status: string) {
  const i = FLOW.indexOf(status as any);
  return i >= 0 && i < FLOW.length - 1 && status !== "completed";
}

/** ===== helpers recurrentes ===== */
function intervalLabel(unit: string | null | undefined, value: unknown, t: TFunction) {
  const v = Math.max(1, toNumber(value) || 1);
  const u = String(unit ?? "").toLowerCase();

  if (u === "week")
    return t("ordersManage.recurring.intervalWeek", {
      count: v,
      defaultValue: v === 1 ? "Cada {{count}} semana" : "Cada {{count}} semanas",
    });

  if (u === "month")
    return t("ordersManage.recurring.intervalMonth", {
      count: v,
      defaultValue: v === 1 ? "Cada {{count}} mes" : "Cada {{count}} meses",
    });

  if (u === "day")
    return t("ordersManage.recurring.intervalDay", {
      count: v,
      defaultValue: v === 1 ? "Cada {{count}} día" : "Cada {{count}} días",
    });

  return t("ordersManage.recurring.intervalFallback", { defaultValue: "Intervalo" });
}

function weekdayShortKey(n: number) {
  // 0=Sun, 1=Mon...
  const map: Record<number, string> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };
  return map[n] ?? String(n);
}

function weekdayShortDefault(n: number) {
  const map: Record<number, string> = { 0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" };
  return map[n] ?? String(n);
}

function daysOfWeekLabel(arr: unknown, t: TFunction) {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  const nums = arr.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const uniq = Array.from(new Set(nums)).sort((a, b) => a - b);

  return uniq
    .map((n) =>
      t(`ordersManage.weekdaysShort.${weekdayShortKey(n)}`, {
        defaultValue: weekdayShortDefault(n),
      })
    )
    .join(", ");
}

function daysOfMonthLabel(arr: unknown) {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  const nums = arr.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const uniq = Array.from(new Set(nums)).sort((a, b) => a - b);
  return uniq.join(", ");
}

function normalizeTimeWindows(input: unknown): Array<{ start?: string; end?: string }> {
  if (!input) return [];

  // si viene string: intenta JSON.parse
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return normalizeTimeWindows(parsed);
    } catch {
      return [];
    }
  }

  // si viene objeto: lo envolvemos en array
  if (typeof input === "object" && !Array.isArray(input)) {
    return [input as any];
  }

  if (Array.isArray(input)) {
    return input
      .map((x) => {
        if (typeof x === "string") {
          try {
            return JSON.parse(x);
          } catch {
            return null;
          }
        }
        return x;
      })
      .filter(Boolean) as any[];
  }

  return [];
}

function timeWindowsLabel(tw: unknown) {
  const list = normalizeTimeWindows(tw);
  if (list.length === 0) return "—";
  // mostramos solo la primera ventana (la mayoría de ustedes usa 1)
  const first = list[0] ?? {};
  const s = typeof first.start === "string" ? first.start : "";
  const e = typeof first.end === "string" ? first.end : "";
  if (s && e) return `${s}-${e}`;
  if (s) return `${s}`;
  return "—";
}

function joinItemNames(names?: unknown) {
  if (!Array.isArray(names) || names.length === 0) return [];
  return names.map((x) => String(x)).filter((s) => s.trim().length > 0);
}

function OrdersManagePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);

  const { session, user, loading: authLoading } = useAuth();
  const { selectedRestaurantId } = useRestaurant();
  const accessToken = session?.access_token;

  const ordersQuery = useOrdersManage(selectedRestaurantId, accessToken);
  const recurringQuery = useRecurringOrdersManage(selectedRestaurantId, accessToken);

  const actions = useOrderActions(selectedRestaurantId, accessToken);

  React.useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth/login" });
  }, [authLoading, user, navigate]);

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  if (!selectedRestaurantId) {
    return (
      <EmptyState
        message={t("ordersManage.selectRestaurant", {
          defaultValue: "Selecciona un restaurante para gestionar pedidos.",
        })}
      />
    );
  }

  const rows: OrderManageRow[] = ordersQuery.data ?? [];
  const recurringRows: RecurringOrderManageRow[] = recurringQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">
            {t("ordersManage.title", { defaultValue: "Gestionar pedidos" })}
          </h1>
          <p className="text-muted-foreground">
            {t("ordersManage.subtitle", { defaultValue: "Pedidos del día + pedidos recurrentes" })}
            {(ordersQuery.isFetching || recurringQuery.isFetching)
              ? ` · ${t("common.loading", { defaultValue: "Cargando..." })}`
              : ""}
          </p>
        </div>

        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back", { defaultValue: "Volver" })}
        </Button>
      </div>

      {/* ========= RECURRENTES ========= */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">
              {t("ordersManage.recurring.title", { defaultValue: "Pedidos recurrentes" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("ordersManage.recurring.subtitle", {
                defaultValue: "Programaciones activas/pausadas (se ejecutan según día/hora definida)",
              })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("ordersManage.showing", { defaultValue: "Mostrando {{count}}", count: recurringRows.length })}
          </p>
        </div>

        {recurringQuery.isLoading && !recurringQuery.data ? (
          <div className="px-4 pb-4">
            <LoadingState />
          </div>
        ) : recurringQuery.isError ? (
          <div className="px-4 pb-4">
            <ErrorState
              message={
                recurringQuery.error instanceof Error
                  ? recurringQuery.error.message
                  : t("ordersManage.recurring.loadError", { defaultValue: "Error cargando recurrentes." })
              }
              onRetry={() => recurringQuery.refetch()}
            />
          </div>
        ) : recurringRows.length === 0 ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            {t("ordersManage.recurring.empty", { defaultValue: "No hay pedidos recurrentes." })}
          </div>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[220px_110px_minmax(330px,1fr)_140px_90px_120px_170px] gap-3 border-t border-b px-4 py-3 text-xs font-semibold text-muted-foreground">
                <div>{t("ordersManage.table.customer", { defaultValue: "CLIENTE" })}</div>
                <div>{t("ordersManage.table.status", { defaultValue: "ESTADO" })}</div>
                <div>{t("ordersManage.table.schedule", { defaultValue: "PROGRAMACIÓN" })}</div>
                <div>{t("ordersManage.table.names", { defaultValue: "NOMBRES" })}</div>
                <div className="text-right">{t("ordersManage.table.items", { defaultValue: "ITEMS" })}</div>
                <div className="text-right">{t("ordersManage.table.total", { defaultValue: "TOTAL" })}</div>
                <div className="text-right">{t("ordersManage.table.next", { defaultValue: "PRÓXIMA" })}</div>
              </div>

              <div className="divide-y">
                {recurringRows.map((r) => {
                  const customer = r.customer_name?.trim()
                    ? r.customer_name
                    : t("ordersManage.customerFallback", { defaultValue: "Cliente" });

                  const names = joinItemNames(r.item_names);
                  const tw = timeWindowsLabel(r.time_windows);

                  const unit = String(r.interval_unit).toLowerCase();

                  const programLine =
                    `${intervalLabel(r.interval_unit, r.interval_value, t)} · ` +
                    (unit === "week"
                      ? `${daysOfWeekLabel(r.days_of_week, t)} · ${tw}`
                      : unit === "month"
                      ? `${t("ordersManage.recurring.daysOfMonthPrefix", { defaultValue: "Día(s):" })} ${daysOfMonthLabel(
                          r.days_of_month
                        )} · ${tw}`
                      : `${tw}`);

                  const statusText = recurringStatusLabel(String(r.status ?? ""), t);

                  return (
                    <div
                      key={r.id}
                      className="grid items-start grid-cols-[220px_110px_minmax(330px,1fr)_140px_90px_120px_170px] gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{customer}</p>
                      </div>

                      <div>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                          {statusText}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm text-muted-foreground" title={programLine}>
                          {programLine}
                        </p>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("ordersManage.recurring.viewDetails", { defaultValue: "Ver detalles" })}
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("ordersManage.recurring.detail.title", { defaultValue: "Detalle de programación" })}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("ordersManage.recurring.detail.description", {
                                  defaultValue: "Aquí tenés todo lo de la recurrencia, sin ensuciar la tabla.",
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-[150px_1fr] gap-2">
                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.customer", { defaultValue: "Cliente" })}
                                </span>
                                <span className="font-medium">{customer}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.status", { defaultValue: "Estado" })}
                                </span>
                                <span>{statusText}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.interval", { defaultValue: "Intervalo" })}
                                </span>
                                <span>{intervalLabel(r.interval_unit, r.interval_value, t)}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.weekDays", { defaultValue: "Días semana" })}
                                </span>
                                <span>{daysOfWeekLabel(r.days_of_week, t)}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.monthDays", { defaultValue: "Días mes" })}
                                </span>
                                <span>{daysOfMonthLabel(r.days_of_month)}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.window", { defaultValue: "Ventana" })}
                                </span>
                                <span>{timeWindowsLabel(r.time_windows)}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.timeZone", { defaultValue: "Zona horaria" })}
                                </span>
                                <span>{r.time_zone ?? t("common.na", { defaultValue: "N/A" })}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.start", { defaultValue: "Inicio" })}
                                </span>
                                <span>{r.start_date ?? "—"}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.end", { defaultValue: "Fin" })}
                                </span>
                                <span>{r.end_date ?? "—"}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.lastRun", { defaultValue: "Última ejecución" })}
                                </span>
                                <span>{formatDateTime(r.last_run_at, locale)}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.nextRun", { defaultValue: "Próxima" })}
                                </span>
                                <span className="font-medium">{formatDateTime(r.next_run_at, locale)}</span>

                                <span className="text-muted-foreground">
                                  {t("ordersManage.labels.id", { defaultValue: "ID" })}
                                </span>
                                <span className="font-mono text-xs break-all">{r.id}</span>
                              </div>
                            </div>

                            <AlertDialogFooter>
                              <AlertDialogAction>
                                {t("ordersManage.recurring.detail.done", { defaultValue: "Listo" })}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* nombres */}
                      <div className="min-w-0">
                        {names.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {t("common.na", { defaultValue: "N/A" })}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {names.map((n, idx) => (
                              <p key={`${r.id}-n-${idx}`} className="truncate text-xs text-muted-foreground">
                                {n}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right text-sm text-muted-foreground">{toNumber(r.items_count)}</div>
                      <div className="text-right text-sm font-semibold">{formatMoneyCRC(r.total)}</div>
                      <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(r.next_run_at, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========= PEDIDOS DEL DÍA (MANAGE) ========= */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("ordersManage.dayOrders.showing", {
              defaultValue: "Mostrando {{count}} pedidos",
              count: rows.length,
            })}
          </p>
        </div>

        {ordersQuery.isLoading && !ordersQuery.data ? (
          <LoadingState />
        ) : ordersQuery.isError ? (
          <ErrorState
            message={
              ordersQuery.error instanceof Error
                ? ordersQuery.error.message
                : t("ordersManage.dayOrders.loadError", { defaultValue: "Error cargando pedidos." })
            }
            onRetry={() => ordersQuery.refetch()}
          />
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <div className="min-w-[1020px]">
              <div className="grid grid-cols-[240px_260px_140px_minmax(280px,1fr)_120px] gap-3 border-b px-4 py-3 text-xs font-semibold text-muted-foreground">
                <div>{t("ordersManage.table.customer", { defaultValue: "CLIENTE" })}</div>
                <div>{t("ordersManage.dayOrders.table.itemsNames", { defaultValue: "ITEMS (nombres)" })}</div>
                <div>{t("ordersManage.table.total", { defaultValue: "TOTAL" })}</div>
                <div className="text-right">{t("ordersManage.table.status", { defaultValue: "ESTADO" })}</div>
                <div className="text-right">{t("ordersManage.dayOrders.table.time", { defaultValue: "HORA" })}</div>
              </div>

              <div className="divide-y">
                {rows.map((o) => {
                  const total = toNumber(o.total);
                  const locked = o.status === "completed";
                  const customer = o.customer_name?.trim()
                    ? o.customer_name
                    : t("ordersManage.customerFallback", { defaultValue: "Cliente" });

                  const names = joinItemNames(o.item_names);

                  const canNext = Boolean(accessToken) && canGoNext(o.status) && !actions.advance.isPending;

                  return (
                    <div
                      key={o.id}
                      className="grid items-start grid-cols-[240px_260px_140px_minmax(280px,1fr)_120px] gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{customer}</p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {toNumber(o.items_count)}{" "}
                          {t("ordersManage.dayOrders.dishes", { defaultValue: "platillos" })}
                        </p>
                        {names.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {names.map((n, idx) => (
                              <p key={`${o.id}-name-${idx}`} className="truncate text-xs text-muted-foreground">
                                {n}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-sm font-semibold">{formatMoneyCRC(total)}</div>

                      <div className="flex flex-wrap items-center justify-end gap-2 overflow-hidden">
                        {/* avanzar */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                              disabled={!canNext}
                              title={t("ordersManage.actions.advance", { defaultValue: "Avanzar" })}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("ordersManage.actions.advanceTitle", { defaultValue: "¿Avanzar estado?" })}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("ordersManage.actions.advanceDesc", {
                                  defaultValue: "Al avanzar el pedido no podrás regresar a un estado anterior.",
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("common.cancel", { defaultValue: "Cancelar" })}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={() => actions.advance.mutate(o.id)}>
                                {t("ordersManage.actions.advanceConfirm", { defaultValue: "Aceptar y avanzar" })}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <StatusPill status={o.status} t={t} />

                        {o.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <CheckCircle2 className="h-4 w-4" /> {t("ordersManage.ok", { defaultValue: "OK" })}
                          </span>
                        ) : null}

                        {/* borrar */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              disabled={!accessToken || locked || actions.cancelDelete.isPending}
                              title={t("ordersManage.actions.cancelDelete", { defaultValue: "Cancelar (borrar)" })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("ordersManage.actions.deleteTitle", { defaultValue: "¿Cancelar pedido?" })}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("ordersManage.actions.deleteDesc", {
                                  defaultValue: "Esto eliminará el pedido por completo (items, historial y pagos).",
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("ordersManage.actions.back", { defaultValue: "Volver" })}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={() => actions.cancelDelete.mutate(o.id)}>
                                {t("ordersManage.actions.deleteConfirm", { defaultValue: "Sí, eliminar" })}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {formatTime(o.created_at, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
