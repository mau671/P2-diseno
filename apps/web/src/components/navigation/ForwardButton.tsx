import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

type ForwardButtonProps = {
  className?: string;
};

/**
 * Global forward button that navigates forward in browser history.
 * Disabled when there's no forward history available.
 * 
 * Uses a simple state machine to track if the user has navigated back,
 * which indicates that forward navigation might be available.
 */
function ForwardButton({ className }: ForwardButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [canGoForward, setCanGoForward] = useState(false);
  const hasNavigatedBackRef = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Track navigation state
    let navigationState: "normal" | "wentBack" = "normal";

    const handlePopState = () => {
      // When popstate fires, user navigated back or forward
      if (navigationState === "normal") {
        // Likely went back - forward should be available
        navigationState = "wentBack";
        hasNavigatedBackRef.current = true;
        setCanGoForward(true);
      } else {
        // Already in "wentBack" state - check if we can still go forward
        // We'll assume yes until a new navigation clears it
        setCanGoForward(true);
      }
    };

    const handleNewNavigation = () => {
      // Clear any pending timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      if (navigationState === "wentBack") {
        // New navigation after going back - this clears forward history
        // Use a small delay to distinguish from forward navigation
        navigationTimeoutRef.current = window.setTimeout(() => {
          navigationState = "normal";
          hasNavigatedBackRef.current = false;
          setCanGoForward(false);
        }, 100);
      } else {
        // Normal navigation - no forward available
        setCanGoForward(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    
    // Subscribe to router navigation events
    const unsubscribe = router.subscribe("onLoad", () => {
      handleNewNavigation();
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [router]);

  const handleForward = () => {
    if (canGoForward) {
      router.history.forward();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleForward}
      disabled={!canGoForward}
      className={cn("size-8", className)}
      aria-label={t("common.forward")}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

export { ForwardButton };
