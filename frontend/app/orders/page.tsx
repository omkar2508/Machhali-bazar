'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { OrderStatus } from '@/lib/types';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface OrderItem {
  fishId: string;
  fishName: string;
  quantity: number;
  pricePerKg: number;
  fishermanName?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  createdAt: string;
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <OrdersList />
    </ProtectedRoute>
  );
}

function OrdersList() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground">Your orders will appear here once you place them.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">#{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.fishName} × {item.quantity} kg
                    {item.fishermanName && (
                      <span className="text-muted-foreground"> · by {item.fishermanName}</span>
                    )}
                  </span>
                  <span className="font-medium">₹{(item.pricePerKg * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between text-sm font-semibold">
              <span>Total (incl. delivery ₹{order.deliveryCharge})</span>
              <span>₹{(order.totalAmount + order.deliveryCharge).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
