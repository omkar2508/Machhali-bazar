import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/lib/types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending_qa: { label: 'Pending QA', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', className: 'bg-gray-100 text-gray-700' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status] ?? { label: status, className: '' };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}
