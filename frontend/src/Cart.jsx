import { X } from 'lucide-react'
import './Cart.css'

function Cart({ cart, removeFromCart, isOpen, onClose, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0)

  if (!isOpen) return null

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="placeholder-image">{item.name}</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <p className="cart-item-category">{item.category}</p>
                    <p className="cart-item-price">₹{item.price.toFixed(2)}</p>
                  </div>
                  <button 
                    className="remove-item-btn"
                    onClick={() => removeFromCart(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">₹{total.toFixed(2)}</span>
              </div>
              <button className="checkout-btn" onClick={onCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart
