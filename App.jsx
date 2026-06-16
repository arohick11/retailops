import { useState, useEffect } from 'react'
import { ShoppingCart, Search, LogOut, ShoppingBag, Package } from 'lucide-react'
import Login from './Login'
import Cart from './Cart'
import Admin from './Admin'
import Checkout from './Checkout'
import OrderHistory from './OrderHistory'
import './App.css'

const categories = ['ALL', 'ELECTRONICS', 'HOME', 'APPAREL', 'WELLNESS']

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewAdmin, setViewAdmin] = useState(false)
  const [viewCheckout, setViewCheckout] = useState(false)
  const [viewOrderHistory, setViewOrderHistory] = useState(false)

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Auto-redirect admin users to dashboard
    if (userData.role === 'admin') {
      setViewAdmin(true)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setViewAdmin(false)
    setViewCheckout(false)
    setViewOrderHistory(false)
    localStorage.removeItem('user')
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
          
          // Auto-redirect admin users to dashboard
          if (userData.role === 'admin') {
            setViewAdmin(true)
          }
        }
      } catch (e) {
        console.error('Error parsing saved user from localStorage:', e)
        localStorage.removeItem('user')
      }
    }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products')
      if (!response.ok) {
        throw new Error('Server returned non-2xx status')
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setProducts(data)
      } else {
        throw new Error('Data returned is not an array')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // Fallback to sample data if backend is not available
      setProducts([
        {
          _id: 1,
          name: 'PW-Test-Prod',
          category: 'ELECTRONICS',
          description: 'pw test',
          price: 12.34,
          stock: 6,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
        },
        {
          _id: 2,
          name: 'Minimal Wireless Earbuds',
          category: 'ELECTRONICS',
          description: 'Compact buds with active noise cancellation.',
          price: 129.00,
          stock: 60,
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop'
        },
        {
          _id: 3,
          name: 'Studio Monitor Speaker',
          category: 'ELECTRONICS',
          description: 'Professional-grade studio monitor with crisp mids and tight low end.',
          price: 299.00,
          stock: 24,
          image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop'
        },
        {
          _id: 4,
          name: 'Ceramic Pour-Over Kit',
          category: 'HOME',
          description: 'Matte ceramic dripper, carafe and filter set.',
          price: 64.00,
          stock: 5,
          image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop'
        },
        {
          _id: 5,
          name: 'Linen Straw Hat',
          category: 'APPAREL',
          description: 'Breathable linen hat for summer days.',
          price: 48.00,
          stock: 42,
          image: 'https://images.unsplash.com/photo-1520976390144-575a8ad5c9ce?w=400&h=400&fit=crop'
        },
        {
          _id: 6,
          name: 'Vitamin Oil Serum',
          category: 'WELLNESS',
          description: 'Nourishing serum for radiant skin.',
          price: 32.50,
          stock: 8,
          image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  }) : []

  const addToCart = (product) => {
    setCart([...cart, product])
  }

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const handlePlaceOrder = (orderData) => {
    // Clear cart and show success message
    setCart([])
    setViewCheckout(false)
    alert('Order placed successfully!')
  }

  const handleCheckout = () => {
    setIsCartOpen(false)
    setViewCheckout(true)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Show admin dashboard for admin users
  if (user?.role === 'admin' && viewAdmin) {
    return <Admin user={user} onLogout={handleLogout} />
  }

  // Show checkout page
  if (viewCheckout) {
    return (
      <Checkout
        cart={cart}
        onBack={() => setViewCheckout(false)}
        onPlaceOrder={handlePlaceOrder}
        user={user}
      />
    )
  }

  // Show order history page
  if (viewOrderHistory) {
    return (
      <OrderHistory
        user={user}
        onBack={() => setViewOrderHistory(false)}
      />
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo">
              <h1>RetailOps</h1>
              <span className="storefront">STOREFRONT</span>
            </div>
          </div>
          
          <nav className="nav">
            <a href="#" className="nav-link">Shop</a>
            <a href="#" className="nav-link" onClick={() => setViewOrderHistory(true)}>My Orders</a>
            {user?.role === 'admin' && (
              <a href="#" className="nav-link admin-link" onClick={() => setViewAdmin(true)}>Admin Dashboard</a>
            )}
          </nav>

          <div className="header-right">
            <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={20} />
              <span>Cart</span>
              {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
            </div>
            <div className="user-info">
              <span className="demo-customer">{user?.email || 'Customer'}</span>
              <span className="customer-email">{user?.role || 'customer'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2 className="hero-title">NEW SEASON</h2>
          <p className="hero-subtitle">Curated essentials, delivered without friction.</p>
          <p className="hero-description">
            Browse from a tightly edited catalogue of electronics, wellness, home and apparel. Free returns within 30 days.
          </p>
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search the store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="category-filter">
        <div className="category-filter-inner">
          <div className="categories">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="product-count">
            {filteredProducts.length} products
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="product-grid">
        <div className="product-grid-inner">
          {loading ? (
            <p>Loading products...</p>
          ) : (
            filteredProducts.map(product => (
              <div key={product._id || product.id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="placeholder-image">{product.name}</div>
                )}
              </div>
              <div className="product-category">{product.category}</div>
              <h3 className="product-name">{product.name}</h3>
              {product.description && (
                <p className="product-description">{product.description}</p>
              )}
              <div className="product-footer">
                <div className="product-price">₹{product.price.toFixed(2)}</div>
                <div className="product-stock">{product.stock} in stock</div>
              </div>
              <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
                <ShoppingBag size={16} />
                Add to cart
              </button>
            </div>
            ))
          )}
        </div>
      </section>

      <Cart 
        cart={cart}
        removeFromCart={removeFromCart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  )
}

export default App
