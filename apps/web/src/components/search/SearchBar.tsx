import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchBarProps = {
  input: string;
  setInput: (value: string) => void;
  onClear?: () => void;
};

function SearchBar({ input, setInput }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex-1 w-full md:w-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("search.placeholder")}
        className="pl-9"
      />
    </div>
  );
}

export { SearchBar };
