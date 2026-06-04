import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectDB } from './utils/db.js';
import { authMiddleware, requireRole } from './utils/authMiddleware.js';
import User from './models/User.js';
import Fish from './models/Fish.js';
import Order from './models/Order.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(bodyParser.json());

// Connect to MongoDB
await connectDB();

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

// POST /user/signup
app.post('/user/signup', async (req, res) => {
  const { name, email, password, confirmPassword, role, phone } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'customer',
      phone: phone || '',
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /user/login
app.post('/user/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please sign up first.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /user/me — get current user profile
app.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// FISH ROUTES
// ─────────────────────────────────────────────

// GET /fish — list approved fish (public, filterable)
app.get('/fish', async (req, res) => {
  try {
    const { category, size, minPrice, maxPrice, status } = req.query;
    const filter = {};

    // By default show only approved + degraded for customers (browsing)
    if (status) {
      filter.qaStatus = status;
    } else {
      filter.qaStatus = { $in: ['approved', 'degraded'] };
    }

    if (category) filter.name = category;
    if (size) filter.size = size;
    if (minPrice || maxPrice) {
      filter.pricePerKg = {};
      if (minPrice) filter.pricePerKg.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerKg.$lte = Number(maxPrice);
    }

    const fish = await Fish.find(filter).sort({ createdAt: -1 });
    res.json({ fish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /fish/all — list all fish (QA/Admin only)
app.get('/fish/all', authMiddleware, requireRole('qa', 'admin'), async (req, res) => {
  try {
    const fish = await Fish.find().sort({ createdAt: -1 }).populate('fishermanId', 'name email');
    res.json({ fish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /fish/mine — fisherman's own listings
app.get('/fish/mine', authMiddleware, requireRole('fisherman'), async (req, res) => {
  try {
    const fish = await Fish.find({ fishermanId: req.user.id }).sort({ createdAt: -1 });
    res.json({ fish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /fish — fisherman creates a listing
app.post('/fish', authMiddleware, requireRole('fisherman'), async (req, res) => {
  const { name, category, size, pricePerKg, availableQty, minOrderQty, image } = req.body;

  if (!name || !size || !pricePerKg || !availableQty) {
    return res.status(400).json({ message: 'name, size, pricePerKg, availableQty are required' });
  }

  try {
    const user = await User.findById(req.user.id).select('name');
    const fish = await Fish.create({
      name,
      category: category || name,
      size,
      pricePerKg,
      availableQty,
      minOrderQty: minOrderQty || 1,
      fishermanId: req.user.id,
      fishermanName: user?.name || '',
      image: image || '',
      qaStatus: 'pending',
    });
    res.status(201).json({ message: 'Listing created', fish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /fish/:id — fisherman updates own listing
app.put('/fish/:id', authMiddleware, requireRole('fisherman'), async (req, res) => {
  try {
    const fish = await Fish.findOne({ _id: req.params.id, fishermanId: req.user.id });
    if (!fish) return res.status(404).json({ message: 'Listing not found or not yours' });

    const allowed = ['size', 'pricePerKg', 'availableQty', 'minOrderQty', 'image'];
    allowed.forEach(f => { if (req.body[f] !== undefined) fish[f] = req.body[f]; });
    await fish.save();

    res.json({ message: 'Listing updated', fish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /fish/:id — fisherman deletes own listing
app.delete('/fish/:id', authMiddleware, requireRole('fisherman'), async (req, res) => {
  try {
    const fish = await Fish.findOneAndDelete({ _id: req.params.id, fishermanId: req.user.id });
    if (!fish) return res.status(404).json({ message: 'Listing not found or not yours' });
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /fish/:id/qa — QA team updates status
app.patch('/fish/:id/qa', authMiddleware, requireRole('qa', 'admin'), async (req, res) => {
  const { qaStatus } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected', 'degraded'];

  if (!validStatuses.includes(qaStatus)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const fish = await Fish.findById(req.params.id);
    if (!fish) return res.status(404).json({ message: 'Fish not found' });

    fish.qaStatus = qaStatus;
    await fish.save();

    res.json({ message: 'QA status updated', fish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// ORDER ROUTES
// ─────────────────────────────────────────────

// POST /orders — customer places an order
app.post('/orders', authMiddleware, requireRole('customer'), async (req, res) => {
  const { items, deliveryAddress } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must have at least one item' });
  }

  try {
    // Validate all fish exist and are available
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const fish = await Fish.findById(item.fishId);
      if (!fish) return res.status(404).json({ message: `Fish ${item.fishId} not found` });
      if (fish.qaStatus === 'rejected') {
        return res.status(400).json({ message: `${fish.name} is not available (rejected by QA)` });
      }
      if (fish.availableQty < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${fish.name}` });
      }

      const effectivePrice = fish.qaStatus === 'degraded'
        ? Math.round(fish.originalPrice * 0.95)
        : fish.pricePerKg;

      orderItems.push({
        fishId: fish._id,
        fishName: fish.name,
        quantity: item.quantity,
        pricePerKg: effectivePrice,
        fishermanId: fish.fishermanId,
        fishermanName: fish.fishermanName,
      });

      totalAmount += effectivePrice * item.quantity;

      // Reduce available qty
      fish.availableQty -= item.quantity;
      fish.totalOrders += 1;
      await fish.save();
    }

    const deliveryCharge = totalAmount >= 1000 ? 0 : 50;

    const order = await Order.create({
      customerId: req.user.id,
      items: orderItems,
      totalAmount,
      deliveryCharge,
      deliveryAddress: deliveryAddress || '',
      status: 'pending_qa',
    });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /orders/mine — customer's own orders
app.get('/orders/mine', authMiddleware, requireRole('customer'), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /orders — all orders (admin/QA)
app.get('/orders', authMiddleware, requireRole('admin', 'qa'), async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email phone');
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /orders/:id/status — admin/QA updates order status
app.patch('/orders/:id/status', authMiddleware, requireRole('admin', 'qa'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending_qa', 'approved', 'rejected', 'out_for_delivery', 'delivered'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status' });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

// GET /admin/stats
app.get('/admin/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [totalUsers, totalFish, totalOrders, pendingOrders] = await Promise.all([
      User.countDocuments(),
      Fish.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending_qa' }),
    ]);
    res.json({ totalUsers, totalFish, totalOrders, pendingOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /admin/users
app.get('/admin/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'MachhliBazaar API running 🐟' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
