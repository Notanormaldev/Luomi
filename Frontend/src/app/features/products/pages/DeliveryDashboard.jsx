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
      setFormError('Please enter a product ID from this order.')
      return
    }

    // Validate product ID exists in selected order
    const isIdInOrder = selectedOrder.items.some(
      item => item.product?._id === verifyProductId.trim()
    )
    if (!isIdInOrder) {
      setFormError('Validation failed: Product ID does not belong to this order.')
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
              <span className="dd-metric-value text-xs text-[#eeeeee] font-medium leading-tight" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
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
                
                return (
                  <div key={order._id} className="dd-order-card">
                    <div className="dd-card-header">
                      <span className="dd-card-id">{orderIdShort}</span>
                      <span className={`dd-card-payment-badge ${order.paymentMethod}`}>
                        {isCOD ? 'COD - CASH' : 'PAID ONLINE'}
                      </span>
                    </div>

                    <div className="dd-card-body">
                      {/* Products list with rich details */}
                      <div className="dd-card-products">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="dd-product-item-rich flex gap-3 mb-3 pb-3 border-b border-[rgba(255,255,255,0.05)]">
                            {item.product?.images?.[0]?.url ? (
                              <img src={item.product.images[0].url} alt={item.product.title} className="w-12 h-16 object-cover rounded bg-[rgba(255,255,255,0.02)]" />
                            ) : (
                              <div className="w-12 h-16 bg-[#222] rounded flex items-center justify-center text-[8px] text-[#666]">LUOMI</div>
                            )}
                            <div className="flex-1 flex flex-col justify-between" style={{ minHeight: '64px' }}>
                              <div>
                                <span className="dd-product-title block font-semibold text-sm leading-tight text-white">{item.product?.title || 'Luxury apparel'}</span>
                                <p className="text-xs text-[#888888] line-clamp-1 mt-1">{item.product?.description || 'No description available'}</p>
                              </div>
                              <span className="text-[10px] text-[#aaaaaa]">Qty: {item.quantity} | ID: <span className="font-mono text-white select-all">{item.product?._id}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Buyer Shipping Details */}
                      <div className="dd-shipping-details">
                        <div className="dd-detail-row font-semibold mb-1 text-sm text-white">
                          <span>Customer: {order.user?.fullname || 'Buyer'}</span>
                        </div>
                        <div className="dd-detail-row">
                          <FiMapPin size={13} className="dd-detail-icon" />
                          <span className="dd-detail-text">
                            {order.shippingAddress?.address}, {order.shippingAddress?.city} - {order.shippingAddress?.pincode}
                          </span>
                        </div>
                        <div className="dd-detail-row font-normal">
                          <FiPhone size={13} className="dd-detail-icon" />
                          <span className="dd-detail-text">{order.shippingAddress?.contact}</span>
                        </div>
                      </div>
                    </div>

                    <div className="dd-card-footer">
                      <div className="dd-amount-container">
                        <span className="dd-amount-label">{isCOD ? 'Collect:' : 'Amount:'}</span>
                        <span className="dd-amount-value">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <button 
                        onClick={() => handleOpenConfirmModal(order)}
                        className="dd-confirm-btn font-label"
                      >
                        Complete Drop
                      </button>
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
                  placeholder="Enter or scan Product ID (e.g. 64f1...)"
                  className="dd-input-field"
                  required
                />
                <span className="dd-input-help">Type the database Object ID of any item in this order to validate packages.</span>
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
