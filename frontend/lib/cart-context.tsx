import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, FishListing } from './types';

interface CartContextType {
  items: CartItem[];
  addToCart: (listing: FishListing, qty: number) => void;
  removeFromCart: (listingId: string) => void;
  updateQuantity: (listingId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  deliveryCharge: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((listing: FishListing, qty: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.listing.id === listing.id);
      if (existing) {
        return prev.map(i => i.listing.id === listing.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { listing, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((listingId: string) => {
    setItems(prev => prev.filter(i => i.listing.id !== listingId));
  }, []);

  const updateQuantity = useCallback((listingId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.listing.id !== listingId));
    } else {
      setItems(prev => prev.map(i => i.listing.id === listingId ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.listing.pricePerKg * i.quantity, 0);
  const deliveryCharge = totalAmount > 0 ? (totalAmount >= 1000 ? 0 : 50) : 0;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount, deliveryCharge }}>
      {children}
    </CartContext.Provider>
  );
};
