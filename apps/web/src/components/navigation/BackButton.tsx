import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/use-navigation-history";

type BackButtonProps = {
  className?: string;
};

/**
 * Global back button that uses the navigation history context.
 * Navigates back in browser history when available.
 */
function BackButton({ className }: BackButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { canGoBack, goBack } = useNavigationHistory();

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      // Fallback: navigate to home if no history
      router.navigate({ to: "/" });
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

export { BackButton };
