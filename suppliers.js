const express = require('express');
const Supplier = require('../models/Supplier');
const router = express.Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    console.log('📦 Fetching all suppliers...');
    const suppliers = await Supplier.find();
    console.log('✅ Retrieved', suppliers.length, 'suppliers');
    res.json(suppliers);
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new supplier
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new supplier:', req.body.name);
    const supplier = new Supplier(req.body);
    const savedSupplier = await supplier.save();
    console.log('✅ Supplier created successfully:', savedSupplier.name);
    res.status(201).json(savedSupplier);
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    console.log('🔄 Updating supplier:', req.params.id);
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    console.log('✅ Supplier updated successfully:', supplier.name);
    res.json(supplier);
  } catch (error) {
    console.error('❌ Error updating supplier:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting supplier:', req.params.id);
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    console.log('✅ Supplier deleted successfully:', supplier.name);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting supplier:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
