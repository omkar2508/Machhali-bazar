'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { FishCategory, FishSize } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FISH_NAMES: FishCategory[] = ['Pomfret', 'Surmai', 'Bangda', 'Rawas', 'Prawns'];
const SIZES: FishSize[] = ['Small', 'Medium', 'Large'];

const qaColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  degraded: 'bg-orange-100 text-orange-800',
};

interface FishItem {
  _id: string;
  name: string;
  size: FishSize;
  pricePerKg: number;
  availableQty: number;
  minOrderQty: number;
  qaStatus: string;
  image: string;
  createdAt: string;
}

const emptyForm = {
  name: 'Pomfret' as FishCategory,
  size: 'Medium' as FishSize,
  pricePerKg: '',
  availableQty: '',
  minOrderQty: '1',
  image: '',
};

export default function FishermanPage() {
  return (
    <ProtectedRoute allowedRoles={['fisherman']}>
      <FishermanDashboard />
    </ProtectedRoute>
  );
}

function FishermanDashboard() {
  const { token } = useAuth();
  const [listings, setListings] = useState<FishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FishItem>>({});

  const fetchListings = () => {
    fetch(`${API_BASE}/fish/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setListings(data.fish || []))
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pricePerKg || !form.availableQty) {
      toast.error('Price and quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/fish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          category: form.name,
          size: form.size,
          pricePerKg: Number(form.pricePerKg),
          availableQty: Number(form.availableQty),
          minOrderQty: Number(form.minOrderQty),
          image: form.image,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Listing created! Pending QA inspection.');
      setForm(emptyForm);
      setShowForm(false);
      fetchListings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try {
      const res = await fetch(`${API_BASE}/fish/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Listing deleted');
      setListings(prev => prev.filter(f => f._id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/fish/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          size: editForm.size,
          pricePerKg: Number(editForm.pricePerKg),
          availableQty: Number(editForm.availableQty),
          minOrderQty: Number(editForm.minOrderQty),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Listing updated');
      setEditingId(null);
      fetchListings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground mt-1">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" /> New Listing
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Listing</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Fish Type</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {FISH_NAMES.map(n => (
                  <button key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, name: n }))}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      form.name === n ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Size</Label>
              <div className="flex gap-2 mt-1">
                {SIZES.map(s => (
                  <button key={s} type="button"
                    onClick={() => setForm(f => ({ ...f, size: s }))}
                    className={`px-4 py-1 rounded-full text-sm border transition-colors ${
                      form.size === s ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Price per kg (₹)</Label>
              <Input type="number" min="1" value={form.pricePerKg}
                onChange={e => setForm(f => ({ ...f, pricePerKg: e.target.value }))} required />
            </div>
            <div>
              <Label>Available Qty (kg)</Label>
              <Input type="number" min="1" value={form.availableQty}
                onChange={e => setForm(f => ({ ...f, availableQty: e.target.value }))} required />
            </div>
            <div>
              <Label>Min Order Qty (kg)</Label>
              <Input type="number" min="0.5" step="0.5" value={form.minOrderQty}
                onChange={e => setForm(f => ({ ...f, minOrderQty: e.target.value }))} />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input type="url" placeholder="https://..." value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Listing'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Listings table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border animate-pulse bg-muted" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No listings yet. Create your first catch!</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fish</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Price/kg</th>
                <th className="text-left px-4 py-3 font-medium">Qty (kg)</th>
                <th className="text-left px-4 py-3 font-medium">QA Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(f => (
                <tr key={f._id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3">
                    {editingId === f._id ? (
                      <select className="border rounded px-2 py-1 text-sm"
                        value={editForm.size}
                        onChange={e => setEditForm(ef => ({ ...ef, size: e.target.value as FishSize }))}>
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : f.size}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === f._id ? (
                      <Input type="number" className="w-24 h-8 text-sm" value={editForm.pricePerKg}
                        onChange={e => setEditForm(ef => ({ ...ef, pricePerKg: Number(e.target.value) }))} />
                    ) : `₹${f.pricePerKg}`}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === f._id ? (
                      <Input type="number" className="w-24 h-8 text-sm" value={editForm.availableQty}
                        onChange={e => setEditForm(ef => ({ ...ef, availableQty: Number(e.target.value) }))} />
                    ) : f.availableQty}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={qaColors[f.qaStatus] || ''}>{f.qaStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === f._id ? (
                        <>
                          <button onClick={() => handleUpdate(f._id)} className="text-green-600 hover:text-green-800">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(f._id); setEditForm(f); }}
                            className="text-muted-foreground hover:text-primary">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(f._id)}
                            className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
