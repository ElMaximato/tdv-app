import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { MAX_QTY_PER_ITEM } from '../utils/money';

export type CartItem = {
  variantId: number;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPriceCents: number;
  image: string | null;
  quantity: number;
  maxQty: number;            // lo que hay en stock (tope de 10 por pieza, igual que el servidor)
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setItems(prev => {
      const cap = Math.min(item.maxQty, MAX_QTY_PER_ITEM);
      const found = prev.find(i => i.variantId === item.variantId);
      if (found) return prev.map(i => (i.variantId === item.variantId ? { ...i, maxQty: item.maxQty, unitPriceCents: item.unitPriceCents, quantity: Math.min(cap, i.quantity + quantity) } : i));
      return [...prev, { ...item, quantity: Math.min(cap, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: number, quantity: number) => {
    setItems(prev => prev.map(i => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(Math.min(i.maxQty, MAX_QTY_PER_ITEM), quantity)) } : i)));
  }, []);

  const remove = useCallback((variantId: number) => setItems(prev => prev.filter(i => i.variantId !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartState>(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0),
    add, setQuantity, remove, clear,
  }), [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
