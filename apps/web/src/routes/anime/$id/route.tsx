import * as React from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/anime/$id")({
  component: AnimeIdLayout,
});

function AnimeIdLayout() {
  return <Outlet />;
}
