import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/use-navigation-history";

type ForwardButtonProps = {
  className?: string;
};

/**
 * Global forward button that uses the navigation history context.
 * Navigates forward in browser history when available.
 */
function ForwardButton({ className }: ForwardButtonProps) {
  const { t } = useTranslation();
  const { canGoForward, goForward } = useNavigationHistory();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={goForward}
      disabled={!canGoForward}
      className={cn("size-8", className)}
      aria-label={t("common.forward")}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

export { ForwardButton };
