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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";

type Crumb = { label: string; href: string; isLast: boolean };

function isNumericSegment(s: string) {
  return /^\d+$/.test(s);
}

function humanizeSlug(slug: string) {
  const text = decodeURIComponent(slug).replace(/-/g, " ").trim();
  if (!text) return slug;
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeGetFromSearchStr(location: any) {
  const searchStr = location?.searchStr ?? window.location.search;
  const sp = new URLSearchParams(searchStr);
  const from = sp.get("from");
  if (!from) return null;

  try {
    const decoded = decodeURIComponent(from);
    return decoded.startsWith("/") ? decoded : null;
  } catch {
    return from.startsWith("/") ? from : null;
  }
}

function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  const isAuthRoute = location.pathname.startsWith("/auth");

  const generateBreadcrumbs = (): Crumb[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);

    if (pathSegments.length === 0) {
      return [{ label: t("nav.home", "Inicio"), href: "/", isLast: true }];
    }

    // ✅ Caso especial: detalle /anime/:id/:slug (o /anime/:id)
    if (pathSegments[0] === "anime" && pathSegments.length >= 2) {
      const second = pathSegments[1];

      if (isNumericSegment(second)) {
        const id = second;
        const slug = pathSegments[2] ?? "";
        const name = slug ? humanizeSlug(slug) : `#${id}`;

        const from = safeGetFromSearchStr(location);

        return [
          {
            label: t("nav.anime", "Anime"),
            href: from ?? "/anime/catalog",
            isLast: false,
          },
          {
            label: name,
            href: slug ? `/anime/${id}/${slug}` : `/anime/${id}`,
            isLast: true,
          },
        ];
      }
    }

    const breadcrumbs: Crumb[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      let label = segment;

      if (segment === "anime") {
        label = t("nav.anime", "Anime");
        currentPath = "/anime/catalog";
      } else if (segment === "top") {
        label = t("sections.topAnime", "Top Anime");
      } else if (segment === "search") {
        label = t("sections.search", "Búsqueda");
      } else if (segment === "catalog") {
        label = t("sections.catalog", "Catálogo");
      } else if (segment === "auth") {
        label = "Auth";
      } else if (segment === "login") {
        label = t("auth.login.title", "Iniciar Sesión");
      } else if (segment === "register") {
        label = t("auth.register.title", "Crear Cuenta");
      } else if (segment === "forgot-password") {
        label = t("auth.forgot.title", "Recuperar Contraseña");
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
                  <React.Fragment key={`${crumb.href}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
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
          <div className="flex-1 rounded-xl border p-4">
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
