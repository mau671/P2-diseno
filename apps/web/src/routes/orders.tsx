// src/routes/orders.tsx
import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, X, CheckCircle2, ArrowLeft } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/context/restaurant-context";
import { useOrderActions, useOrdersManage } from "@/hooks/use-orders-manage";

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
import type { OrderManageRow } from "@/api/orders";

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

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "--:--";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "paid":
      return "Pagado";
    case "preparing":
      return "Preparando";
    case "delivering":
      return "En camino";
    case "completed":
      return "Finalizado";
    default:
      return status;
  }
}

function StatusPill({ status }: { status: string }) {
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

  return <span className={`${base} ${cls}`}>{statusLabel(status)}</span>;
}

function canGoNext(status: string) {
  const i = FLOW.indexOf(status as any);
  return i >= 0 && i < FLOW.length - 1 && status !== "completed";
}

function OrdersManagePage() {
  const navigate = useNavigate();

  const { session, user, loading: authLoading } = useAuth();
  const { selectedRestaurantId } = useRestaurant();
  const accessToken = session?.access_token;

  const ordersQuery = useOrdersManage(selectedRestaurantId, accessToken);
  const actions = useOrderActions(selectedRestaurantId, accessToken);

  React.useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth/login" });
  }, [authLoading, user, navigate]);

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  if (!selectedRestaurantId) {
    return <EmptyState message="Selecciona un restaurante para gestionar pedidos." />;
  }

  if (ordersQuery.isLoading && !ordersQuery.data) return <LoadingState />;

  if (ordersQuery.isError) {
    const msg =
      ordersQuery.error instanceof Error ? ordersQuery.error.message : "Error cargando pedidos.";
    return <ErrorState message={msg} onRetry={() => ordersQuery.refetch()} />;
  }

  const rows: OrderManageRow[] = ordersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Gestionar pedidos</h1>
          <p className="text-muted-foreground">
            Tabla de pedidos con control de estados
            {ordersQuery.isFetching ? " · Cargando..." : ""}
          </p>
        </div>

        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="rounded-xl border">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">Mostrando {rows.length} pedidos</p>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <div className="min-w-[940px]">
            <div className="grid grid-cols-[260px_140px_140px_minmax(360px,1fr)_120px] gap-3 border-b px-4 py-3 text-xs font-semibold text-muted-foreground">
              <div>CLIENTE</div>
              <div>ITEMS</div>
              <div>TOTAL</div>
              <div className="text-right">ESTADO</div>
              <div className="text-right">HORA</div>
            </div>

            <div className="divide-y">
              {rows.map((o) => {
                const total = toNumber(o.total);
                const locked = o.status === "completed";
                const customer = o.customer_name?.trim() ? o.customer_name : "Cliente";

                const canNext = Boolean(accessToken) && canGoNext(o.status) && !actions.advance.isPending;

                return (
                  <div
                    key={o.id}
                    className="grid items-center grid-cols-[260px_140px_140px_minmax(360px,1fr)_120px] gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{customer}</p>
                      <p className="truncate text-xs text-muted-foreground">{o.id}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {toNumber(o.items_count)} platillos
                    </div>

                    <div className="text-sm font-semibold">{formatMoneyCRC(total)}</div>

                    <div className="flex flex-wrap items-center justify-end gap-2 overflow-hidden">
                      {/* ✅ Confirmación al avanzar */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                            disabled={!canNext}
                            title="Avanzar"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Avanzar estado?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Al avanzar el pedido <b>no podrás regresar</b> a un estado anterior.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => actions.advance.mutate(o.id)}>
                              Aceptar y avanzar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <StatusPill status={o.status} />

                      {o.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <CheckCircle2 className="h-4 w-4" /> OK
                        </span>
                      ) : null}

                      {/* Cancelar = borrar */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            disabled={!accessToken || locked || actions.cancelDelete.isPending}
                            title="Cancelar (borrar)"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto eliminará el pedido por completo (items, historial y pagos).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <AlertDialogAction onClick={() => actions.cancelDelete.mutate(o.id)}>
                              Sí, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {formatTime(o.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
