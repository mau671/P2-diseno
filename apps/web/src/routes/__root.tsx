// apps/web/src/routes/__root.tsx
import * as React from "react";
import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

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

  // Generar breadcrumb dinámicamente basado en la ruta
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      // Estamos en la página principal
      return [{ label: t("nav.home"), href: "/", isLast: true }];
    }

    const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Mapear segmentos a traducciones
      let label = segment;
      if (segment === "anime") {
        label = "Anime";
      } else if (segment === "top") {
        label = t("sections.topAnime");
      } else if (segment === "search") {
        label = t("sections.search");
        } else if (segment === "catalog") {
        label = t("sections.catalog");
      } else if (segment === "auth") {
        label = "Auth";
      } else if (segment === "login") {
        label = t("auth.login.title");
      } else if (segment === "register") {
        label = t("auth.register.title");
      }

      breadcrumbs.push({ label, href: currentPath, isLast });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

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
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl border p-4 md:min-h-min">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Route = createRootRoute({
  component: () => (
    <NuqsAdapter>
      <RootLayout />
    </NuqsAdapter>
  ),
});