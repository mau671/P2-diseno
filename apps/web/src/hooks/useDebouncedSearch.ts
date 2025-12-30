import * as React from "react";
import { useDebouncedState } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useNavigate } from "@tanstack/react-router";

function useDebouncedSearch() {
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    clearOnDefault: true,
  });
  const [input, setInput] = React.useState(query);
  const [debouncedInput, setDebouncedInput, debouncer] = useDebouncedState(input, {
    wait: 500,
  });
  const navigate = useNavigate();
  const isClearing = React.useRef(false);
  const hasActiveFiltersRef = React.useRef(false);

  React.useEffect(() => {
    if (!isClearing.current) {
      setInput(query || "");
    }
  }, [query]);

  React.useEffect(() => {
    setDebouncedInput(input);
  }, [input, setDebouncedInput]);

  React.useEffect(() => {
    const trimmed = debouncedInput.trim();
    if (!isClearing.current && trimmed !== query && (trimmed.length === 0 || trimmed.length > 2)) {
      setQuery(trimmed || null);
    }
    if (isClearing.current) {
      isClearing.current = false;
    }
  }, [debouncedInput, query, setQuery]);

  const handleClearSearch = () => {
    debouncer.cancel();
    
    isClearing.current = true;
    setInput("");

    if (!hasActiveFiltersRef.current) {
      setQuery(null);
      navigate({
        to: "/anime/search",
        search: {},
        replace: true,
      });
    } else {
      setQuery(null);
    }
  };

  return { 
    query, 
    input, 
    setInput, 
    debouncedInput,
    handleClearSearch,
    setHasActiveFilters: (has: boolean) => { hasActiveFiltersRef.current = has; }
  };
}

export { useDebouncedSearch };
