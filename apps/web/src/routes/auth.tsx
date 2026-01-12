// apps/web/src/routes/auth.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-background">
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});