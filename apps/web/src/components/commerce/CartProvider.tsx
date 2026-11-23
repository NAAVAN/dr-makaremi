'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CommerceCatalogItem, CommerceLegalConfig, Locale } from '@makaremi/shared';
import { AcquisitionCartDrawer } from './AcquisitionCartDrawer';

export interface CartEntry {
  product: CommerceCatalogItem;
  quantity: number;
  customDedication?: string;
}

interface AcquisitionCartContextValue {
  items: CartEntry[];
  itemCount: number;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: CommerceCatalogItem, options?: { quantity?: number; customDedication?: string; open?: boolean }) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  updateDedication: (sku: string, dedication: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'makaremi_acquisition_cart_v1';

const AcquisitionCartContext = createContext<AcquisitionCartContextValue | null>(null);

export function CartProvider({
  children,
  locale,
  legalConfig,
  stripeMode,
}: {
  children: React.ReactNode;
  locale: Locale;
  legalConfig: CommerceLegalConfig;
  stripeMode: 'live' | 'test' | 'unconfigured';
}) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartEntry[];
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((e) => e && e.product && e.product.sku));
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (
      product: CommerceCatalogItem,
      options?: { quantity?: number; customDedication?: string; open?: boolean }
    ) => {
      if (product.availability !== 'available' || product.priceEurCents === null) return;
      const qtyToAdd = Math.max(1, options?.quantity ?? 1);
      setItems((prev) => {
        const idx = prev.findIndex((e) => e.product.sku === product.sku);
        if (idx >= 0) {
          const next = [...prev];
          const maxQty = product.kind === 'original_artwork' ? 1 : 20;
          next[idx] = {
            ...next[idx],
            product,
            quantity: Math.min(maxQty, next[idx].quantity + qtyToAdd),
            customDedication: options?.customDedication ?? next[idx].customDedication,
          };
          return next;
        }
        return [
          ...prev,
          {
            product,
            quantity: product.kind === 'original_artwork' ? 1 : Math.min(20, qtyToAdd),
            customDedication: options?.customDedication,
          },
        ];
      });
      if (options?.open !== false) {
        setIsOpen(true);
      }
    },
    []
  );

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((e) => e.product.sku !== sku));
  }, []);

  const updateQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((e) => e.product.sku !== sku);
      return prev.map((e) => {
        if (e.product.sku !== sku) return e;
        const maxQty = e.product.kind === 'original_artwork' ? 1 : 20;
        return { ...e, quantity: Math.min(maxQty, Math.max(1, quantity)) };
      });
    });
  }, []);

  const updateDedication = useCallback((sku: string, dedication: string) => {
    setItems((prev) =>
      prev.map((e) => (e.product.sku === sku ? { ...e, customDedication: dedication } : e))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((acc, entry) => acc + entry.quantity, 0),
    [items]
  );

  const value = useMemo<AcquisitionCartContextValue>(
    () => ({
      items,
      itemCount,
      isOpen,
      openDrawer,
      closeDrawer,
      addItem,
      removeItem,
      updateQuantity,
      updateDedication,
      clearCart,
    }),
    [items, itemCount, isOpen, openDrawer, closeDrawer, addItem, removeItem, updateQuantity, updateDedication, clearCart]
  );

  return (
    <AcquisitionCartContext.Provider value={value}>
      {children}
      <AcquisitionCartDrawer locale={locale} legalConfig={legalConfig} stripeMode={stripeMode} />
    </AcquisitionCartContext.Provider>
  );
}

export function useAcquisitionCart(): AcquisitionCartContextValue {
  const ctx = useContext(AcquisitionCartContext);
  if (!ctx) {
    throw new Error('useAcquisitionCart must be used within CartProvider');
  }
  return ctx;
}
