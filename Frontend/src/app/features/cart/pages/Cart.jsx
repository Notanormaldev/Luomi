import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useauth } from '../../auth/hook/useauth'
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

  // Checkout state
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [contact, setContact] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [checkoutError, setCheckoutError] = useState('')

  // Prefill checkout details
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
      alert(`Only ${stock} items available in stock`)
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
        alert(res.error || 'Failed to update')
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
        alert(res.error || 'Failed to remove')
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
    if (!address.trim() || !city.trim() || !pincode.trim() || !contact.trim()) {
      setCheckoutError('Please provide complete shipping details.')
      return
    }
    setCheckoutError('')
    setUpdating(true)

    const payload = {
      shippingAddress: { address, city, pincode, contact },
      paymentMethod
    }

    try {
      if (paymentMethod === 'COD') {
        const res = await handleCheckout(payload)
        if (res.success) {
          navigate('/order-success', { state: { order: res.order } })
        } else {
          setCheckoutError(res.error || 'Checkout failed')
        }
      } else if (paymentMethod === 'Razorpay') {
        const scriptLoaded = await loadRazorpayScript()
        if (!scriptLoaded) {
          alert('Failed to load Razorpay Payment Gateway. Please try again.')
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
              contact: contact
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

                {showCheckoutForm ? (
                  <div className="ct-checkout-panel mt-6 pt-6 border-t border-[var(--border)]">
                    <h4 className="font-heading text-xs uppercase tracking-wider mb-4 text-left font-bold">Shipping & Payment</h4>
                    
                    <div className="flex flex-col gap-3 text-left">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">Address</label>
                        <input 
                          type="text" 
                          value={address} 
                          onChange={e => setAddress(e.target.value)} 
                          placeholder="Delivery Address" 
                          className="ct-checkout-input"
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">City</label>
                          <input 
                            type="text" 
                            value={city} 
                            onChange={e => setCity(e.target.value)} 
                            placeholder="City" 
                            className="ct-checkout-input"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">Pincode</label>
                          <input 
                            type="text" 
                            value={pincode} 
                            onChange={e => setPincode(e.target.value)} 
                            placeholder="Pincode" 
                            className="ct-checkout-input"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">Phone Number</label>
                        <input 
                          type="text" 
                          value={contact} 
                          onChange={e => setContact(e.target.value)} 
                          placeholder="Contact Number" 
                          className="ct-checkout-input"
                        />
                      </div>

                      <div className="flex flex-col gap-1 mt-2">
                        <label className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">Payment Mode</label>
                        <div className="flex gap-4 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text)' }}>
                            <input 
                              type="radio" 
                              name="paymentMethod" 
                              value="COD" 
                              checked={paymentMethod === 'COD'}
                              onChange={() => setPaymentMethod('COD')}
                              className="accent-white"
                            />
                            <span>COD</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text)' }}>
                            <input 
                              type="radio" 
                              name="paymentMethod" 
                              value="Razorpay" 
                              checked={paymentMethod === 'Razorpay'}
                              onChange={() => setPaymentMethod('Razorpay')}
                              className="accent-white"
                            />
                            <span>Online (Razorpay)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {checkoutError && <p className="text-red-500 text-xs font-semibold mt-3 text-left">{checkoutError}</p>}

                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        className="ct-checkout-now-btn"
                        onClick={triggerCheckout}
                        disabled={updating || cartActionLoading}
                        style={{ marginTop: '0.5rem' }}
                      >
                        {updating ? 'CONFIRMING ORDER...' : 'Confirm & Place Order'}
                      </button>
                      <button
                        className="btn-cancel-checkout text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors mt-2"
                        onClick={() => setShowCheckoutForm(false)}
                        disabled={updating}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        Cancel Checkout
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Checkout button */
                  <button
                    className="ct-checkout-now-btn"
                    onClick={() => setShowCheckoutForm(true)}
                    disabled={updating || cartActionLoading}
                  >
                    {updating ? 'PROCESSING...' : 'Checkout Now'}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>


    </div>
  )
}
