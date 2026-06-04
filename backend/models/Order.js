// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  fishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fish', required: true },
  fishName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.5 },
  pricePerKg: { type: Number, required: true },
  fishermanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fishermanName: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending_qa', 'approved', 'rejected', 'out_for_delivery', 'delivered'],
      default: 'pending_qa',
    },
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 50 },
    deliveryAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.models?.Order || mongoose.model('Order', orderSchema);
export default Order;
