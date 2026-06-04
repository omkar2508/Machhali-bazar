import mongoose, { Schema, Document } from 'mongoose';

export interface IFish extends Document {
  name: string;
  category: string;
  size: 'Small' | 'Medium' | 'Large';
  pricePerKg: number;
  originalPrice?: number;
  availableQty: number;
  minOrderQty: number;
  fishermanId: mongoose.Types.ObjectId;
  qaStatus: 'pending' | 'approved' | 'rejected' | 'degraded';
  rating: number;
  totalOrders: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const fishSchema = new Schema<IFish>(
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      enum: {
        values: ['Small', 'Medium', 'Large'],
        message: 'Size must be Small, Medium, or Large',
      },
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Price per kg is required'],
      min: [1, 'Price must be at least ₹1'],
    },
    originalPrice: {
      type: Number,
    },
    availableQty: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    minOrderQty: {
      type: Number,
      required: [true, 'Minimum order quantity is required'],
      min: [0.5, 'Minimum order must be at least 0.5 kg'],
      default: 1,
    },
    fishermanId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Fisherman reference is required'],
    },
    qaStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'degraded'],
        message: 'QA status must be: pending, approved, rejected, or degraded',
      },
      default: 'pending',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Set originalPrice on first save if not provided
fishSchema.pre('save', function (next) {
  if (this.isNew && !this.originalPrice) {
    this.originalPrice = this.pricePerKg;
  }
  // If degraded, apply 5% discount
  if (this.isModified('qaStatus') && this.qaStatus === 'degraded') {
    this.pricePerKg = Math.round(this.originalPrice * 0.95);
  }
  next();
});

// Index for common queries
fishSchema.index({ qaStatus: 1, name: 1 });
fishSchema.index({ fishermanId: 1 });

const Fish = mongoose.models.Fish || mongoose.model<IFish>('Fish', fishSchema);

export default Fish;