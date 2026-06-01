import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import Logo from '../../auth/components/Logo'
import axios from 'axios'
import { FiPlus, FiArrowRight, FiShoppingBag, FiLayers, FiSun, FiMoon } from 'react-icons/fi'
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
      const currentTheme = localStorage.getItem('luomi-theme') || 'dark'
      setTheme(currentTheme)
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
    syncTheme()
    window.addEventListener('theme-changed', syncTheme)
    return () => window.removeEventListener('theme-changed', syncTheme)
  }, [])

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

  // Calculate some simple metric counters
  const totalCreations = products.length
  
  // Group by currency to show primary catalog pricing
  const currencyTotals = products.reduce((acc, curr) => {
    const currCurrency = curr?.price?.currency || 'INR'
    const val = parseFloat(curr?.price?.amount || 0)
    if (!isNaN(val)) {
      acc[currCurrency] = (acc[currCurrency] || 0) + val
    }
    return acc
  }, {})

  const formatCatalogValue = () => {
    const keys = Object.keys(currencyTotals)
    if (keys.length === 0) return '0.00'
    return keys.map(curr => `${getCurrencySymbol(curr)}${formatPrice(currencyTotals[curr])}`).join(' + ')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        {/* Top Centered Brand Logo */}
        <div className="w-full flex justify-center pb-6 border-b border-[rgba(255,255,255,0.05)] mb-2">
          <Logo />
        </div>
        
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <h1 className="dashboard-title">Atelier Dashboard</h1>
            <p className="dashboard-subtitle">Manage your high-fashion collection and listing portfolio</p>
          </div>

          <div className="dashboard-user-actions">
            <div className="seller-profile-minimal cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/settings')}>
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

        {/* Metrics Row */}
        <div className="dashboard-metrics">
          <div className="metric-card">
            <span className="metric-label">Active Silhouettes</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="metric-value">{loading ? '...' : totalCreations}</span>
              <FiLayers size={18} className="text-[#888888]" />
            </div>
            <span className="metric-trend">Live in Catalog</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Catalog Value</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="metric-value text-lg sm:text-2xl font-light">
                {loading ? '...' : formatCatalogValue()}
              </span>
            </div>
            <span className="metric-trend">Across all listed currencies</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Atelier Status</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="metric-value">Verified</span>
              <FiShoppingBag size={18} className="text-[#52C41A]" />
            </div>
            <span className="metric-trend">Official Maison account</span>
          </div>
        </div>

        {/* Catalog Section */}
        <div className="catalog-section">
          <div className="catalog-header-row">
            <h2 className="catalog-section-title">Your Listed Creations</h2>
            <Link to="/" className="text-xs text-[#888888] hover:text-white transition-colors flex items-center gap-1 font-label">
              <span>View Storefront</span>
              <FiArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="products-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card">
                  <div className="skeleton-shimmer"></div>
                </div>
              ))}
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
            <div className="products-grid">
              {products.map((product) => {
                const totalStock = product.variants ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 0;
                return (
                  <div key={product._id} onClick={()=>{
                    navigate(`/product/${product._id}/seller`)
                  }} className="luxury-product-card">
                    <div className="product-image-wrapper">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]?.url} 
                          alt={product.title} 
                          className="product-card-img" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-transparent">
                          <span className="font-logo tracking-widest text-[#222222]">LUOMI</span>
                        </div>
                      )}
                      <div className="product-card-badge">LUXURY ORIGINAL</div>
                    </div>

                    <div className="product-info">
                      <div className="product-brand-row">
                        <span className="product-brand-tag">LUOMI MAISON</span>
                        <span className="product-date">
                          {new Date(product.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h3 className="product-title">{product.title || 'Untitled Creation'}</h3>
                      
                      {/* Variants and Stock Summary */}
                      <div className="flex justify-between items-center text-[10px] font-label text-[#888888] uppercase tracking-wider my-1 border-t border-b border-dashed border-[rgba(255,255,255,0.06)] py-1.5">
                        <span>{product.variants?.length || 0} Variants</span>
                        <span>{totalStock} Total Stock</span>
                      </div>

                      <p className="product-desc">
                        {product.description || 'No description provided for this catalog masterpiece.'}
                      </p>

                      <div className="product-footer">
                        <div className="product-price-container">
                          <span className="product-currency">
                            {getCurrencySymbol(product.price?.currency)}
                          </span>
                          <span className="product-price">
                            {formatPrice(product.price?.amount)}
                          </span>
                        </div>
                        <span className="product-card-cta">View Piece</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Client Orders Section */}
        <div className="orders-section mt-12 border-t border-[rgba(255,255,255,0.05)] pt-8">
          <div className="catalog-header-row mb-6">
            <h2 className="catalog-section-title">Client Purchases & Orders</h2>
            <span className="text-xs text-[#888888] font-label uppercase">Total orders: {orders.length}</span>
          </div>
          
          {ordersLoading ? (
            <div className="text-center py-12 text-xs text-[#888888] font-label uppercase tracking-widest">
              Retrieving client purchases...
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders-box text-center py-12 border border-dashed border-[var(--dash-card-border)] bg-[var(--dash-card-bg)]">
              <p className="text-sm text-[var(--dash-text)] font-semibold mb-1">No Orders Yet</p>
              <p className="text-xs text-[#888888] font-body">When clients purchase your silhouettes, their order information will materialize here.</p>
            </div>
          ) : (
            <div className="orders-table-wrapper overflow-x-auto">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Buyer Details</th>
                    <th>Creation Purchased</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th>Order Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    order.items.map((item, itemIdx) => {
                      const prod = item.product;
                      if (!prod) return null;
                      
                      const orderIdStr = order._id.toString();
                      const displayId = `#${orderIdStr.slice(-6).toUpperCase()}`;
                      
                      return (
                        <tr key={`${order._id}-${itemIdx}`}>
                          {itemIdx === 0 ? (
                            <td className="font-label font-bold text-[var(--dash-title)]" rowSpan={order.items.length}>
                              {displayId}
                            </td>
                          ) : null}
                          
                          {itemIdx === 0 ? (
                            <td rowSpan={order.items.length}>
                              <div className="flex flex-col">
                                <span className="font-semibold text-[var(--dash-text)]">{order.buyer?.fullname || 'Unknown Buyer'}</span>
                                <span className="text-[10px] text-[#888888]">{order.buyer?.email || 'N/A'}</span>
                              </div>
                            </td>
                          ) : null}
                          
                          <td>
                            <div className="flex items-center gap-3">
                              {prod.images && prod.images.length > 0 ? (
                                <img src={prod.images[0].url} alt={prod.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px', border: '0.5px solid var(--dash-card-border)' }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', border: '0.5px solid var(--dash-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '8px' }}>LUOMI</div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-semibold text-[var(--dash-text)]">{prod.title}</span>
                                <span className="text-[10px] text-[#888888] capitalize">{prod.subCategory} ({prod.genderCategory})</span>
                              </div>
                            </div>
                          </td>
                          
                          <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--dash-title)' }}>
                            {item.quantity}
                          </td>
                          
                          <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--dash-title)' }}>
                            {getCurrencySymbol(item.price?.currency)}{formatPrice(item.price?.amount)}
                          </td>
                          
                          {itemIdx === 0 ? (
                            <td rowSpan={order.items.length}>
                              <span className={`status-badge-inline status-${order.status}`}>
                                {order.status}
                              </span>
                            </td>
                          ) : null}
                          
                          {itemIdx === 0 ? (
                            <td style={{ color: 'var(--dash-subtitle)' }} rowSpan={order.items.length}>
                              {new Date(order.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashbord

