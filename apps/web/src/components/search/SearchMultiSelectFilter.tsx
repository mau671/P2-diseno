import * as React from "react";
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

type SearchMultiSelectFilterProps<T> = {
  label: string;
  options: T[];
  selected: T[];
  onChange: (value: T[]) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string | number;
};

function SearchMultiSelectFilter<T>({
  label,
  options,
  selected,
  onChange,
  getOptionLabel,
  getOptionValue,
}: SearchMultiSelectFilterProps<T>) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[150px] h-9">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto min-w-[200px]">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={getOptionValue(option)}
              checked={selected.includes(option)}
              onCheckedChange={() => handleToggle(option)}
              onSelect={(e) => e.preventDefault()}
              className="pr-8"
            >
              <span className="truncate block max-w-[180px]">{getOptionLabel(option)}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SearchMultiSelectFilter };
