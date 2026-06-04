'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Fish, ShoppingBag, Clock } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';
import { OrderStatus } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const roleColors: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-800',
  fisherman: 'bg-indigo-100 text-indigo-800',
  qa: 'bg-green-100 text-green-800',
  admin: 'bg-orange-100 text-orange-800',
};

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: any; label: string; value: number | string; sub?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalFish: 0, totalOrders: 0, pendingOrders: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([statsData, usersData, ordersData]) => {
        setStats(statsData);
        setUsers(usersData.users || []);
        setOrders(ordersData.orders || []);
      })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, [token]);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Order updated');
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={Fish} label="Fish Listings" value={stats.totalFish} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} />
        <StatCard icon={Clock} label="Pending QA" value={stats.pendingOrders} sub="orders awaiting inspection" />
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order._id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status as OrderStatus} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {typeof order.customerId === 'object'
                      ? `${order.customerId?.name} · ${order.customerId?.email}`
                      : order.customerId}
                    {' · '}₹{(order.totalAmount + order.deliveryCharge).toFixed(0)}
                    {' · '}{new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {order.items?.map((i: any, idx: number) =>
                    `${i.fishName} ×${i.quantity}kg${idx < order.items.length - 1 ? ', ' : ''}`
                  )}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(['pending_qa', 'approved', 'rejected', 'out_for_delivery', 'delivered'] as OrderStatus[]).map(s => (
                    <button key={s}
                      disabled={order.status === s}
                      onClick={() => updateOrderStatus(order._id, s)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        order.status === s
                          ? 'bg-primary text-white border-primary cursor-default'
                          : 'border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No orders yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={roleColors[u.role] || ''}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No users found</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
