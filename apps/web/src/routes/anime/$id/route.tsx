import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/anime/$id" as any)({
  component: AnimeIdLayout,
});

function AnimeIdLayout() {
  return <Outlet />;
}
