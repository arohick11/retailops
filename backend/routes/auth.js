const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Simple hash function using crypto
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    console.log('📝 Signup request received:', { email: req.body.email, role: req.body.role });
    const { email, password, role } = req.body;
    
    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    console.log('👤 Creating new user in users collection...');
    const user = new User({
      email,
      password: hashedPassword,
      role: role || 'customer'
    });
    
    await user.save();
    console.log('✅ User saved successfully to retailops database:', { email: user.email, role: user.role, id: user._id });
    
    res.status(201).json({ 
      email: user.email, 
      role: user.role,
      message: 'Signup successful' 
    });
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    console.error('Full error details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login request received:', { email: req.body.email });
    const { email, password } = req.body;
    
    console.log('🔍 Finding user in users collection...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('⚠️ User not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    console.log('🔐 Comparing password...');
    let isMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === hashPassword(password);
    }
    
    if (!isMatch) {
      console.log('⚠️ Password mismatch for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('✅ Login successful for:', { email: user.email, role: user.role });
    res.json({ 
      email: user.email, 
      role: user.role,
      loyaltyPoints: user.loyaltyPoints || 0,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('Full error details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ email: user.email, role: user.role, loyaltyPoints: user.loyaltyPoints || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
