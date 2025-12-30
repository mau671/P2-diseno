import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { SearchType } from "@/lib/search-constants";

type SearchHeaderProps = {
  type: SearchType;
  onTypeChange: (type: SearchType) => void;
};

function SearchHeader({ type, onTypeChange }: SearchHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-semibold">{t("sections.search")}</h1>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 text-2xl font-semibold h-9 px-2 hover:bg-accent">
            <span>{t(`search.types.${type}`)}</span>
            <ChevronDown className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[150px]">
          {["anime", "manga", "characters", "people", "studios"].map((typeOption) => (
            <DropdownMenuItem
              key={typeOption}
              onClick={() => onTypeChange(typeOption as SearchType)}
              className={type === typeOption ? "bg-accent" : "text-base"}
            >
              <span className="truncate block max-w-[130px]">{t(`search.types.${typeOption}`)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SearchHeader };
