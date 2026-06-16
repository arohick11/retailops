import { useState, useEffect } from 'react'
import { Users, ShoppingCart, TrendingUp, Activity, LogOut, Package, Settings, BarChart3, Home, Truck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import './Admin.css'

function Admin({ user, onLogout }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalProducts: 0,
    lowStockItems: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleTabChange = (tab) => {
    console.log('🔄 Tab changed to:', tab)
    setActiveTab(tab)
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log('🔄 Updating order status:', orderId, 'to', newStatus)
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        console.log('✅ Order status updated successfully')
        // Refresh orders to show updated status
        fetchOrders()
      } else {
        console.error('❌ Failed to update order status')
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error)
    }
  }

  const handleReceiveStock = async (productId) => {
    const quantity = prompt('Enter quantity to receive:')
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      alert('Please enter a valid positive number')
      return
    }

    try {
      console.log(`📦 Receiving stock for product ${productId}: +${quantity}`)
      const response = await fetch(`http://localhost:5001/api/products/${productId}/receive-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: parseInt(quantity) })
      })

      if (response.ok) {
        console.log('✅ Stock received successfully')
        alert('Stock received successfully!')
        // Refresh products to show updated stock
        fetchProducts()
      } else {
        console.error('❌ Failed to receive stock')
        alert('Failed to receive stock')
      }
    } catch (error) {
      console.error('❌ Error receiving stock:', error)
      alert('Error receiving stock')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCustomers(),
        fetchProducts(),
        fetchOrders(),
        fetchSuppliers(),
        fetchStats()
      ])
      setLoading(false)
    }

    loadData()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchCustomers()
      fetchProducts()
      fetchOrders()
      fetchSuppliers()
      fetchStats()
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([]) // Set empty array on error
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([]) // Set empty array on error
    }
  }

  const fetchOrders = async () => {
    try {
      console.log('📦 Fetching orders from API...')
      const response = await fetch('http://localhost:5001/api/orders')
      const data = await response.json()
      console.log('✅ Orders fetched:', data.length, 'orders')
      setOrders(data)
    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      setOrders([]) // Set empty array on error
    }
  }

  const fetchSuppliers = async () => {
    try {
      console.log('📦 Fetching suppliers from API...')
      const response = await fetch('http://localhost:5001/api/suppliers')
      const data = await response.json()
      console.log('✅ Suppliers fetched:', data.length, 'suppliers')
      setSuppliers(data)
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error)
      setSuppliers([]) // Set empty array on error
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Fallback to calculated stats
      setStats({
        totalCustomers: customers.length,
        totalOrders: 0,
        totalRevenue: 0,
        activeUsers: customers.filter(c => c.lastLogin && new Date(c.lastLogin) > new Date(Date.now() - 24*60*60*1000)).length
      })
    }
  }

  useEffect(() => {
    setLoading(false)
  }, [customers, stats])

  return (
    <div className="admin-container">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>RetailOps Admin</h1>
          <span className="admin-badge">Admin Dashboard</span>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span>{user?.email}</span>
            <span className="admin-role">{user?.role}</span>
          </div>
          <button className="admin-logout-btn" onClick={onLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="admin-nav">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <Home size={18} />
          Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => handleTabChange('products')}
        >
          <Package size={18} />
          Products
        </button>
        <button
          className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <ShoppingCart size={18} />
          Orders
        </button>
        <button
          className={`nav-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => handleTabChange('customers')}
        >
          <Users size={18} />
          Customers
        </button>
        <button
          className={`nav-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => handleTabChange('suppliers')}
        >
          <Truck size={18} />
          Suppliers
        </button>
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <Settings size={18} />
          Settings
        </button>
      </nav>

      {/* Content Sections */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <h3>Total Customers</h3>
                  <p className="stat-value">{stats.totalCustomers}</p>
                  <span className="stat-change positive">+12% from last month</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orders">
                  <ShoppingCart size={24} />
                </div>
                <div className="stat-content">
                  <h3>Total Orders</h3>
                  <p className="stat-value">{stats.totalOrders}</p>
                  <span className="stat-change positive">+8% from last month</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <h3>Total Revenue</h3>
                  <p className="stat-value">₹{stats.totalRevenue.toLocaleString()}</p>
                  <span className="stat-change positive">+15% from last month</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon active">
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <h3>Active Users</h3>
                  <p className="stat-value">{stats.activeUsers}</p>
                  <span className="stat-change neutral">Real-time</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon products">
                  <Package size={24} />
                </div>
                <div className="stat-content">
                  <h3>Total Products</h3>
                  <p className="stat-value">{stats.totalProducts}</p>
                  <span className="stat-change neutral">Inventory</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon low-stock">
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <h3>Low Stock Items</h3>
                  <p className="stat-value">{stats.lowStockItems}</p>
                  <span className="stat-change negative">Stock &lt; 10</span>
                </div>
              </div>
            </div>

            {/* Customer Table */}
            <div className="customer-section">
              <div className="section-header">
                <h2>Recent Customers</h2>
                <span className="live-indicator">● Live</span>
              </div>

              {loading ? (
                <div className="loading-state">Loading customer data...</div>
              ) : (
                <div className="customer-table-container">
                  <table className="customer-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="no-data">No customers found</td>
                        </tr>
                      ) : (
                        customers.slice(0, 5).map((customer) => (
                          <tr key={customer._id}>
                            <td className="customer-email">{customer.email}</td>
                            <td>
                              <span className={`role-badge ${customer.role.toLowerCase()}`}>
                                {customer.role}
                              </span>
                            </td>
                            <td className="customer-date">
                              {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <span className="status-badge active">Active</span>
                            </td>
                            <td>
                              <button className="action-btn">View Details</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Products Management</h2>
              <button className="add-btn">+ Add Product</button>
            </div>

            {loading ? (
              <div className="loading-state">Loading products...</div>
            ) : (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">No products found</td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product._id}>
                          <td className="product-name">{product.name}</td>
                          <td>
                            <span className="category-badge">{product.category}</span>
                          </td>
                          <td className="product-price">₹{product.price.toLocaleString()}</td>
                          <td className="product-stock">{product.stock}</td>
                          <td>
                            <button className="action-btn" onClick={() => handleReceiveStock(product._id)}>+ Stock</button>
                            <button className="action-btn">Edit</button>
                            <button className="action-btn delete">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Orders Management</h2>
              <span className="live-indicator">● Live</span>
            </div>

            {!orders ? (
              <div className="loading-state">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="6" className="no-data">No orders found</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="order-id">{order.orderId || '#' + order._id?.slice(-8)}</td>
                        <td className="customer-email">{order.customer?.email || 'N/A'}</td>
                        <td className="order-total">₹{order.totalAmount?.toLocaleString() || '0'}</td>
                        <td>
                          <select
                            className="status-select"
                            value={order.status || 'Pending'}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="order-date">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <button className="action-btn">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="customer-section">
            <div className="section-header">
              <h2>All Customers</h2>
              <span className="live-indicator">● Live</span>
            </div>

            {loading ? (
              <div className="loading-state">Loading customer data...</div>
            ) : (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">No customers found</td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr key={customer._id}>
                          <td className="customer-email">{customer.email}</td>
                          <td>
                            <span className={`role-badge ${customer.role.toLowerCase()}`}>
                              {customer.role}
                            </span>
                          </td>
                          <td className="customer-date">
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <span className="status-badge active">Active</span>
                          </td>
                          <td>
                            <button className="action-btn">View Details</button>
                            <button className="action-btn delete">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="suppliers-section">
            <div className="section-header">
              <h2>Supplier Management</h2>
              <button className="add-btn">+ Add Supplier</button>
            </div>

            {loading ? (
              <div className="loading-state">Loading suppliers...</div>
            ) : !suppliers || suppliers.length === 0 ? (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="6" className="no-data">No suppliers found</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id}>
                        <td className="supplier-name">{supplier.name}</td>
                        <td>{supplier.company}</td>
                        <td>{supplier.contact}</td>
                        <td className="supplier-email">{supplier.email}</td>
                        <td>{supplier.phone}</td>
                        <td>
                          <button className="action-btn">Edit</button>
                          <button className="action-btn delete">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="section-header">
              <h2>Analytics & Reports</h2>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>Sales Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { name: 'Jan', sales: 4000 },
                    { name: 'Feb', sales: 3000 },
                    { name: 'Mar', sales: 2000 },
                    { name: 'Apr', sales: 2780 },
                    { name: 'May', sales: 1890 },
                    { name: 'Jun', sales: 2390 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Orders Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Jan', orders: 12 },
                    { name: 'Feb', orders: 8 },
                    { name: 'Mar', orders: 15 },
                    { name: 'Apr', orders: 20 },
                    { name: 'May', orders: 18 },
                    { name: 'Jun', orders: 25 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Electronics', revenue: 120000 },
                    { name: 'Home', revenue: 80000 },
                    { name: 'Apparel', revenue: 60000 },
                    { name: 'Wellness', revenue: 40000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Customer Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { name: 'Jan', customers: 20 },
                    { name: 'Feb', customers: 35 },
                    { name: 'Mar', customers: 45 },
                    { name: 'Apr', customers: 60 },
                    { name: 'May', customers: 75 },
                    { name: 'Jun', customers: 90 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="customers" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Settings</h2>
            </div>
            <div className="settings-placeholder">
              <Settings size={48} />
              <h3>Admin Settings</h3>
              <p>Configure your admin preferences and system settings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
