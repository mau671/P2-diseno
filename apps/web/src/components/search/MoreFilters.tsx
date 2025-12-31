import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type MoreFiltersProps = {
  allowNsfw: boolean;
  onNsfwChange: (checked: boolean) => void;
};

function MoreFilters({ allowNsfw, onNsfwChange }: MoreFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Switch
          id="nsfw-toggle"
          checked={allowNsfw}
          onCheckedChange={onNsfwChange}
        />
        <Label htmlFor="nsfw-toggle" className="text-sm">
          {t("search.filters.nsfw")}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("search.allowNsfw")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export { MoreFilters };
