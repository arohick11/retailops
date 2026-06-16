const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const router = express.Router();

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    console.log('👥 Admin request: Fetching all users');
    const users = await User.find().sort({ createdAt: -1 });
    console.log('✅ Retrieved', users.length, 'users from database');
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get admin stats
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Admin request: Fetching stats');
    
    const totalCustomers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const products = await Product.find();
    const totalProducts = await Product.countDocuments();
    
    // Calculate total revenue from orders using new field name
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate active users (users who joined in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ createdAt: { $gte: yesterday } });
    
    // Calculate low stock items (stock < 10)
    const lowStockItems = await Product.countDocuments({ stock: { $lt: 10 } });
    
    const stats = {
      totalCustomers,
      totalOrders,
      totalRevenue,
      activeUsers,
      totalProducts,
      lowStockItems
    };
    
    console.log('✅ Stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
