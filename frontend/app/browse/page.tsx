'use client';

import { useEffect, useState } from 'react';
import FishCard from '@/components/FishCard';
import { FishListing, FishCategory, FishSize } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORIES: FishCategory[] = ['Pomfret', 'Surmai', 'Bangda', 'Rawas', 'Prawns'];
const SIZES: FishSize[] = ['Small', 'Medium', 'Large'];

function mapFish(f: any): FishListing {
  return {
    id: f._id,
    fishermanId: f.fishermanId?._id || f.fishermanId,
    fishermanName: f.fishermanName || '',
    category: f.name as FishCategory,
    size: f.size,
    availableQty: f.availableQty,
    minOrderQty: f.minOrderQty,
    pricePerKg: f.pricePerKg,
    originalPrice: f.originalPrice || f.pricePerKg,
    qualityStatus: f.qaStatus,
    image: f.image || '',
    rating: f.rating || 0,
    totalOrders: f.totalOrders || 0,
    createdAt: f.createdAt,
  };
}

export default function BrowsePage() {
  const [fish, setFish] = useState<FishListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (size) params.set('size', size);

    fetch(`${API_BASE}/fish?${params}`)
      .then(r => r.json())
      .then(data => {
        setFish((data.fish || []).map(mapFish));
      })
      .catch(() => toast.error('Failed to load fish listings'))
      .finally(() => setLoading(false));
  }, [category, size]);

  const filtered = fish.filter(f =>
    !search || f.category.toLowerCase().includes(search.toLowerCase()) ||
    f.fishermanName.toLowerCase().includes(search.toLowerCase())
  );

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSize('');
  };

  const hasFilters = search || category || size;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Fresh Fish Market</h1>
        <p className="text-muted-foreground">
          Direct from Ratnagiri fishermen · QA inspected · {filtered.length} listings available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> 
          {/* search icon */}
          <Input
            placeholder="Search fish or fisherman..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <Button
              key={c}
              variant={category === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(category === c ? '' : c)}
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          {SIZES.map(s => (
            <Button
              key={s}
              variant={size === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSize(size === s ? '' : s)}
            >
              {s}
            </Button>
          ))}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card h-80 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No fish listings found</p>
          {hasFilters && (
            <Button variant="link" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(f => (
            <FishCard key={f.id} listing={f} />
          ))}
        </div>
      )}
    </div>
  );
}
