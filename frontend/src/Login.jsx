import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? 'login' : 'signup'
      const response = await fetch(`http://localhost:5001/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          role: 'customer'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="login-container">
      {/* Left Side - Marketing */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="brand-section">
            <div className="logo">RetailOps</div>
            <div className="platform-text">OMNICHANNEL PLATFORM</div>
          </div>
          
          <div className="control-surface">OPERATIONAL CONTROL SURFACE</div>
          
          <h1 className="main-title">Run your stores, stock and orders from a single console</h1>
          
          <p className="description">
            A precise, data-dense ops layer for in-store and online retail – inventory, fulfilment and customer flows on one rail.
          </p>
          
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-value">99.98%</div>
              <div className="stat-label">Uptime SLA</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">12ms</div>
              <div className="stat-label">p95 read</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">SOC 2</div>
              <div className="stat-label">Compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Signup Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-toggle">
            <button 
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <h2 className="form-title">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">EMAIL</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">PASSWORD</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="form-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="link-btn"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
