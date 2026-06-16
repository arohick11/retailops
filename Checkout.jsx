import { useState } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import './Checkout.css'

function Checkout({ cart, onBack, onPlaceOrder, user }) {
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('success')
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.zipCode || !formData.phone) {
      setError('Please fill in all fields')
      return
    }

    // Check if cart is empty
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    // Check for out of stock items
    const outOfStockItems = cart.filter(item => item.stock <= 0)
    if (outOfStockItems.length > 0) {
      setError(`Sorry, ${outOfStockItems.map(item => item.name).join(', ')} ${outOfStockItems.length === 1 ? 'is' : 'are'} out of stock`)
      return
    }

    setPaymentProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      if (paymentMethod === 'failure') {
        setPaymentProcessing(false)
        setError('Payment failed. Please try again.')
        return
      }

      // Payment successful - create order
      setLoading(true)

      const createOrder = async () => {
        try {
          const orderData = {
            customer: {
              name: formData.name,
              email: formData.email
            },
            products: cart.map(item => ({
              productId: item._id,
              name: item.name,
              quantity: 1,
              price: item.price
            })),
            totalAmount: cart.reduce((sum, item) => sum + item.price, 0),
            status: 'Pending'
          }

          const response = await fetch('http://localhost:5001/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || 'Failed to place order')
          }

          setOrderSuccess(true)
          setTimeout(() => {
            onPlaceOrder(data)
          }, 2000)
        } catch (err) {
          setError(err.message || 'Failed to place order. Please try again.')
          setPaymentProcessing(false)
        } finally {
          setLoading(false)
        }
      }

      createOrder()
    }, 1500)
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0)

  if (cart.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <ShoppingBag size={48} />
          <h2>Your cart is empty</h2>
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="checkout-container">
        <div className="checkout-success">
          <div className="success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>Order Created Successfully</p>
          <p className="order-id-display">Order ID: {cart.length > 0 ? 'ORD' + Date.now().toString().slice(-6) : 'N/A'}</p>
          <p>Redirecting to shop...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-content">
        {/* Customer Information Form */}
        <div className="checkout-form-section">
          <h2>Customer Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  required
                />
              </div>
              <div className="form-group">
                <label>ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="400001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Method (Simulation)</label>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="success"
                    checked={paymentMethod === 'success'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Successful Payment</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="failure"
                    checked={paymentMethod === 'failure'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Failed Payment</span>
                </label>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="place-order-btn" disabled={loading || paymentProcessing}>
              {paymentProcessing ? 'Processing Payment...' : loading ? 'Placing Order...' : 'Pay Now'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary-section">
          <h2>Order Summary</h2>
          <div className="order-items">
            {cart.map((item, index) => (
              <div key={index} className="order-item">
                <div className="order-item-info">
                  <h3>{item.name}</h3>
                  <p>{item.category}</p>
                </div>
                <div className="order-item-price">
                  ₹{item.price.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="order-total">
            <span>Total:</span>
            <span className="total-amount">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
