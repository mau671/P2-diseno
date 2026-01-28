import * as React from "react";

export type RestaurantMembership = {
  restaurant_id: string;
  restaurant_name: string;
  role: string;
};

type RestaurantContextValue = {
  restaurants: RestaurantMembership[];
  selectedRestaurantId: string | null;
  selectedRestaurant: RestaurantMembership | null;
  setSelectedRestaurantId: (id: string) => void;
};

const RestaurantContext = React.createContext<RestaurantContextValue | undefined>(undefined);

const STORAGE_KEY = "ce-selected-restaurant";

export function RestaurantProvider({
  restaurants,
  children,
}: {
  restaurants: RestaurantMembership[];
  children: React.ReactNode;
}) {
  const [selectedRestaurantId, setSelectedRestaurantIdState] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedRestaurantIdState(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    if (!restaurants.length) {
      setSelectedRestaurantIdState(null);
      return;
    }
    const exists = selectedRestaurantId
      ? restaurants.some((restaurant) => restaurant.restaurant_id === selectedRestaurantId)
      : false;
    if (!exists) {
      setSelectedRestaurantIdState(restaurants[0].restaurant_id);
    }
  }, [restaurants, selectedRestaurantId]);

  React.useEffect(() => {
    if (!selectedRestaurantId) return;
    try {
      localStorage.setItem(STORAGE_KEY, selectedRestaurantId);
    } catch {
      // ignore storage errors
    }
  }, [selectedRestaurantId]);

  const selectedRestaurant = React.useMemo(
    () =>
      restaurants.find((restaurant) => restaurant.restaurant_id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId]
  );

  const setSelectedRestaurantId = React.useCallback((id: string) => {
    setSelectedRestaurantIdState(id);
  }, []);

  const value = React.useMemo(
    () => ({
      restaurants,
      selectedRestaurantId,
      selectedRestaurant,
      setSelectedRestaurantId,
    }),
    [restaurants, selectedRestaurantId, selectedRestaurant, setSelectedRestaurantId]
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const context = React.useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within RestaurantProvider");
  }
  return context;
}
