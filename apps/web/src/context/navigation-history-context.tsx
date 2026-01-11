import * as React from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import { NavigationHistoryContext } from "@/hooks/use-navigation-history";

/**
 * Provides navigation history tracking that works with browser history.
 * This enables proper back/forward navigation across all pages.
 */
export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const location = useLocation();
  
  // Track our position in the browser history
  // We use a ref to avoid re-renders on every navigation
  const historyIndexRef = React.useRef(0);
  const maxHistoryIndexRef = React.useRef(0);
  const isNavigatingRef = React.useRef(false);
  const lastPathRef = React.useRef(location.pathname);
  
  // State for UI updates
  const [canGoBack, setCanGoBack] = React.useState(false);
  const [canGoForward, setCanGoForward] = React.useState(false);

  const updateButtonStates = React.useCallback(() => {
    setCanGoBack(historyIndexRef.current > 0);
    setCanGoForward(historyIndexRef.current < maxHistoryIndexRef.current);
  }, []);

  const saveToSessionStorage = React.useCallback(() => {
    sessionStorage.setItem("nav-history-index", String(historyIndexRef.current));
    sessionStorage.setItem("nav-history-max", String(maxHistoryIndexRef.current));
  }, []);

  // Initialize history index from session storage
  React.useEffect(() => {
    const storedIndex = sessionStorage.getItem("nav-history-index");
    const storedMax = sessionStorage.getItem("nav-history-max");
    
    if (storedIndex !== null) {
      historyIndexRef.current = parseInt(storedIndex, 10);
    }
    if (storedMax !== null) {
      maxHistoryIndexRef.current = parseInt(storedMax, 10);
    }
    
    updateButtonStates();
  }, [updateButtonStates]);

  // Handle popstate events (browser back/forward buttons)
  React.useEffect(() => {
    const handlePopState = () => {
      // Determine direction based on path comparison
      // This is a heuristic - we can't know for sure if it was back or forward
      // But we track our own index to make this work
      isNavigatingRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Track navigation changes
  React.useEffect(() => {
    const currentPath = location.pathname + location.search;
    const lastPath = lastPathRef.current;
    
    if (currentPath === lastPath) {
      return;
    }
    
    lastPathRef.current = currentPath;

    if (isNavigatingRef.current) {
      // This was a back/forward navigation via popstate
      // We need to figure out if we went back or forward
      // Since popstate doesn't tell us direction, we use a heuristic:
      // Check if history state has our index
      const stateIndex = window.history.state?.__navIndex;
      
      if (typeof stateIndex === "number") {
        historyIndexRef.current = stateIndex;
      }
      
      isNavigatingRef.current = false;
    } else {
      // This is a new navigation (link click, programmatic navigation)
      // Increment index and set as new max (forward history is cleared)
      historyIndexRef.current += 1;
      maxHistoryIndexRef.current = historyIndexRef.current;
      
      // Store our index in history state using requestAnimationFrame
      // to avoid interfering with TanStack Router's state management
      requestAnimationFrame(() => {
        try {
          const currentState = window.history.state || {};
          if (currentState.__navIndex !== historyIndexRef.current) {
            window.history.replaceState(
              { ...currentState, __navIndex: historyIndexRef.current },
              ""
            );
          }
        } catch {
          // Ignore errors from cross-origin or other restrictions
        }
      });
    }

    saveToSessionStorage();
    updateButtonStates();
  }, [location.pathname, location.search, saveToSessionStorage, updateButtonStates]);

  // Initialize the first history entry with index 0
  React.useEffect(() => {
    // Use requestAnimationFrame to avoid interfering with TanStack Router
    requestAnimationFrame(() => {
      try {
        const currentState = window.history.state || {};
        if (typeof currentState.__navIndex !== "number") {
          window.history.replaceState(
            { ...currentState, __navIndex: historyIndexRef.current },
            ""
          );
        } else {
          // Restore index from history state (page reload)
          historyIndexRef.current = currentState.__navIndex;
          updateButtonStates();
        }
      } catch {
        // Ignore errors
      }
    });
  }, [updateButtonStates]);

  const goBack = React.useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      saveToSessionStorage();
      isNavigatingRef.current = true;
      router.history.back();
      // Update state after a small delay to let navigation complete
      setTimeout(updateButtonStates, 50);
    }
  }, [router.history, saveToSessionStorage, updateButtonStates]);

  const goForward = React.useCallback(() => {
    if (historyIndexRef.current < maxHistoryIndexRef.current) {
      historyIndexRef.current += 1;
      saveToSessionStorage();
      isNavigatingRef.current = true;
      router.history.forward();
      // Update state after a small delay to let navigation complete
      setTimeout(updateButtonStates, 50);
    }
  }, [router.history, saveToSessionStorage, updateButtonStates]);

  const value = React.useMemo(
    () => ({
      canGoBack,
      canGoForward,
      goBack,
      goForward,
    }),
    [canGoBack, canGoForward, goBack, goForward]
  );

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

