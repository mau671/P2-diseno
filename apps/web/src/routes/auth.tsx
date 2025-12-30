import { createFileRoute, Outlet } from "@tanstack/react-router";

function AuthLayout() {
  return (
    <div className="bg-muted min-h-screen flex items-center justify-center p-6 md:p-10">
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});
