import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCart,
  fetchCartSummary,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  validateCart,
} from '@/lib/cart';

export const cartQueryKey = ['cart'];
export const cartSummaryQueryKey = ['cart', 'summary'];

export function useCart(accessToken?: string) {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: () => fetchCart(accessToken),
    enabled: !!accessToken,
  });
}

export function useCartSummary(accessToken?: string) {
  return useQuery({
    queryKey: cartSummaryQueryKey,
    queryFn: () => fetchCartSummary(accessToken),
    enabled: !!accessToken,
    refetchInterval: 30000,
  });
}

export function useAddToCart(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      meal_base_id: string;
      quantity?: number;
      added_ingredients?: { ingredient_id: string; qty?: number }[];
      removed_ingredients?: { ingredient_id: string; qty?: number }[];
    }) => addToCart(params, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey });
    },
  });
}

export function useUpdateCartItem(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      itemId: string;
      data: {
        quantity?: number;
        added_ingredients?: { ingredient_id: string; qty?: number }[];
        removed_ingredients?: { ingredient_id: string; qty?: number }[];
      };
    }) => updateCartItem(params.itemId, params.data, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey });
    },
  });
}

export function useRemoveCartItem(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey });
    },
  });
}

export function useClearCart(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey });
    },
  });
}

export function useValidateCart(accessToken?: string) {
  return useMutation({
    mutationFn: () => validateCart(accessToken),
  });
}
