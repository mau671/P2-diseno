import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function slugToTitle(slug: string) {
  const clean = decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Capitaliza palabras simple (se ve bien para breadcrumb)
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppBreadcrumbs() {
  const location = useRouterState({ select: (s) => s.location });

  // Ej: /anime/52991/frieren-beyond-journey-s-end
  const path = location.pathname;
  const parts = path.split("/").filter(Boolean);

  const isAnime = parts[0] === "anime";
  const slug = isAnime && parts.length >= 3 ? parts[2] : "";

  // Si no estamos en anime, no inventamos nada (o podés poner Inicio si querés)
  if (!isAnime) return null;

  const title = slug ? slugToTitle(slug) : null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/anime/catalog">Anime</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {title ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[360px]">
                {title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
