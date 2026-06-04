export type UserRole = 'customer' | 'fisherman' | 'qa' | 'admin';

export type FishCategory = 'Pomfret' | 'Surmai' | 'Bangda' | 'Rawas' | 'Prawns';
export type FishSize = 'Small' | 'Medium' | 'Large';
export type QualityStatus = 'pending' | 'approved' | 'degraded' | 'rejected';
export type OrderStatus = 'pending_qa' | 'approved' | 'rejected' | 'out_for_delivery' | 'delivered';

export interface FishListing {
  id: string;
  fishermanId: string;
  fishermanName: string;
  category: FishCategory;
  size: FishSize;
  availableQty: number;
  minOrderQty: number;
  pricePerKg: number;
  originalPrice: number;
  qualityStatus: QualityStatus;
  image: string;
  rating: number;
  totalOrders: number;
  createdAt: string;
}

export interface CartItem {
  listing: FishListing;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  createdAt: string;
}
