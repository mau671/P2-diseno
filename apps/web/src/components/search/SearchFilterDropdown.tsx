import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type SearchFilterDropdownProps<T> = {
  labelKey?: string;
  label?: string;
  options: T[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string | number;
};

function SearchFilterDropdown<T>({
  labelKey,
  label,
  options,
  selected,
  onSelect,
  getLabel,
  getValue,
}: SearchFilterDropdownProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const displayLabel = label || (labelKey ? t(labelKey) : "");

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[120px] justify-between h-9">
          <span className="truncate">
            {selected ? getLabel(selected) : displayLabel}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto min-w-[150px]">
        <DropdownMenuLabel className="truncate max-w-[140px]">{displayLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={getValue(option)}
              checked={selected !== null && getValue(selected) === getValue(option)}
              onCheckedChange={(checked) => onSelect(checked ? option : null)}
              onSelect={(e) => e.preventDefault()}
              className="pr-8"
            >
              <span className="truncate block max-w-[120px]">{getLabel(option)}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SearchFilterDropdown };
