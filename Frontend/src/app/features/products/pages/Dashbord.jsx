import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import Logo from '../../auth/components/Logo'
import axios from 'axios'
import { 
  FiPlus, 
  FiArrowRight, 
  FiShoppingBag, 
  FiLayers, 
  FiSun, 
  FiMoon, 
  FiTruck, 
  FiDollarSign, 
  FiSettings, 
  FiCheck
} from 'react-icons/fi'
import './Dashbord.css'

function Dashbord() {
  const navigate = useNavigate()
  const { handlegetsellerprodcut } = useproduct()
  const { user } = useauth()
  
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')

  // Listen for theme changes
  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = localStorage.getItem('luomi-theme') || 'light'
      setTheme(currentTheme)
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
    syncTheme()
    window.addEventListener('theme-changed', syncTheme)
    return () => window.removeEventListener('theme-changed', syncTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('luomi-theme', newTheme)
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    window.dispatchEvent(new Event('theme-changed'))
  }

  useEffect(() => {
    const fetchSellerProducts = async () => {
      setLoading(true)
      try {
        await handlegetsellerprodcut()
      } catch (err) {
        console.error("Failed to fetch products:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchSellerOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await axios.get('/api/product/orders/seller', { withCredentials: true })
        if (res.data.success) {
          setOrders(res.data.orders)
        }
      } catch (err) {
        console.error("Failed to fetch seller orders:", err)
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchSellerProducts()
    fetchSellerOrders()
  }, [])

  const handleMarkOutForDelivery = async (orderId) => {
    try {
      const res = await axios.post(`/api/order/seller/out-for-delivery/${orderId}`, {}, { withCredentials: true })
      if (res.data.success) {
        alert('Order marked as Out for Delivery! Customer will receive email details.')
        const orderRes = await axios.get('/api/product/orders/seller', { withCredentials: true })
        if (orderRes.data.success) {
          setOrders(orderRes.data.orders)
        }
      }
    } catch (err) {
      console.error('Failed to mark order out for delivery:', err)
      alert(err.response?.data?.msg || 'Failed to dispatch order.')
    }
  }

  const products = useSelector(state => state.product.sellerproducts) || []

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'INR': return '₹'
      case 'USD': return '$'
      case 'EUR': return '€'
      case 'JPY': return '¥'
      case 'GBP': return '£'
      default: return currency || '₹'
    }
  }

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return '0.00'
    const parsed = parseFloat(amount)
    if (isNaN(parsed)) return '0.00'
    return parsed.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Dashboard calculations
  const totalProducts = products.length
  const productsWithVariants = products.filter(p => p.variants && p.variants.length > 1).length
  const totalOrders = orders.length
  const outForDeliveryOrders = orders.filter(o => o.status === 'out_for_delivery').length
  const codOrders = orders.filter(o => o.paymentMethod === 'COD').length
  const onlineOrders = orders.filter(o => o.paymentMethod === 'Razorpay' || o.paymentMethod?.toLowerCase() === 'online').length

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        {/* Top Centered Brand Logo */}
        <div className="w-full flex justify-center pb-6 border-b border-[var(--dash-card-border)] mb-2">
          <Logo />
        </div>
        
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <h1 className="dashboard-title">Atelier Console</h1>
            <p className="dashboard-subtitle">Manage your high-fashion collection and listing portfolio</p>
          </div>

          <div className="dashboard-user-actions">
            {/* Theme Toggle Button */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
            </button>

            <div 
              className="seller-profile-minimal cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/settings')}
            >
              <span className="seller-name">{user?.fullname || 'Artisan Seller'}</span>
              <span className="seller-badge">Seller Atelier</span>
            </div>

            <button 
              className="btn-create-creation" 
              onClick={() => navigate('/createproduct/seller')}
            >
              <FiPlus size={14} />
              <span>List Creation</span>
            </button>
          </div>
        </div>

        {/* Metrics Row (6 cards representing full store summary) */}
        <div className="dashboard-metrics">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Products</span>
              <FiLayers size={16} className="metric-icon" />
            </div>
            <span className="metric-value">{loading ? '...' : totalProducts}</span>
            <span className="metric-trend">Active Silhouettes</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Variant Items</span>
              <FiShoppingBag size={16} className="metric-icon" />
            </div>
            <span className="metric-value">{loading ? '...' : productsWithVariants}</span>
            <span className="metric-trend">Multi-option pieces</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Orders</span>
              <FiShoppingBag size={16} className="metric-icon" />
            </div>
            <span className="metric-value">{ordersLoading ? '...' : totalOrders}</span>
            <span className="metric-trend">Client orders received</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Out for Delivery</span>
              <FiTruck size={16} className="metric-icon" />
            </div>
            <span className="metric-value">{ordersLoading ? '...' : outForDeliveryOrders}</span>
            <span className="metric-trend">Dispatched packages</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">COD Orders</span>
              <FiDollarSign size={16} className="metric-icon" />
            </div>
            <span className="metric-value">{ordersLoading ? '...' : codOrders}</span>
            <span className="metric-trend">Cash-on-delivery mode</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Online Payments</span>
              <FiDollarSign size={16} className="metric-icon" />
            </div>
            <span className="metric-value">{ordersLoading ? '...' : onlineOrders}</span>
            <span className="metric-trend">Prepaid Razorpay orders</span>
          </div>
        </div>

        {/* Split Layout: 60% Left for Products, 40% Right for Orders */}
        <div className="dashboard-content-split">
          
          {/* Left Column: Creations Table */}
          <div className="catalog-section">
            <div className="catalog-header-row">
              <h2 className="catalog-section-title">Creations Catalog</h2>
              <Link to="/" className="text-xs text-[var(--dash-subtitle)] hover:text-[var(--dash-title)] transition-colors flex items-center gap-1 font-label">
                <span>View Storefront</span>
                <FiArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="products-table-loading">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-atelier-container">
                <span className="empty-logo">LUOMI</span>
                <p className="empty-text-primary">Your Atelier is Empty</p>
                <p className="empty-text-secondary">
                  You haven't listed any luxury silhouettes in your catalog yet. Click below to publish your first creation.
                </p>
                <button 
                  className="btn-create-creation mt-4"
                  onClick={() => navigate('/createproduct/seller')}
                >
                  <FiPlus size={14} />
                  <span>List First Creation</span>
                </button>
              </div>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Silhouette</th>
                      <th style={{ textAlign: 'center' }}>Variants</th>
                      <th style={{ textAlign: 'center' }}>Total Stock</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const totalStock = product.variants ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 0
                      return (
                        <tr 
                          key={product._id} 
                          onClick={() => navigate(`/product/${product._id}/seller`)}
                          className="clickable-row"
                        >
                          <td>
                            <div className="product-table-cell-info">
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={product.images[0]?.url} 
                                  alt={product.title} 
                                  className="product-table-thumbnail" 
                                />
                              ) : (
                                <div className="product-table-thumbnail-placeholder">LUOMI</div>
                              )}
                              <div className="product-text-details">
                                <span className="product-cell-title">{product.title || 'Untitled'}</span>
                                <span className="product-cell-category">{product.subCategory} ({product.genderCategory})</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="cell-badge">
                              {product.variants?.length || 0} Options
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`cell-stock-count ${totalStock === 0 ? 'out-of-stock' : totalStock < 5 ? 'low-stock' : ''}`}>
                              {totalStock} Left
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '500' }}>
                            {getCurrencySymbol(product.price?.currency)}{formatPrice(product.price?.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Recent Client Purchases */}
          <div className="orders-section">
            <div className="catalog-header-row">
              <h2 className="catalog-section-title">Client Purchases</h2>
              <span className="text-xs text-[var(--dash-subtitle)] font-label uppercase">Orders: {orders.length}</span>
            </div>

            {ordersLoading ? (
              <div className="orders-loading-box">
                Retrieving client purchases...
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-orders-box">
                <p className="empty-orders-title">No Orders Yet</p>
                <p className="empty-orders-subtitle">
                  When clients purchase your silhouettes, their order information will materialize here.
                </p>
              </div>
            ) : (
              <div className="orders-list-wrapper">
                {orders.map((order) => {
                  const displayId = `#${order._id.toString().slice(-6).toUpperCase()}`
                  const orderDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })

                  return (
                    <div key={order._id} className="order-summary-card">
                      
                      {/* Card Header: ID, status, date */}
                      <div className="order-card-header">
                        <div className="order-id-group">
                          <span className="order-id">{displayId}</span>
                          <span className="order-date">{orderDate}</span>
                        </div>
                        <div className="order-badges-group">
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                          <span className={`payment-badge payment-${order.paymentMethod}`}>
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Buyer Details */}
                      <div className="order-client-details">
                        <span className="client-name">{order.buyer?.fullname || 'Unknown Buyer'}</span>
                        <span className="client-contact">
                          {order.buyer?.email || 'N/A'} • {order.buyer?.contact || 'N/A'}
                        </span>
                        {order.shippingAddress && (
                          <div className="client-shipping-address">
                            <strong>Ship To:</strong> {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
                            {order.shippingAddress.contact && ` (Contact: ${order.shippingAddress.contact})`}
                          </div>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="order-items-list">
                        {order.items.map((item, idx) => {
                          const prod = item.product
                          if (!prod) return null
                          const variantInfo = prod.variants?.find(v => v._id === item.selectedVariant)

                          return (
                            <div key={idx} className="order-item-row">
                              {prod.images && prod.images.length > 0 ? (
                                <img src={prod.images[0].url} alt={prod.title} className="order-item-thumbnail" />
                              ) : (
                                <div className="order-item-thumbnail-placeholder">LUOMI</div>
                              )}
                              <div className="order-item-info">
                                <span className="order-item-title">{prod.title}</span>
                                <span className="order-item-meta">
                                  Qty: {item.quantity} {variantInfo?.size && `• Size: ${variantInfo.size}`}
                                </span>
                              </div>
                              <span className="order-item-price">
                                {getCurrencySymbol(item.price?.currency)}{formatPrice(item.price?.amount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Dispatch Actions */}
                      {order.status === 'processing' && (
                        <div className="order-card-actions">
                          <button
                            onClick={() => handleMarkOutForDelivery(order._id)}
                            className="btn-mark-dispatched"
                          >
                            <FiTruck size={12} />
                            <span>Mark Out for Delivery</span>
                          </button>
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

export default Dashbord
