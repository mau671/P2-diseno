import * as React from "react";
import { Outlet, createRootRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { useTranslation } from "react-i18next";

import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumbs } from "@/components/navigation/AppBreadcrumbs";
import { BackButton } from "@/components/navigation/BackButton";
import { ForwardButton } from "@/components/navigation/ForwardButton";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Toaster } from "@/components/ui/sonner";
import { NavigationHistoryProvider } from "@/context/navigation-history-context";
import { useAuth } from "@/hooks/use-auth";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { RestaurantProvider } from "@/context/restaurant-context";

function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, loading: authLoading } = useAuth();
  const accessQuery = useAdminAccess(session?.access_token);
  const isAuthRoute = location.pathname.startsWith('/auth');

  const access = accessQuery.data;
  const adminRoles = new Set(["owner", "admin"]);
  const hasRestaurantRole =
    access?.restaurants?.some((membership) => adminRoles.has(membership.role)) ?? false;
  const hasAnyRestaurant = (access?.restaurants?.length ?? 0) > 0;
  const isAdminAccess = Boolean(access?.is_admin || hasRestaurantRole);
  const isAuthorized = isAdminAccess && hasAnyRestaurant;

  React.useEffect(() => {
    if (isAuthRoute) return;
    if (!authLoading && !session?.access_token) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, isAuthRoute, navigate, session?.access_token]);

  if (isAuthRoute) {
    return <Outlet />;
  }

  if (authLoading || accessQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">{t("auth.adminOnlyTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.adminOnlyDescription")}
          </p>
          <button
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => navigate({ to: "/auth/login" })}
            type="button"
          >
            {t("auth.adminOnlyAction")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <RestaurantProvider restaurants={access?.restaurants ?? []}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                <SidebarTrigger className="size-8 rounded-md" />
                <BackButton className="size-8 rounded-md" />
                <ForwardButton className="size-8 rounded-md" />
              </div>
              <AppBreadcrumbs />
            </div>
            <div className="ml-auto flex items-center gap-2 px-4">
              <LanguageToggle />
              <ModeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex-1 rounded-xl border p-4">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </RestaurantProvider>
  );
}

export const Route = createRootRoute({
  component: () => (
    <NuqsAdapter>
      <NavigationHistoryProvider>
        <RootLayout />
      </NavigationHistoryProvider>
    </NuqsAdapter>
  ),
});
