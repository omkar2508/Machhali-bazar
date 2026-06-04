// models/Fish.js
import mongoose from 'mongoose';

const fishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fish name is required'],
      trim: true,
      enum: {
        values: ['Pomfret', 'Surmai', 'Bangda', 'Rawas', 'Prawns'],
        message: 'Fish name must be one of: Pomfret, Surmai, Bangda, Rawas, Prawns',
      },
    },
    category: { type: String, required: true, trim: true },
    size: {
      type: String,
      required: true,
      enum: ['Small', 'Medium', 'Large'],
    },
    pricePerKg: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number },
    availableQty: { type: Number, required: true, min: 0 },
    minOrderQty: { type: Number, required: true, min: 0.5, default: 1 },
    fishermanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fishermanName: { type: String, default: '' },
    qaStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'degraded'],
      default: 'pending',
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

fishSchema.pre('save', async function (next) {
  if (this.isNew && !this.originalPrice) {
    this.originalPrice = this.pricePerKg;
  }
  if (this.isModified('qaStatus') && this.qaStatus === 'degraded') {
    this.pricePerKg = Math.round(this.originalPrice * 0.95);
  }
  
});

fishSchema.index({ qaStatus: 1, name: 1 });
fishSchema.index({ fishermanId: 1 });

const Fish = mongoose.models?.Fish || mongoose.model('Fish', fishSchema);
export default Fish;
