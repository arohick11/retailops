import { useState, useEffect } from 'react'
import { ArrowLeft, Package, CheckCircle, Clock, XCircle } from 'lucide-react'
import './OrderHistory.css'

function OrderHistory({ user, onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)

  useEffect(() => {
    fetchOrders()
    fetchLoyaltyPoints()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/orders/customer/${user.email}`)
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLoyaltyPoints = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/auth/email/${user.email}`)
      const data = await response.json()
      setLoyaltyPoints(data.loyaltyPoints || 0)
    } catch (error) {
      console.error('Error fetching loyalty points:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={20} className="status-icon completed" />
      case 'Processing':
        return <Clock size={20} className="status-icon processing" />
      default:
        return <XCircle size={20} className="status-icon pending" />
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'completed'
      case 'Processing':
        return 'processing'
      default:
        return 'pending'
    }
  }

  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading-state">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>My Orders</h1>
        <div className="loyalty-points-badge">
          <span>🎁 {loyaltyPoints} Points</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <Package size={48} />
          <h2>No orders yet</h2>
          <p>Start shopping to see your orders here</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="order-label">Order ID:</span>
                  <span className="order-value">{order.orderId || '#' + order._id?.slice(-8)}</span>
                </div>
                <div className={`order-status ${getStatusClass(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status || 'Pending'}</span>
                </div>
              </div>

              <div className="order-date">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>

              <div className="order-products">
                {order.products.map((product, index) => (
                  <div key={index} className="order-product">
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>Quantity: {product.quantity}</p>
                    </div>
                    <div className="product-price">
                      ₹{product.price?.toLocaleString() || '0'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{order.totalAmount?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderHistory
