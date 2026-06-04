'use client';

import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount, deliveryCharge } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!user || !token) {
      router.push('/auth');
      return;
    }
    setPlacing(true);
    try {
      const orderItems = items.map(i => ({
        fishId: i.listing.id,
        quantity: i.quantity,
      }));

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      clearCart();
      toast.success('Order placed! Our QA team will inspect your fish.');
      router.push('/orders');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some fresh fish to get started</p>
        <Link href="/browse">
          <Button>Browse Fish</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4 mb-6">
        {items.map(item => (
          <div key={item.listing.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card">
            <img
              src={item.listing.image || `https://source.unsplash.com/80x80/?fish`}
              alt={item.listing.category}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.listing.category}</h3>
              <p className="text-sm text-muted-foreground">
                by {item.listing.fishermanName} · ₹{item.listing.pricePerKg}/kg
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                onClick={() => updateQuantity(item.listing.id, +(item.quantity - 0.5).toFixed(1))}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-14 text-center text-sm font-medium">{item.quantity} kg</span>
              <button
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                onClick={() => updateQuantity(item.listing.id, +(item.quantity + 0.5).toFixed(1))}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="text-right min-w-[70px]">
              <p className="font-semibold">₹{(item.listing.pricePerKg * item.quantity).toFixed(0)}</p>
            </div>
            <button
              className="text-destructive hover:text-destructive/80"
              onClick={() => removeFromCart(item.listing.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-card space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹{totalAmount.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span>{deliveryCharge === 0 ? <span className="text-green-600">FREE</span> : `₹${deliveryCharge}`}</span>
        </div>
        {deliveryCharge > 0 && (
          <p className="text-xs text-muted-foreground">Add ₹{(1000 - totalAmount).toFixed(0)} more for free delivery</p>
        )}
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₹{(totalAmount + deliveryCharge).toFixed(0)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/browse" className="flex-1">
          <Button variant="outline" className="w-full">Continue Shopping</Button>
        </Link>
        <Button className="flex-1" onClick={handleCheckout} disabled={placing}>
          {placing ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
}
