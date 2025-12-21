// apps/web/src/routes/__root.tsx
import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";

function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  //Ruta de auth, solo renderiza el Outlet sin sidebar
  const isAuthRoute = location.pathname.startsWith('/auth');

  if (isAuthRoute) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">{t("app.title")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t("nav.home")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">{t("sections.label")}</div>
              <div className="text-lg font-semibold">{t("sections.topAnime")}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">{t("sections.label")}</div>
              <div className="text-lg font-semibold">{t("sections.search")}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">{t("sections.label")}</div>
              <div className="text-lg font-semibold">{t("sections.favorites")}</div>
            </div>
          </div>

          <div className="min-h-[100vh] flex-1 rounded-xl border p-4 md:min-h-min">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});