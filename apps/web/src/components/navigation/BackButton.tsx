import { useRouter, useCanGoBack, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  className?: string;
};

/**
 * Global back button that uses router history when available,
 * otherwise navigates to a context-appropriate fallback.
 */
function BackButton({ className }: BackButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const location = useLocation();

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      // Context-aware fallback navigation
      const fallback = getFallbackRoute(location.pathname);
      router.navigate({ to: fallback });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className={cn("size-8", className)}
      aria-label={t("common.back")}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );
}

/**
 * Determines the appropriate fallback route based on current pathname.
 */
function getFallbackRoute(pathname: string): string {
  if (pathname.startsWith("/anime/")) {
    return "/anime/catalog";
  }
  if (pathname.startsWith("/user/")) {
    return "/";
  }
  if (pathname.startsWith("/auth/")) {
    return "/";
  }
  return "/";
}

export { BackButton };

