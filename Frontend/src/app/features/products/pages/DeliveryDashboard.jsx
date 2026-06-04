import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useauth } from '../../auth/hook/useauth'
import Logo from '../../auth/components/Logo'
import axios from 'axios'
import { FiArrowLeft, FiTruck, FiMapPin, FiPhone, FiCheck, FiCamera, FiAlertCircle } from 'react-icons/fi'
import './DeliveryDashboard.css'

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const { user, loading } = useauth()
  
  const [orders, setOrders] = useState([])
  const [warehouseAddress, setWarehouseAddress] = useState('')
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  
  // Selection/Verification modal state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [verifyProductId, setVerifyProductId] = useState('')
  const [cashCollected, setCashCollected] = useState(false)
  const [deliveryFile, setDeliveryFile] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [formError, setFormError] = useState('')

  // Sync theme
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

  const fetchDeliveries = async () => {
    setOrdersLoading(true)
    try {
      const res = await axios.get('/api/order/delivery/pending', { withCredentials: true })
      if (res.data.success) {
        setOrders(res.data.orders)
        setWarehouseAddress(res.data.warehouseAddress || '')
      }
    } catch (err) {
      console.error('Failed to fetch delivery orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Fetch pending delivery orders
  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'delivery') {
        navigate('/')
        return
      }
      fetchDeliveries()
    }
  }, [user, loading, navigate])

  const handleOpenConfirmModal = (order) => {
    setSelectedOrder(order)
    setVerifyProductId('')
    setCashCollected(false)
    setDeliveryFile(null)
    setFormError('')
  }

  const handleCloseConfirmModal = () => {
    setSelectedOrder(null)
  }

  const handleConfirmHandover = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!verifyProductId.trim()) {
      setFormError('Please enter a Product ID or the last 6 characters of it.')
      return
    }

    // Validate product ID / partial ID exists in selected order
    const inputLower = verifyProductId.trim().toLowerCase()
    const isIdInOrder = selectedOrder.items.some(item => {
      if (!item.product?._id) return false
      const itemProdId = item.product._id.toString().toLowerCase()
      return itemProdId === inputLower || itemProdId.endsWith(inputLower)
    })
    if (!isIdInOrder) {
      setFormError('Validation failed: Entered ID or code does not match any product in this order.')
      return
    }

    if (selectedOrder.paymentMethod === 'COD' && !cashCollected) {
      setFormError('Validation failed: You must collect cash and check the payment validation tick.')
      return
    }

    if (!deliveryFile) {
      setFormError('Validation failed: A proof of delivery photo is required.')
      return
    }

    setConfirming(true)
    const formData = new FormData()
    formData.append('productId', verifyProductId.trim())
    formData.append('paymentReceivedTick', cashCollected)
    formData.append('deliveryPhoto', deliveryFile)

    try {
      const res = await axios.post(
        `/api/order/delivery/confirm/${selectedOrder._id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      )
      if (res.data.success) {
        alert('Delivery confirmed successfully!')
        handleCloseConfirmModal()
        fetchDeliveries()
      }
    } catch (err) {
      console.error(err)
      setFormError(err.response?.data?.msg || 'Failed to confirm delivery.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="dd-loading-screen">
        <div className="dd-spinner"></div>
        <span className="dd-loading-text">Loading Delivery Dashboard...</span>
      </div>
    )
  }

  return (
    <div className="dd-root">
      {/* Top Centered Brand Logo */}
      <div className="w-full flex justify-center pb-6 border-b border-[rgba(255,255,255,0.05)] mb-2 mt-4">
        <Logo />
      </div>

      <div className="dd-wrapper">
        {/* Header Section */}
        <div className="dd-header">
          <div className="dd-title-group">
            <h1 className="dd-title">Delivery Partner Console</h1>
            <p className="dd-subtitle">Manage deliveries and verify dropoffs in your registered region</p>
          </div>

          <div className="dd-user-actions">
            <div 
              className="dd-profile-minimal cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/settings')}
            >
              <span className="dd-partner-name">{user.fullname}</span>
              <span className="dd-partner-badge">Region: {user.city} ({user.pincode})</span>
            </div>
          </div>
        </div>

        {/* Dashboard Banner Metrics */}
        <div className="dd-metrics">
          <div className="dd-metric-card">
            <span className="dd-metric-label">Assigned City</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="dd-metric-value text-lg sm:text-2xl uppercase tracking-wider">{user.city || 'N/A'}</span>
              <FiMapPin size={18} className="text-[#888888]" />
            </div>
            <span className="dd-metric-trend">Only showing city orders</span>
          </div>

          <div className="dd-metric-card">
            <span className="dd-metric-label">Pickup Warehouse Hub</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="dd-metric-value text-xs text-[var(--dd-text)] font-medium leading-tight" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {warehouseAddress || 'Luomi Regional Hub'}
              </span>
            </div>
            <span className="dd-metric-trend">Pick up packages here</span>
          </div>

          <div className="dd-metric-card">
            <span className="dd-metric-label">Pending Shipments</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="dd-metric-value">{ordersLoading ? '...' : orders.length}</span>
              <FiTruck size={18} className="text-[#888888]" />
            </div>
            <span className="dd-metric-trend">Status: Out for Delivery</span>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="dd-deliveries-section mt-8">
          <div className="dd-section-header mb-6">
            <h2 className="dd-section-title font-heading">Incoming Deliveries</h2>
            <span className="text-xs text-[#888888] font-label uppercase">Pending: {orders.length}</span>
          </div>

          {ordersLoading ? (
            <div className="dd-status-text">Scanning for regional packages...</div>
          ) : orders.length === 0 ? (
            <div className="dd-empty-box">
              <FiCheck size={28} className="text-[#10B981] mb-2" />
              <p className="dd-empty-title">All Deliveries Fulfillled</p>
              <p className="dd-empty-desc">There are no pending shipments out for delivery in {user.city} at the moment.</p>
            </div>
          ) : (
            <div className="dd-grid">
              {orders.map(order => {
                const orderIdShort = `#${order._id.toString().slice(-6).toUpperCase()}`
                const isCOD = order.paymentMethod === 'COD'
                const firstItem = order.items?.[0]
                const firstImage = firstItem?.product?.images?.[0]?.url
                const seller = firstItem?.product?.seller
                
                return (
                  <div key={order._id} className="dd-order-card">
                    {/* Left: Product Image Panel */}
                    <div className="dd-card-image-panel">
                      {firstImage ? (
                        <img src={firstImage} alt={firstItem?.product?.title || 'Order'} />
                      ) : (
                        <div className="dd-card-image-placeholder">LUOMI</div>
                      )}
                    </div>

                    {/* Right: Content Panel */}
                    <div className="dd-card-content-panel">
                      {/* Top: Order ref + Payment badge */}
                      <div className="dd-card-top">
                        <div className="dd-card-order-ref">
                          <span className="dd-card-ref-label">Order Ref</span>
                          <span className="dd-card-ref-value">{orderIdShort}</span>
                        </div>
                        <span className={`dd-card-payment-badge ${order.paymentMethod}`}>
                          {isCOD ? 'COD' : 'ONLINE'}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="dd-card-details-grid">
                        <div className="dd-card-detail-item">
                          <span className="dd-card-detail-label">Recipient</span>
                          <span className="dd-card-detail-value">{order.user?.fullname || 'Buyer'}</span>
                        </div>
                        <div className="dd-card-detail-item">
                          <span className="dd-card-detail-label">Address</span>
                          <span className="dd-card-detail-value" style={{ fontSize: '12px' }}>
                            {order.shippingAddress?.address}, {order.shippingAddress?.city} - {order.shippingAddress?.pincode}
                          </span>
                        </div>
                        {seller && (
                          <div className="dd-card-detail-item">
                            <span className="dd-card-detail-label">Pickup From</span>
                            <span className="dd-card-detail-value" style={{ fontSize: '12px' }}>
                              {seller.fullname} · {seller.city} - {seller.pincode}
                            </span>
                          </div>
                        )}
                        <div className="dd-card-detail-item">
                          <span className="dd-card-detail-label">Contact</span>
                          <span className="dd-card-detail-value">{order.shippingAddress?.contact || '—'}</span>
                        </div>
                        {order.items.length > 1 && (
                          <div className="dd-card-detail-item">
                            <span className="dd-card-detail-label">Items</span>
                            <span className="dd-card-detail-value">{order.items.length} items</span>
                          </div>
                        )}
                        <div className="dd-card-detail-item">
                          <span className="dd-card-detail-label">{isCOD ? 'Collect' : 'Amount'}</span>
                          <span className="dd-card-detail-value" style={{ fontSize: '18px', fontFamily: "'Bodoni Moda', serif", fontWeight: 300 }}>
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div>
                        <button 
                          onClick={() => handleOpenConfirmModal(order)}
                          className="dd-confirm-btn font-label"
                        >
                          Complete Drop
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedOrder && (
        <div className="dd-modal-overlay">
          <div className="dd-modal animate-slide-up">
            <h3 className="dd-modal-title font-heading">Complete Handover</h3>
            <p className="dd-modal-subtitle">
              Verify the shipment details, collect cash if needed, and upload proof of delivery photo.
            </p>

            <form onSubmit={handleConfirmHandover} className="dd-modal-form">
              {/* Product ID input */}
              <div className="dd-form-group">
                <label className="dd-form-label">Verify Product ID</label>
                <input 
                  type="text" 
                  value={verifyProductId}
                  onChange={e => setVerifyProductId(e.target.value)}
                  placeholder="Enter Product ID or last 6 characters (e.g. 75c19)"
                  className="dd-input-field"
                  required
                />
                <span className="dd-input-help">Type the Product ID or the last 6 characters of the Product ID from the bill/package to validate.</span>
              </div>

              {/* COD payment collection checkbox */}
              {selectedOrder.paymentMethod === 'COD' && (
                <div className="dd-form-group-checkbox mt-4">
                  <label className="dd-checkbox-label">
                    <input 
                      type="checkbox"
                      checked={cashCollected}
                      onChange={e => setCashCollected(e.target.checked)}
                      className="dd-checkbox-input"
                    />
                    <span className="dd-checkbox-text">
                      I confirm that I have collected cash payment of <strong>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</strong> from the client.
                    </span>
                  </label>
                </div>
              )}

              {/* Delivery Photo input */}
              <div className="dd-form-group mt-4">
                <label className="dd-form-label">Dropoff Photo Proof</label>
                <div className="dd-file-upload-box">
                  <FiCamera size={20} className="dd-upload-icon" />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setDeliveryFile(e.target.files[0])}
                    className="dd-file-input"
                    required
                  />
                  <span className="dd-upload-text">
                    {deliveryFile ? deliveryFile.name : 'Upload Dropoff Photo'}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="dd-error-message mt-4">
                  <FiAlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="dd-modal-actions mt-6">
                <button 
                  type="button" 
                  onClick={handleCloseConfirmModal}
                  className="dd-modal-btn dd-btn-cancel"
                  disabled={confirming}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="dd-modal-btn dd-btn-confirm"
                  disabled={confirming}
                >
                  {confirming ? 'SUBMITTING PROOF...' : 'Confirm Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
