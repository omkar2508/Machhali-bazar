'use client';

import { FishListing } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Plus, AlertTriangle } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const qualityBadge: Record<string, { label: string; className: string }> = {
  approved: { label: 'QA Approved', className: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending QA', className: 'bg-yellow-100 text-yellow-800' },
  degraded: { label: 'Quality Reduced', className: 'bg-orange-100 text-orange-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

export default function FishCard({ listing }: { listing: FishListing }) {
  const { addToCart } = useCart();
  const { user, role } = useAuth();
  const router = useRouter();
  const [qty, setQty] = useState(listing.minOrderQty);

  const badge = qualityBadge[listing.qualityStatus] ?? qualityBadge.pending;
  const isDegraded = listing.qualityStatus === 'degraded';
  const effectivePrice = isDegraded
    ? Math.round(listing.originalPrice * 0.95)
    : listing.pricePerKg;

  const canBuy = !role || role === 'customer';

  const handleAdd = () => {
    if (!user) {
      toast.info('Please sign in to add items to cart');
      router.push('/auth');
      return;
    }
    if (role !== 'customer') {
      toast.error('Only customers can add items to cart');
      return;
    }
    addToCart({ ...listing, pricePerKg: effectivePrice }, qty);
    toast.success(`${qty} kg ${listing.category} added to cart`);
  };

  return (
    <div className="group rounded-xl border bg-card shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={listing.image || `https://source.unsplash.com/400x400/?${listing.category.toLowerCase()},fish`}
          alt={listing.category}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <Badge className={`absolute top-3 left-3 ${badge.className}`}>
          {badge.label}
        </Badge>
        {isDegraded && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-orange-500/90 px-2 py-1 text-xs font-medium text-white">
            <AlertTriangle className="h-3 w-3" /> 5% off
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-foreground text-lg">{listing.category}</h3>
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            <Star className="h-4 w-4 fill-yellow-500" />
            <span className="font-medium">{listing.rating || 0}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          by {listing.fishermanName} · {listing.size} · {listing.availableQty} kg left
        </p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-primary">₹{effectivePrice}</span>
          <span className="text-sm text-muted-foreground">/kg</span>
          {isDegraded && (
            <span className="text-sm text-muted-foreground line-through">₹{listing.originalPrice}</span>
          )}
        </div>
        {canBuy && listing.availableQty > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border">
              <button
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setQty(q => Math.max(listing.minOrderQty, +(q - 0.5).toFixed(1)))}
              >−</button>
              <span className="px-3 py-1.5 text-sm font-medium text-foreground min-w-[3rem] text-center">
                {qty} kg
              </span>
              <button
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setQty(q => Math.min(listing.availableQty, +(q + 0.5).toFixed(1)))}
              >+</button>
            </div>
            <Button onClick={handleAdd} className="flex-1 gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        )}
        {listing.availableQty === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Out of stock</p>
        )}
      </div>
    </div>
  );
}
