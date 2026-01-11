import * as React from "react";

export type NavigationHistoryContextType = {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
};

export const NavigationHistoryContext = React.createContext<NavigationHistoryContextType | null>(null);

export function useNavigationHistory() {
  const context = React.useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory must be used within NavigationHistoryProvider");
  }
  return context;
}

