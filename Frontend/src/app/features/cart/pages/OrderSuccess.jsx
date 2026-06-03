import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiArrowLeft, FiShoppingBag, FiTruck, FiPrinter, FiMapPin, FiPhone } from 'react-icons/fi'
import Logo from '../../auth/components/Logo'
import './OrderSuccess.css'

export default function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  
  const order = location.state?.order

  // Theme Sync
  useEffect(() => {
    const sync = () => {
      const t = localStorage.getItem('luomi-theme') || 'light'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    }
    sync()
    window.addEventListener('theme-changed', sync)
    return () => window.removeEventListener('theme-changed', sync)
  }, [])

  // Redirect if no order data in state
  useEffect(() => {
    if (!order) {
      navigate('/')
    }
  }, [order, navigate])

  if (!order) return null

  const getCurrencySymbol = (currency) => {
    return currency === 'INR' ? '₹' : currency || '₹'
  }

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return '0.00'
    const parsed = parseFloat(amount)
    return isNaN(parsed) ? '0.00' : parsed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="os-root">
      {/* Navbar */}
      <div className="os-navbar">
        <div className="os-nav-inner">
          <div className="os-nav-left">
            <button className="os-icon-btn" onClick={() => navigate('/')} title="Go Home">
              <FiArrowLeft size={18} />
            </button>
            <Link to="/" className="os-logo-link"><Logo /></Link>
          </div>
        </div>
      </div>

      <div className="os-container animate-fade-in">
        {/* Success Header Icon */}
        <div className="os-header-card">
          <div className="os-success-icon-wrap">
            <FiCheckCircle size={48} className="os-success-icon" />
          </div>
          <h1 className="os-title font-heading">Order Confirmed</h1>
          <p className="os-subtitle font-body">
            Thank you for purchasing from Luomi Atelier. Your order has been registered and is now processing.
          </p>
          <span className="os-id-badge font-label">
            ORDER ID: #{order._id.toString().toUpperCase()}
          </span>
        </div>

        {/* Receipt Details Grid */}
        <div className="os-receipt-grid">
          {/* Left: Summary Items */}
          <div className="os-receipt-card">
            <h3 className="os-section-title font-heading">Purchased Silhouettes</h3>
            <div className="os-items-list">
              {order.items?.map((item, idx) => (
                <div key={idx} className="os-item-row">
                  <div className="os-item-info">
                    <span className="os-item-name">{item.product?.title || 'Luxury Silhouette'}</span>
                    <span className="os-item-qty text-xs text-[#888888]">Quantity: {item.quantity}</span>
                  </div>
                  <span className="os-item-price font-semibold">
                    {getCurrencySymbol(item.price?.currency)}{formatPrice(item.price?.amount * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Receipt Pricing Breakdown */}
            <div className="os-pricing-breakdown">
              <div className="os-price-row">
                <span>Subtotal</span>
                <span>{getCurrencySymbol(order.currency)}{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="os-price-row">
                <span>Delivery Charge</span>
                <span className="text-green-500 font-bold">FREE</span>
              </div>
              <div className="os-price-total-row border-t border-[var(--border)] pt-4 mt-2">
                <span className="font-heading uppercase tracking-wider text-sm">Grand Total</span>
                <span className="text-xl font-bold">{getCurrencySymbol(order.currency)}{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Right: Shipping & Payment Metadata */}
          <div className="os-receipt-card os-meta-card">
            <h3 className="os-section-title font-heading">Shipping Details</h3>
            <div className="os-meta-item">
              <FiMapPin className="os-meta-icon" />
              <div className="os-meta-text">
                <p className="os-meta-label">Destination Address</p>
                <p className="os-meta-value">{order.shippingAddress?.address}</p>
                <p className="os-meta-value">{order.shippingAddress?.city} - {order.shippingAddress?.pincode}</p>
              </div>
            </div>

            <div className="os-meta-item">
              <FiPhone className="os-meta-icon" />
              <div className="os-meta-text">
                <p className="os-meta-label">Contact Number</p>
                <p className="os-meta-value">{order.shippingAddress?.contact}</p>
              </div>
            </div>

            <h3 className="os-section-title font-heading mt-6 pt-6 border-t border-[var(--border)]">Payment Information</h3>
            <div className="os-meta-item">
              <FiShoppingBag className="os-meta-icon" />
              <div className="os-meta-text">
                <p className="os-meta-label">Payment Method</p>
                <p className="os-meta-value uppercase">{order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay)'}</p>
              </div>
            </div>

            <div className="os-meta-item">
              <FiTruck className="os-meta-icon" />
              <div className="os-meta-text">
                <p className="os-meta-label">Order Status</p>
                <span className={`os-status-badge os-status-${order.status}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="os-actions mt-8 flex gap-4 justify-center">
          <button onClick={handlePrint} className="os-btn os-btn-secondary">
            <FiPrinter size={14} />
            <span>Print Receipt</span>
          </button>
          <Link to="/" className="os-btn os-btn-primary">
            <FiShoppingBag size={14} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
