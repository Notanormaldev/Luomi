import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useauth } from '../../auth/hook/useauth'
import { updateSettingsApi } from '../../auth/services/auth.api'
import { usecart } from '../../cart/hook/usecart'
import { getCartWithPricingApi } from '../../cart/services/cart.api'
import Logo from '../../auth/components/Logo'
import {
  FiShoppingBag,
  FiArrowLeft,
  FiUser,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiShield,
  FiArrowRight,
  FiTrash2,
  FiHeart,
  FiCheckCircle
} from 'react-icons/fi'
import './Cart.css'

// Polling interval for live price refresh (30 seconds)
const PRICE_REFRESH_INTERVAL = 30000

export default function Cart() {
  const navigate = useNavigate()
  const { user } = useauth()
  const {
    items: cartItems,
    subtotal,
    handleGetCart,
    handleUpdateCart,
    handleRemoveFromCart,
    handleCheckout,
    handleVerifyPayment,
    loading: cartActionLoading
  } = usecart()

  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  const triggerToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [contact, setContact] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [checkoutError, setCheckoutError] = useState('')

  // Check if user already has complete saved address
  const hasSavedAddress = !!(user?.address?.trim() && user?.city?.trim() && user?.pincode?.trim() && user?.contact?.trim())

  // Prefill checkout details from saved profile
  useEffect(() => {
    if (user) {
      setAddress(user.address || '')
      setCity(user.city || '')
      setPincode(user.pincode || '')
      setContact(user.contact || '')
    }
  }, [user])

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [appliedVoucher, setAppliedVoucher] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [voucherSuccess, setVoucherSuccess] = useState('')

  // Theme sync
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

  // Initial fetch
  useEffect(() => {
    if (user) {
      setLoading(true)
      handleGetCart()
        .catch(err => setError(err || 'Failed to load cart'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  // Redirect if logged-in user is not a buyer
  useEffect(() => {
    if (user && user.role !== 'buyer') {
      if (user.role === 'seller') {
        navigate('/dashbord/seller')
      } else if (user.role === 'delivery') {
        navigate('/dashbord/delivery')
      }
    }
  }, [user, navigate])

  // Format currency
  const fmt = (amount) => {
    if (amount === undefined || amount === null) return '0'
    const n = parseFloat(amount)
    return isNaN(n) ? '0' : n.toLocaleString('en-IN')
  }

  // Handle quantity change — updates via backend and triggers store refresh reactively
  const handleQtyChange = async (item, delta) => {
    const newQty = item.quantity + delta
    const stock = item.variantData
      ? item.variantData.stock
      : item.product.stock || 0

    if (newQty <= 0) {
      await handleRemove(item)
      return
    }

    if (newQty > stock) {
      triggerToast(`Only ${stock} items available in stock`)
      return
    }

    setUpdating(true)
    try {
      const res = await handleUpdateCart({
        productId: item.product._id,
        quantity: newQty,
        variantId: item.selectedVariant || undefined
      })
      if (!res.success) {
        triggerToast(res.error || 'Failed to update')
      }
    } finally {
      setUpdating(false)
    }
  }

  // Handle remove item
  const handleRemove = async (item) => {
    setUpdating(true)
    try {
      const res = await handleRemoveFromCart({
        productId: item.product._id,
        variantId: item.selectedVariant || undefined
      })
      if (!res.success) {
        triggerToast(res.error || 'Failed to remove')
      }
    } finally {
      setUpdating(false)
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Handle Checkout
  const triggerCheckout = async () => {
    const activeAddress = hasSavedAddress ? user.address : address
    const activeCity = hasSavedAddress ? user.city : city
    const activePincode = hasSavedAddress ? user.pincode : pincode
    const activeContact = hasSavedAddress ? user.contact : contact

    if (!activeAddress?.trim() || !activeCity?.trim() || !activePincode?.trim() || !activeContact?.trim()) {
      setCheckoutError('Please provide complete shipping details.')
      return
    }
    // Validate pincode: 6 digits
    if (!/^\d{6}$/.test(activePincode.trim())) {
      setCheckoutError('Pincode must be exactly 6 digits.')
      return
    }
    // Validate phone: 10-digit Indian mobile number
    if (!/^[6-9]\d{9}$/.test(activeContact.trim())) {
      setCheckoutError('Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9).')
      return
    }
    setCheckoutError('')
    setUpdating(true)

    const payload = {
      shippingAddress: { address: activeAddress, city: activeCity, pincode: activePincode, contact: activeContact },
      paymentMethod
    }

    // Auto-save address to profile if using a new address
    if (!hasSavedAddress) {
      try {
        await updateSettingsApi({ address: activeAddress, city: activeCity, pincode: activePincode, contact: activeContact })
      } catch (e) {
        // Non-blocking: address save failure should not block checkout
        console.warn('Could not auto-save address to profile:', e)
      }
    }

    try {
      if (paymentMethod === 'COD') {
        const res = await handleCheckout(payload)
        if (res.success) {
          setShowCheckoutModal(false)
          navigate('/order-success', { state: { order: res.order } })
        } else {
          setCheckoutError(res.error || 'Checkout failed')
        }
      } else if (paymentMethod === 'Razorpay') {
        const scriptLoaded = await loadRazorpayScript()
        if (!scriptLoaded) {
          triggerToast('Failed to load Razorpay Payment Gateway. Please try again.')
          setUpdating(false)
          return
        }

        const res = await handleCheckout(payload)
        if (res.success && res.razorpayOrder) {
          const options = {
            key: res.key || 'rzp_test_Sx8VfpZ6kmmU5H',
            amount: res.razorpayOrder.amount,
            currency: res.razorpayOrder.currency,
            name: 'Luomi Atelier',
            description: 'Payment for luxury fashion apparel',
            order_id: res.razorpayOrder.id,
            handler: async function (response) {
              setUpdating(true)
              try {
                const verifyRes = await handleVerifyPayment({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                })
                if (verifyRes.success) {
                  setShowCheckoutModal(false)
                  navigate('/order-success', { state: { order: verifyRes.order } })
                } else {
                  setCheckoutError(verifyRes.error || 'Payment verification failed.')
                }
              } catch (err) {
                setCheckoutError('Payment verification failed.')
              } finally {
                setUpdating(false)
              }
            },
            prefill: {
              name: user.fullname,
              email: user.email,
              contact: activeContact
            },
            theme: {
              color: '#111111'
            }
          }
          const rzp = new window.Razorpay(options)
          rzp.open()
        } else {
          setCheckoutError(res.error || 'Failed to initialize payment order.')
        }
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout execution failed.')
    } finally {
      setUpdating(false)
    }
  }

  // Voucher apply handler
  const applyVoucherCode = (e) => {
    e.preventDefault()
    setVoucherError('')
    setVoucherSuccess('')
    if (voucherCode.trim().toUpperCase() === 'LUOMI10') {
      setDiscountPercent(10)
      setAppliedVoucher('LUOMI10')
      setVoucherSuccess('Voucher "LUOMI10" applied! 10% discount.')
    } else if (voucherCode.trim() === '') {
      setVoucherError('Please enter a voucher code.')
    } else {
      setVoucherError('Invalid code. Try: LUOMI10')
    }
  }

  // Total items count
  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0)

  // Calculation details
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const deliveryFee = subtotal >= 999 ? 0 : 99
  const finalTotal = subtotal - discountAmount + deliveryFee

  // Redirect if not logged in
  if (!user && !loading) {
    return (
      <div className="ct-root">
        <div className="ct-navbar">
          <div className="ct-nav-inner">
            <div className="ct-nav-left">
              <button className="ct-icon-btn" onClick={() => navigate('/')}><FiArrowLeft size={18} /></button>
              <Link to="/" className="ct-logo-link"><Logo /></Link>
            </div>
          </div>
        </div>
        <div className="ct-empty" style={{ paddingTop: 120 }}>
          <div className="ct-empty-icon"><FiUser size={32} /></div>
          <h2 className="ct-empty-title">Sign in to view your bag</h2>
          <p className="ct-empty-text">Log in to see your items and checkout</p>
          <button className="ct-empty-cta" onClick={() => navigate('/login')}>
            SIGN IN <FiArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="ct-page-loader">
        <div className="ct-nano-bar"></div>
        <h1 className="ct-loader-logo">LUOMI</h1>
      </div>
    )
  }

  const isEmpty = cartItems.length === 0

  return (
    <div className="ct-root">

      {/* ── Navbar ── */}
      <div className="ct-navbar">
        <div className="ct-nav-inner">
          <div className="ct-nav-left">
            <button className="ct-icon-btn" onClick={() => navigate(-1)} title="Go back">
              <FiArrowLeft size={18} />
            </button>
            <Link to="/" className="ct-logo-link"><Logo /></Link>
          </div>
          <div className="ct-nav-right">
            {user?.role === 'seller' && (
              <Link to="/dashbord/seller" className="ct-dashboard-link" title="Go to Seller Atelier Dashboard">
                Atelier
              </Link>
            )}
            <Link to="/wishlist" className="ct-icon-btn" title="View Wishlist">
              <FiHeart size={19} />
            </Link>
            <button className="ct-cart-btn ct-icon-btn" onClick={() => navigate('/cart')} title="Cart">
              <FiShoppingBag size={19} />
              {totalItems > 0 && <span className="ct-cart-badge">{totalItems}</span>}
            </button>
            {user ? (
              <Link to="/settings" className="ct-icon-btn" title="Settings"><FiUser size={19} /></Link>
            ) : (
              <Link to="/login" className="ct-icon-btn" title="Sign In"><FiUser size={19} /></Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="ct-page">

        {/* Header */}
        <div className="ct-page-header">
          <div>
            <h1 className="ct-page-title">Shopping Cart</h1>
            {!isEmpty && (
              <p className="ct-page-subtitle">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
        </div>

        {isEmpty ? (
          /* ── Empty State ── */
          <div className="ct-empty">
            <div className="ct-empty-icon">
              <FiShoppingBag size={32} />
            </div>
            <h2 className="ct-empty-title">Your bag is empty</h2>
            <p className="ct-empty-text">Looks like you haven't added any items yet</p>
            <button className="ct-empty-cta" onClick={() => navigate('/')}>
              START SHOPPING <FiArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* ── Main Layout matching picture ── */
          <div className="ct-main">

            {/* Left column: Cart Items Card Container */}
            <div className="ct-items-section">
              <div className="ct-table-card">
                
                {/* Headers as depicted in image */}
                <div className="ct-table-header">
                  <span className="ct-hdr-product">Product Code</span>
                  <span className="ct-hdr-quantity">Quantity</span>
                  <span className="ct-hdr-total">Total</span>
                  <span className="ct-hdr-action">Action</span>
                </div>

                {/* Items rows */}
                <div className="ct-table-body">
                  {cartItems.map(item => {
                    const key = item.selectedVariant
                      ? `${item.product._id}-${item.selectedVariant}`
                      : item.product._id
                    const img = item.variantData?.images?.[0]?.url
                      || item.product.images?.[0]?.url
                    
                    const variantAttrs = item.variantData?.attributes
                      ? Object.entries(
                          typeof item.variantData.attributes === 'object' && item.variantData.attributes instanceof Map
                            ? Object.fromEntries(item.variantData.attributes)
                            : item.variantData.attributes || {}
                        )
                      : []

                    return (
                      <div key={key} className="ct-table-row">
                        {/* 1. Product Details */}
                        <div className="ct-col-product">
                          <div
                            className="ct-product-img-wrap"
                            onClick={() => navigate(`/product/${item.product._id}`)}
                          >
                            {img ? (
                              <img src={img} alt={item.product.title} className="ct-product-img" />
                            ) : (
                              <div className="ct-product-img-placeholder">LUOMI</div>
                            )}
                          </div>
                          <div className="ct-product-meta">
                            <span
                              className="ct-product-title"
                              onClick={() => navigate(`/product/${item.product._id}`)}
                            >
                              {item.product.title}
                            </span>
                            {variantAttrs.length > 0 && (
                              <span className="ct-product-variant-details">
                                {variantAttrs.map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. Quantity Selector (+ quantity -) */}
                        <div className="ct-col-quantity">
                          <div className="ct-qty-pill">
                            <button
                              className="ct-qty-pill-btn"
                              onClick={() => handleQtyChange(item, 1)}
                              disabled={updating}
                              title="Increase quantity"
                            >
                              <FiPlus size={12} />
                            </button>
                            <span className="ct-qty-pill-val">{item.quantity}</span>
                            <button
                              className="ct-qty-pill-btn"
                              onClick={() => handleQtyChange(item, -1)}
                              disabled={updating}
                              title="Decrease quantity"
                            >
                              <FiMinus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* 3. Total price */}
                        <div className="ct-col-total">
                          <span className="ct-row-total-val">
                            ₹{fmt(item.itemTotal)}
                          </span>
                        </div>

                        {/* 4. Action (Trash can) */}
                        <div className="ct-col-action">
                          <button
                            className="ct-row-delete-btn"
                            onClick={() => handleRemove(item)}
                            disabled={updating}
                            title="Remove from cart"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Right column: Order Summary Panel */}
            <div className="ct-summary-section">
              <div className="ct-summary-card">
                <h3 className="ct-summary-title">Order Summary</h3>

                {/* Voucher code input as pictured */}
                <form onSubmit={applyVoucherCode} className="ct-voucher-form">
                  <input
                    type="text"
                    placeholder="Discount voucher"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="ct-voucher-input"
                  />
                  <button type="submit" className="ct-voucher-btn">
                    Apply
                  </button>
                </form>

                {voucherError && <p className="ct-voucher-error">{voucherError}</p>}
                {voucherSuccess && <p className="ct-voucher-success">{voucherSuccess}</p>}

                {/* Pricing totals rows */}
                <div className="ct-summary-rows">
                  <div className="ct-summary-row">
                    <span className="ct-summary-label">Sub Total</span>
                    <span className="ct-summary-val font-semibold">
                      ₹{fmt(subtotal)}
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="ct-summary-row text-green-600 font-medium">
                      <span className="ct-summary-label">Discount ({discountPercent}%)</span>
                      <span className="ct-summary-val">
                        -₹{fmt(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="ct-summary-row">
                    <span className="ct-summary-label">Delivery fee</span>
                    <span className={`ct-summary-val ${deliveryFee === 0 ? 'text-green-600 font-bold' : ''}`}>
                      {deliveryFee === 0 ? 'FREE' : `₹${fmt(deliveryFee)}`}
                    </span>
                  </div>
                </div>

                {/* Total row */}
                <div className="ct-summary-total-row">
                  <span className="ct-summary-total-label">Total</span>
                  <span className="ct-summary-total-value">
                    ₹{fmt(finalTotal)}
                  </span>
                </div>

                {/* Guarantee info under the checkout as in the image */}
                <div className="ct-warranty-badge">
                  <FiCheckCircle size={15} className="ct-warranty-icon" />
                  <span className="ct-warranty-text">
                    90 Day Limited Warranty against manufacturer's defects <span className="ct-warranty-details-link">Details</span>
                  </span>
                </div>

                <button
                  className="ct-checkout-now-btn"
                  onClick={() => {
                    setCheckoutError('');
                    setShowCheckoutModal(true);
                  }}
                  disabled={updating || cartActionLoading}
                >
                  {updating ? 'PROCESSING...' : 'Checkout Now'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Checkout Modal Overlay */}
      {showCheckoutModal && (
        <div className="ct-modal-overlay">
          <div className="ct-modal animate-slide-up">
            <h3 className="ct-modal-title">Checkout Details</h3>
            <p className="ct-modal-subtitle">Confirm your shipping address and select payment method.</p>
            
            {hasSavedAddress ? (
              <div className="ct-saved-address-block">
                <span className="ct-saved-address-label">Delivery Address</span>
                <p className="ct-saved-address-value">{user.address}, {user.city} - {user.pincode}</p>
                <p className="ct-saved-address-phone">📞 {user.contact}</p>
              </div>
            ) : (
              <div className="ct-address-form">
                <div className="ct-form-group">
                  <label className="ct-form-label">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your flat/house no, street, locality"
                    className="ct-checkout-input"
                  />
                </div>
                <div className="ct-form-grid">
                  <div className="ct-form-group">
                    <label className="ct-form-label">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="City"
                      className="ct-checkout-input"
                    />
                  </div>
                  <div className="ct-form-group">
                    <label className="ct-form-label">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit Pincode"
                      className="ct-checkout-input"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="ct-form-group">
                  <label className="ct-form-label">Phone Number (India only)</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="ct-checkout-input"
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="ct-form-group mt-2">
              <label className="ct-form-label">Select Payment Method</label>
              <div className="ct-payment-methods">
                <label className="ct-payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
                <label className="ct-payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Razorpay"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                  />
                  <span>Online Payment (Razorpay)</span>
                </label>
              </div>
            </div>

            {checkoutError && <p className="ct-checkout-error-text">{checkoutError}</p>}

            <div className="ct-modal-actions">
              <button 
                className="ct-modal-btn ct-btn-cancel" 
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutError('');
                }}
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                className="ct-modal-btn ct-btn-confirm" 
                onClick={triggerCheckout}
                disabled={updating || cartActionLoading}
              >
                {updating ? 'PROCESSING...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="lh-toast animate-slide-up">
          <FiCheckCircle size={14} className="lh-toast-icon" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  )
}
