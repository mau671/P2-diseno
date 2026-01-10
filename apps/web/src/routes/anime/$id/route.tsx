import { createFileRoute, Outlet } from "@tanstack/react-router";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute("/anime/$id" as any)({
  component: AnimeIdLayout,
});

function AnimeIdLayout() {
  return <Outlet />;
}
