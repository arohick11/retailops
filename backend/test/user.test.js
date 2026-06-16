const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');

console.log('🧪 Running User Model Schema Tests...');

try {
  const testUser = new User({
    email: 'test@retailops.com',
    password: 'securehashpassword'
  });

  // Test field assignments
  assert.strictEqual(testUser.email, 'test@retailops.com');
  assert.strictEqual(testUser.password, 'securehashpassword');

  // Test default values
  assert.strictEqual(testUser.role, 'customer');
  assert.strictEqual(testUser.loyaltyPoints, 0);

  console.log('✅ All User Model Schema Tests Passed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ User Model Schema Test Failed:', error);
  process.exit(1);
}
