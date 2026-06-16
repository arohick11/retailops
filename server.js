require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const supplierRoutes = require('./routes/suppliers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/retailops';
console.log('Attempting to connect to MongoDB at:', mongoURI);

mongoose.connect(mongoURI)
.then(() => {
  console.log('✅ MongoDB connected to retailops database successfully');
  console.log('Database connection established');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Full error details:', err);
  // Do not crash the server on connection error; mongoose will retry automatically.
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suppliers', supplierRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RetailOps API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
