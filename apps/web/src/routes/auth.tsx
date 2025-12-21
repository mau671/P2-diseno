// apps/web/src/routes/auth.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});