import * as React from "react";
import { useMatches, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BreadcrumbCrumb = {
  label: string;
  href: string;
  isLast: boolean;
};

type AnimeDetail = {
  title?: string;
  title_english?: string | null;
};

/**
 * Gets the display label for a route match based on routeId and pathname.
 */
function getRouteLabel(
  routeId: string,
  pathname: string,
  t: (key: string) => string
): string | null {
  // Root route
  if (routeId === "__root__" || pathname === "/") {
    return t("nav.home");
  }

  // Anime routes
  if (routeId.includes("/anime/top")) {
    return t("sections.topAnime");
  }
  if (routeId.includes("/anime/search")) {
    return t("sections.search");
  }
  if (routeId.includes("/anime/catalog")) {
    return t("sections.catalog");
  }
  if (routeId.includes("/anime/$id/$slug")) {
    // This will be replaced with actual anime title
    return null;
  }

  // User routes
  if (routeId.includes("/user/profile")) {
    return t("profile.title");
  }
  if (routeId.includes("/user/favorites")) {
    return t("sections.favorites");
  }
  if (routeId.includes("/user")) {
    return t("sections.user");
  }

  // Auth routes
  if (routeId.includes("/auth/login")) {
    return t("auth.login.title");
  }
  if (routeId.includes("/auth/register")) {
    return t("auth.register.title");
  }
  if (routeId.includes("/auth")) {
    return "Auth";
  }

  // Fallback: use last segment of pathname
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] || t("nav.home");
}

/**
 * Gets the href for a breadcrumb item based on routeId and pathname.
 */
function getRouteHref(routeId: string, pathname: string): string {
  // For anime detail, link to search
  if (routeId.includes("/anime/$id/$slug")) {
    return "/anime/search";
  }

  // For anime parent route, link to search
  if (routeId.includes("/anime/$id")) {
    return "/anime/search";
  }

  // Use pathname for other routes
  return pathname;
}

/**
 * Checks if a route should be included in breadcrumbs.
 */
function shouldIncludeRoute(routeId: string, pathname: string): boolean {
  // Skip root route (it's implicit)
  if (routeId === "__root__") {
    return false;
  }

  // Skip layout routes that don't add semantic meaning
  if (routeId.includes("/anime/$id") && !routeId.includes("/$slug")) {
    return false;
  }

  // Include home route only if it's the only route
  if (routeId === "__root__" || pathname === "/") {
    return true;
  }

  return true;
}

export function AppBreadcrumbs() {
  const { t } = useTranslation();
  const matches = useMatches();
  const queryClient = useQueryClient();

  // Extract anime ID from route matches if on anime detail page
  const animeIdFromRoute = React.useMemo(() => {
    const detailMatch = matches.find((m) =>
      m.routeId.includes("/anime/$id/$slug")
    );
    if (detailMatch) {
      const params = detailMatch.params as { id?: string };
      const id = params?.id ? Number(params.id) : null;
      return id && Number.isFinite(id) ? id : null;
    }
    return null;
  }, [matches]);

  // Get anime data from cache and subscribe to updates
  const [animeData, setAnimeData] = React.useState<AnimeDetail | undefined>(
    animeIdFromRoute
      ? queryClient.getQueryData<AnimeDetail>(["animeDetail", animeIdFromRoute])
      : undefined
  );

  // Subscribe to cache updates to re-render when data arrives
  React.useEffect(() => {
    if (!animeIdFromRoute) {
      setAnimeData(undefined);
      return;
    }

    const queryCache = queryClient.getQueryCache();
    const query = queryCache.find({ queryKey: ["animeDetail", animeIdFromRoute] });

    // Set initial data
    setAnimeData(query?.state.data as AnimeDetail | undefined);

    // Subscribe to cache updates
    const unsubscribe = queryCache.subscribe((event) => {
      if (
        event?.query?.queryKey[0] === "animeDetail" &&
        event?.query?.queryKey[1] === animeIdFromRoute
      ) {
        setAnimeData(event.query.state.data as AnimeDetail | undefined);
      }
    });

    return unsubscribe;
  }, [animeIdFromRoute, queryClient]);

  const breadcrumbs = React.useMemo(() => {
    const items: BreadcrumbCrumb[] = [];
    let hasAnimeDetail = false;
    let hasAnimeParent = false;
    let hasUserParent = false;

    matches.forEach((match, index) => {
      if (!shouldIncludeRoute(match.routeId, match.pathname)) {
        return;
      }

      const isLast = index === matches.length - 1;
      let label = getRouteLabel(match.routeId, match.pathname, t);
      const href = getRouteHref(match.routeId, match.pathname);

      // Check if this is an anime route (but not root)
      const isAnimeRoute =
        match.routeId.includes("/anime/") && match.routeId !== "__root__";
      
      // Check if this is a user route (but not root)
      const isUserRoute =
        match.routeId.includes("/user/") && match.routeId !== "__root__";

      // Add "Usuario" parent breadcrumb for user routes (only once)
      if (isUserRoute && !hasUserParent) {
        const isUserSubRoute =
          match.routeId.includes("/user/profile") ||
          match.routeId.includes("/user/favorites");

        if (isUserSubRoute) {
          items.push({
            label: t("sections.user"),
            href: "/user/profile",
            isLast: false,
          });
          hasUserParent = true;
        }
      }

      // Add "Anime" parent breadcrumb for anime routes (only once)
      if (isAnimeRoute && !hasAnimeParent) {
        // Don't add if it's already the label (e.g., /anime/search shows "Buscar" not "Anime > Buscar")
        const isAnimeSubRoute =
          match.routeId.includes("/anime/top") ||
          match.routeId.includes("/anime/search") ||
          match.routeId.includes("/anime/catalog") ||
          match.routeId.includes("/anime/$id/$slug");

        if (isAnimeSubRoute) {
          items.push({
            label: t("nav.anime"),
            href: "/anime/search",
            isLast: false,
          });
          hasAnimeParent = true;
        }
      }

      // Special handling for anime detail route
      if (match.routeId.includes("/anime/$id/$slug")) {
        hasAnimeDetail = true;

        if (animeIdFromRoute) {
          // Use the subscribed anime data
          if (animeData) {
            label =
              animeData.title_english || animeData.title || t("common.loading");
          } else {
            // Fallback while loading
            label = t("common.loading");
          }
        } else {
          label = t("common.notFound");
        }
      }

      // Only add if label is not null/empty
      if (label) {
        items.push({ label, href, isLast: hasAnimeDetail ? isLast : isLast });
      }
    });

    return items;
  }, [matches, t, animeIdFromRoute, animeData]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-wrap">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.href}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="max-w-[200px] sm:max-w-none truncate">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={crumb.href}
                    className="max-w-[200px] sm:max-w-none truncate"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

