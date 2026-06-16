const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const router = express.Router();

// GET all orders
router.get('/', async (req, res) => {
  try {
    console.log('📦 Fetching all orders...');
    const orders = await Order.find();
    console.log('✅ Retrieved', orders.length, 'orders');
    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET orders by customer email
router.get('/customer/:email', async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.email': req.params.email });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new order
router.post('/', async (req, res) => {
  try {
    console.log('📦 New order request received:', {
      customerEmail: req.body.customer?.email,
      productsCount: req.body.products?.length || 0,
      totalAmount: req.body.totalAmount
    });

    // Generate orderId if not provided
    if (!req.body.orderId) {
      req.body.orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    // Reduce stock for each product in the order
    if (req.body.products && req.body.products.length > 0) {
      for (const product of req.body.products) {
        if (product.productId) {
          console.log(`📉 Reducing stock for product ${product.productId} by ${product.quantity}`);
          await Product.findByIdAndUpdate(
            product.productId,
            { $inc: { stock: -product.quantity } }
          );
          console.log(`✅ Stock reduced for product ${product.productId}`);
        }
      }
    }

    // Award loyalty points (1 point per ₹100 spent)
    const pointsEarned = Math.floor(req.body.totalAmount / 100);
    if (pointsEarned > 0 && req.body.customer?.email) {
      console.log(`🎁 Awarding ${pointsEarned} loyalty points to ${req.body.customer.email}`);
      await User.findOneAndUpdate(
        { email: req.body.customer.email },
        { $inc: { loyaltyPoints: pointsEarned } }
      );
      console.log(`✅ Loyalty points awarded`);
    }

    const order = new Order(req.body);
    const savedOrder = await order.save();

    console.log('✅ Order saved successfully:', {
      orderId: savedOrder.orderId,
      customerName: savedOrder.customer.name,
      customerEmail: savedOrder.customer.email,
      totalAmount: savedOrder.totalAmount,
      status: savedOrder.status
    });

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    console.error('Full error details:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update order status
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
