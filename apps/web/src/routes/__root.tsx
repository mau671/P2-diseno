import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumbs } from "@/components/navigation/AppBreadcrumbs";
import { BackButton } from "@/components/navigation/BackButton";
import { ForwardButton } from "@/components/navigation/ForwardButton";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Toaster } from "@/components/ui/sonner";

function RootLayout() {
  const location = useLocation();
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
  );
}

export const Route = createRootRoute({
  component: () => (
    <NuqsAdapter>
      <RootLayout />
    </NuqsAdapter>
  ),
});