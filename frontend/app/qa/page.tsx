'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';
import { OrderStatus } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FishItem {
  _id: string;
  name: string;
  size: string;
  pricePerKg: number;
  availableQty: number;
  qaStatus: string;
  fishermanName: string;
  fishermanId: { name?: string; email?: string } | string;
  createdAt: string;
}

interface Order {
  _id: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  createdAt: string;
  customerId: { name?: string; email?: string } | string;
  items: { fishName: string; quantity: number; pricePerKg: number }[];
}

const qaStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  degraded: 'bg-orange-100 text-orange-800',
};

export default function QAPage() {
  return (
    <ProtectedRoute allowedRoles={['qa', 'admin']}>
      <QADashboard />
    </ProtectedRoute>
  );
}

function QADashboard() {
  const { token } = useAuth();
  const [fish, setFish] = useState<FishItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingFish, setLoadingFish] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchFish = () => {
    fetch(`${API_BASE}/fish/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setFish(d.fish || []))
      .catch(() => toast.error('Failed to load fish'))
      .finally(() => setLoadingFish(false));
  };

  const fetchOrders = () => {
    fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => { fetchFish(); fetchOrders(); }, [token]);

  const updateFishQA = async (id: string, qaStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/fish/${id}/qa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qaStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Fish marked as ${qaStatus}`);
      fetchFish();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Order status updated');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const pendingFish = fish.filter(f => f.qaStatus === 'pending').length;
  const pendingOrders = orders.filter(o => o.status === 'pending_qa').length;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QA Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {pendingFish} fish pending · {pendingOrders} orders pending
        </p>
      </div>

      <Tabs defaultValue="fish">
        <TabsList className="mb-6">
          <TabsTrigger value="fish" className="gap-2">
            Fish Listings
            {pendingFish > 0 && (
              <span className="ml-1 rounded-full bg-yellow-500 text-white text-xs px-1.5">{pendingFish}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            Orders
            {pendingOrders > 0 && (
              <span className="ml-1 rounded-full bg-yellow-500 text-white text-xs px-1.5">{pendingOrders}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fish">
          {loadingFish ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border animate-pulse bg-muted" />
            ))}</div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Fish</th>
                    <th className="text-left px-4 py-3 font-medium">Fisherman</th>
                    <th className="text-left px-4 py-3 font-medium">Size / Qty</th>
                    <th className="text-left px-4 py-3 font-medium">Price/kg</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fish.map(f => (
                    <tr key={f._id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{f.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {typeof f.fishermanId === 'object' ? f.fishermanId?.name : f.fishermanName || '—'}
                      </td>
                      <td className="px-4 py-3">{f.size} · {f.availableQty} kg</td>
                      <td className="px-4 py-3">₹{f.pricePerKg}</td>
                      <td className="px-4 py-3">
                        <Badge className={qaStatusColors[f.qaStatus] || ''}>{f.qaStatus}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {f.qaStatus !== 'approved' && (
                            <button onClick={() => updateFishQA(f._id, 'approved')}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200">
                              <CheckCircle className="h-3 w-3" /> Approve
                            </button>
                          )}
                          {f.qaStatus !== 'degraded' && (
                            <button onClick={() => updateFishQA(f._id, 'degraded')}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-700 hover:bg-orange-200">
                              <AlertTriangle className="h-3 w-3" /> Degrade
                            </button>
                          )}
                          {f.qaStatus !== 'rejected' && (
                            <button onClick={() => updateFishQA(f._id, 'rejected')}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200">
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {loadingOrders ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border animate-pulse bg-muted" />
            ))}</div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Customer: {typeof order.customerId === 'object'
                          ? `${order.customerId?.name} (${order.customerId?.email})`
                          : order.customerId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <span className="font-semibold">
                        ₹{(order.totalAmount + order.deliveryCharge).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {order.items.map((i, idx) => (
                      <span key={idx}>{i.fishName} × {i.quantity}kg{idx < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'pending_qa' && (
                      <>
                        <button onClick={() => updateOrderStatus(order._id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200">
                          <CheckCircle className="h-3 w-3" /> Approve
                        </button>
                        <button onClick={() => updateOrderStatus(order._id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200">
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <button onClick={() => updateOrderStatus(order._id, 'out_for_delivery')}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                        <Clock className="h-3 w-3" /> Mark Out for Delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button onClick={() => updateOrderStatus(order._id, 'delivered')}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                        <CheckCircle className="h-3 w-3" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
