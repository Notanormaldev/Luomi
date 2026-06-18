import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useauth } from '../hook/useauth'
import Logo from '../components/Logo'
import axios from 'axios'
import { FiArrowLeft, FiUser, FiSliders, FiSun, FiMoon, FiCheck, FiLogOut, FiInfo, FiCpu, FiMapPin, FiTruck, FiChevronDown, FiChevronUp, FiPackage, FiClock } from 'react-icons/fi'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { user, handlebecomeseller, handlelogout, loading, handlebecomedelivery, handleupdatesettings } = useauth()

  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('luomi-theme') || 'dark')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [becomeSellerError, setBecomeSellerError] = useState('')
  const [becomeSellerSuccess, setBecomeSellerSuccess] = useState('')
  const [upgrading, setUpgrading] = useState(false)

  // Collapsible Accordions State
  const [isSellerExpanded, setIsSellerExpanded] = useState(false)
  const [isDeliveryExpanded, setIsDeliveryExpanded] = useState(false)

  // Delivery Partner State
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryPincode, setDeliveryPincode] = useState('')
  const [agreeToDeliveryTerms, setAgreeToDeliveryTerms] = useState(false)
  const [becomeDeliveryError, setBecomeDeliveryError] = useState('')
  const [becomeDeliverySuccess, setBecomeDeliverySuccess] = useState('')
  const [upgradingDelivery, setUpgradingDelivery] = useState(false)

  // User Settings State
  const [address, setAddress] = useState(user?.address || '')
  const [city, setCity] = useState(user?.city || '')
  const [pincode, setPincode] = useState(user?.pincode || '')
  const [contact, setContact] = useState(user?.contact || '')
  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  // Orders State
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Fetch buyer orders
  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await axios.get('/api/order/my-orders', { withCredentials: true })
        if (res.data.success) {
          setOrders(res.data.orders)
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err)
      } finally {
        setOrdersLoading(false)
      }
    }
    if (user) {
      fetchMyOrders()
    }
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  // Sync settings inputs when user data loads
  useEffect(() => {
    if (user) {
      setAddress(user.address || '')
      setCity(user.city || '')
      setPincode(user.pincode || '')
      setContact(user.contact || '')
    }
  }, [user])

  const handleThemeChange = (newTheme) => {
    setSelectedTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('luomi-theme', newTheme)
    window.dispatchEvent(new Event('theme-changed'))
  }

  const handleBecomeSellerSubmit = async () => {
    if (!agreeToTerms) return
    setBecomeSellerError('')
    setBecomeSellerSuccess('')
    setUpgrading(true)
    try {
      const res = await handlebecomeseller()
      if (res.success) {
        setBecomeSellerSuccess('Congratulations! You are now a registered Seller.')
        setTimeout(() => {
          navigate('/dashbord/seller')
        }, 2000)
      }
    } catch (err) {
      setBecomeSellerError(err.msg || 'Failed to upgrade profile to seller.')
    } finally {
      setUpgrading(false)
    }
  }

  const handleBecomeDeliverySubmit = async () => {
    if (!agreeToDeliveryTerms) return
    if (!deliveryCity.trim() || !deliveryPincode.trim()) {
      setBecomeDeliveryError('City and Pincode are required to register.')
      return
    }
    setBecomeDeliveryError('')
    setBecomeDeliverySuccess('')
    setUpgradingDelivery(true)
    try {
      const res = await handlebecomedelivery({ city: deliveryCity, pincode: deliveryPincode })
      if (res.success) {
        setBecomeDeliverySuccess('Congratulations! You are now a registered Delivery Partner.')
        setTimeout(() => {
          navigate('/dashboard/delivery')
        }, 2000)
      }
    } catch (err) {
      setBecomeDeliveryError(err.msg || 'Failed to register as delivery partner.')
    } finally {
      setUpgradingDelivery(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSettingsError('')
    setSettingsSuccess('')

    // Validate pincode
    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      setSettingsError('Pincode must be exactly 6 digits.')
      return
    }
    // Validate phone: 10-digit Indian mobile number
    if (contact && !/^[6-9]\d{9}$/.test(contact.trim())) {
      setSettingsError('Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9).')
      return
    }

    setSavingSettings(true)
    try {
      const res = await handleupdatesettings({ address, city, pincode, contact })
      if (res.success) {
        setSettingsSuccess('Shipping details updated successfully!')
        setTimeout(() => setSettingsSuccess(''), 3000)
      }
    } catch (err) {
      setSettingsError(err.msg || 'Failed to update shipping details.')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleLogoutClick = async () => {
    try {
      await handlelogout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading || !user) {
    return (
      <div className="settings-loading-screen">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading Settings...</span>
      </div>
    )
  }

  return (
    <div className="settings-page-container">
      {/* Settings Header */}
      <header className="settings-header">
        <div className="settings-header-inner">
          <button onClick={() => navigate(-1)} className="btn-back">
            <FiArrowLeft size={16} />
            <span>Back</span>
          </button>
          <Logo />
          <div style={{ width: '60px' }} /> {/* Spacer to center logo */}
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="settings-main-content">
        <div className="settings-layout-inner">
          
          <h1 className="settings-title font-heading">
            Account Settings
          </h1>
          <p className="settings-subtitle font-body">
            Manage your account configurations, theme preferences, and merchant status.
          </p>

          <div className="settings-grid">
            {/* Left Column: Profile Card */}
            <div className="settings-card profile-card">
              <div className="profile-header">
                {user.profilepic ? (
                  <img src={user.profilepic} alt={user.fullname} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <FiUser size={24} />
                  </div>
                )}
                <div className="profile-info">
                  <h3 className="profile-name">{user.fullname}</h3>
                  <span className="profile-email">{user.email}</span>
                  <div className={`role-badge ${user.role}`}>
                    {user.role === 'seller' ? 'SELLER PROFILE' : user.role === 'delivery' ? 'DELIVERY PARTNER' : 'BUYER PROFILE'}
                  </div>
                  {user.role === 'seller' && (
                    <Link to="/dashbord/seller" className="settings-cta-btn font-label text-center w-full mt-4" style={{ fontSize: '10px', padding: '0.6rem', width: '100%', boxSizing: 'border-box' }}>
                      Seller Dashboard
                    </Link>
                  )}
                  {user.role === 'delivery' && (
                    <Link to="/dashboard/delivery" className="settings-cta-btn font-label text-center w-full mt-4" style={{ fontSize: '10px', padding: '0.6rem', width: '100%', boxSizing: 'border-box' }}>
                      Delivery Dashboard
                    </Link>
                  )}
                </div>
              </div>

              <div className="profile-footer-actions">
                <button onClick={handleLogoutClick} className="btn-logout">
                  <FiLogOut size={14} />
                  <span>Log Out of Session</span>
                </button>
              </div>
            </div>

            {/* Right Column: Theme & Onboarding Details */}
            <div className="settings-sections">
              
              {/* Appearance / Theme Selector */}
              <div className="settings-card section-card">
                <div className="section-title-wrap">
                  <FiSliders className="section-icon" />
                  <h2 className="section-title">Theme Customization</h2>
                </div>
                <p className="section-desc">
                  Select your interface theme. The floating theme toggles are disabled globally; configuration must be selected here.
                </p>

                <div className="theme-toggle-options">
                  <button 
                    onClick={() => handleThemeChange('light')}
                    className={`theme-option-btn ${selectedTheme === 'light' ? 'active' : ''}`}
                  >
                    <FiSun size={18} className="theme-option-icon" />
                    <div className="theme-option-details">
                      <span className="theme-option-title">Light Mode</span>
                      <span className="theme-option-desc">Minimal high-contrast light fashion theme</span>
                    </div>
                    {selectedTheme === 'light' && <FiCheck className="checked-icon" />}
                  </button>

                  <button 
                    onClick={() => handleThemeChange('dark')}
                    className={`theme-option-btn ${selectedTheme === 'dark' ? 'active' : ''}`}
                  >
                    <FiMoon size={18} className="theme-option-icon" />
                    <div className="theme-option-details">
                      <span className="theme-option-title">Dark Mode</span>
                      <span className="theme-option-desc">Deep monochrome luxury night-mode theme</span>
                    </div>
                    {selectedTheme === 'dark' && <FiCheck className="checked-icon" />}
                  </button>
                </div>
              </div>

              {/* Shipping Address Section */}
              <div className="settings-card section-card">
                <div className="section-title-wrap">
                  <FiMapPin className="section-icon" />
                  <h2 className="section-title">Shipping & Contact Details</h2>
                </div>
                <p className="section-desc">
                  Update your delivery address and contact information to ensure seamless checkout experiences.
                </p>
                <form onSubmit={handleSaveSettings} className="settings-form">
                  <div className="form-group-settings">
                    <label className="form-label-settings">Address</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="Street address, building, apartment..." 
                      className="settings-input-field"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group-settings">
                      <label className="form-label-settings">City</label>
                      <input 
                        type="text" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        placeholder="City" 
                        className="settings-input-field"
                        required
                      />
                    </div>
                    <div className="form-group-settings">
                    <label className="form-label-settings">Pincode (6 digits)</label>
                    <input 
                      type="text" 
                      value={pincode} 
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                      placeholder="6-digit Pincode" 
                      className="settings-input-field"
                      required
                      maxLength={6}
                    />
                  </div>
                  </div>
                  <div className="form-group-settings" style={{ marginTop: '1rem' }}>
                    <label className="form-label-settings">Phone / Contact Number (10 digits)</label>
                    <input 
                      type="text" 
                      value={contact} 
                      onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      placeholder="10-digit Phone Number" 
                      className="settings-input-field"
                      required
                      maxLength={10}
                    />
                  </div>
                  {settingsError && <p className="error-message text-red-500 text-xs font-semibold mt-3">{settingsError}</p>}
                  {settingsSuccess && <p className="success-message text-green-500 text-xs font-semibold mt-3">{settingsSuccess}</p>}
                  <button type="submit" disabled={savingSettings} className="settings-cta-btn w-full mt-4">
                    {savingSettings ? "SAVING DETAILS..." : "SAVE SHIPPING DETAILS"}
                  </button>
                </form>
              </div>

              {/* My Orders Section */}
              <div className="settings-card section-card">
                <div className="section-title-wrap">
                  <FiPackage className="section-icon" />
                  <h2 className="section-title">My Orders</h2>
                </div>
                <p className="section-desc">
                  Track your order status and estimated delivery times for your active and historical purchases.
                </p>

                {ordersLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Retrieving purchases...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed var(--border)', borderRadius: '0px', backgroundColor: 'rgba(120, 120, 120, 0.02)' }}>
                    <p style={{ fontSize: '12px', color: '#888888', margin: 0, letterSpacing: '0.5px' }}>No orders placed yet. Explore our latest arrivals to curate your wardrobe.</p>
                    <Link to="/" className="settings-cta-btn" style={{ display: 'inline-block', marginTop: '1.25rem', padding: '0.65rem 1.5rem', fontSize: '9px', textDecoration: 'none' }}>
                      Browse Collection
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map((order) => {
                      const orderIdShort = `#${order._id.toString().slice(-6).toUpperCase()}`
                      const orderDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                      const deliveryDate = new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })

                      return (
                        <div key={order._id} style={{ border: '1px solid var(--border)', borderRadius: '0px', padding: '1.5rem', backgroundColor: 'rgba(120, 120, 120, 0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {/* Order Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', fontFamily: "'Space Grotesk', sans-serif" }}>{orderIdShort}</span>
                                <span className={`status-badge status-${order.status}`} style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '100px' }}>
                                  {order.status.replace('_', ' ')}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#888888' }}>Placed on {orderDate}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '14px', fontWeight: '500', display: 'block', fontFamily: "'Bodoni Moda', serif" }}>
                                {order.currency === 'INR' ? '₹' : order.currency || '₹'}{order.totalAmount.toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '10px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{order.paymentMethod} • {order.paymentStatus}</span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {order.items.map((item, idx) => {
                              const prod = item.product;
                              if (!prod) return null;
                              return (
                                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                  {prod.images && prod.images.length > 0 ? (
                                    <img src={prod.images[0].url} alt={prod.title} style={{ width: '50px', height: '60px', objectFit: 'cover', border: '1px solid var(--border)', borderRadius: '0px' }} />
                                  ) : (
                                    <div style={{ width: '50px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', border: '1px solid var(--border)', borderRadius: '0px', color: '#888888', backgroundColor: 'rgba(120, 120, 120, 0.05)' }}>LUOMI</div>
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '13px', fontWeight: '500', display: 'block', color: 'var(--text)', fontFamily: "'Cormorant Garamond', serif" }}>{prod.title}</span>
                                    <span style={{ fontSize: '10px', color: '#888888' }}>Qty: {item.quantity}</span>
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                                    {order.currency === 'INR' ? '₹' : order.currency || '₹'}{(item.price?.amount || prod.price?.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Delivery Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '12px', color: order.status === 'delivered' ? '#10B981' : order.status === 'cancelled' ? '#EF4444' : '#B7791F' }}>
                            <FiClock size={13} style={{ flexShrink: 0 }} />
                            <span style={{ letterSpacing: '0.2px' }}>
                              {order.status === 'delivered' ? (
                                <>Delivered on {new Date(order.deliveryConfirmedAt || order.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</>
                              ) : order.status === 'cancelled' ? (
                                <span>Order Cancelled</span>
                              ) : (
                                <>Estimated delivery by <strong>{deliveryDate}</strong> (Within 7 days)</>
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Merchant Status / Become Seller */}
              <div className="settings-card section-card">
                {user.role === 'seller' ? (
                  <div className="seller-status-active">
                    <h2 className="section-title text-green-500 font-semibold mb-2">
                      Seller Account Activated
                    </h2>
                    <p className="section-desc mb-6">
                      You are a registered Luomi Seller. You can create product listings, manage stock levels, and view customer orders from your central dashboard.
                    </p>
                    <Link to="/dashbord/seller" className="settings-cta-btn font-label text-center">
                      Go to Seller Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="become-seller-onboarding">
                    <div className="section-title-wrap cursor-pointer flex justify-between items-center" onClick={() => setIsSellerExpanded(!isSellerExpanded)}>
                      <div className="flex items-center gap-3">
                        <FiSliders className="section-icon" />
                        <h2 className="section-title">Become a Seller</h2>
                      </div>
                      <span>
                        {isSellerExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </span>
                    </div>

                    {isSellerExpanded && (
                      <div style={{ marginTop: '1rem' }}>
                        <p className="section-desc mb-6">
                          Upgrade your buyer account to a merchant seller account. Seller status grants you access to list products and monitor customer purchases.
                        </p>

                        {/* Onboarding Rules Box */}
                        <div className="seller-rules-box">
                          <h4 className="rules-heading font-label">Seller Rules & Guidelines</h4>
                          <ol className="rules-list">
                            <li>
                              <strong>Original Designs:</strong> Only sell original fashion designs, tailored products, or carefully curated boutique pieces. No dropshipping.
                            </li>
                            <li>
                              <strong>Live Stock Enforcement:</strong> You must maintain accurate stock metrics. The system blocks buyers from placing orders when quantities exceed availability.
                            </li>
                            <li>
                              <strong>Premium Media Standards:</strong> Upload high-quality, professional photographs taken on clean, neutral backgrounds to retain the premium aesthetics.
                            </li>
                            <li>
                              <strong>Operational SLA:</strong> Orders must be prepared and processed within 48 business hours. Underperforming sellers will have access restricted.
                            </li>
                          </ol>
                        </div>

                        {/* Feedback Messages */}
                        {becomeSellerError && (
                          <p className="error-message text-red-500 text-xs font-semibold uppercase mb-4">
                            {becomeSellerError}
                          </p>
                        )}

                        {becomeSellerSuccess && (
                          <p className="success-message text-green-500 text-xs font-semibold uppercase mb-4">
                            {becomeSellerSuccess}
                          </p>
                        )}

                        {/* Upgrade Actions */}
                        <div className="onboarding-actions">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={agreeToTerms}
                              onChange={(e) => setAgreeToTerms(e.target.checked)}
                              className="terms-checkbox"
                            />
                            <span className="checkbox-text font-body">
                              I agree to follow all Seller Guidelines and Terms of Service.
                            </span>
                          </label>

                          <button
                            onClick={handleBecomeSellerSubmit}
                            disabled={!agreeToTerms || upgrading}
                            className={`settings-cta-btn ${(!agreeToTerms || upgrading) ? 'disabled' : ''}`}
                          >
                            {upgrading ? 'PROVISIONING SELLER ACCOUNT...' : 'ACTIVATE SELLER ACCOUNT'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Become Delivery Partner */}
              <div className="settings-card section-card">
                {user.role === 'delivery' ? (
                  <div className="delivery-status-active">
                    <h2 className="section-title text-green-500 font-semibold mb-2">
                      Delivery Partner Activated
                    </h2>
                    <p className="section-desc mb-6">
                      You are a registered Luomi Delivery Partner for <strong>{user.city} ({user.pincode})</strong>. You can view pending delivery requests and confirm fulfillment.
                    </p>
                    <Link to="/dashboard/delivery" className="settings-cta-btn font-label text-center">
                      Go to Delivery Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="become-delivery-onboarding">
                    <div className="section-title-wrap cursor-pointer flex justify-between items-center" onClick={() => setIsDeliveryExpanded(!isDeliveryExpanded)}>
                      <div className="flex items-center gap-3">
                        <FiTruck className="section-icon" />
                        <h2 className="section-title">Become a Delivery Partner</h2>
                      </div>
                      <span>
                        {isDeliveryExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </span>
                    </div>

                    {isDeliveryExpanded && (
                      <div style={{ marginTop: '1rem' }}>
                        <p className="section-desc mb-6">
                          Register as an atelier delivery partner. You will fulfill deliveries in your specific city and verify order completions.
                        </p>

                        {/* Onboarding Rules Box */}
                        <div className="seller-rules-box">
                          <h4 className="rules-heading font-label">Delivery Rules & Guidelines</h4>
                          <ol className="rules-list">
                            <li>
                              <strong>Proof of Delivery:</strong> You must upload a clear photo of the delivered product at the delivery location.
                            </li>
                            <li>
                              <strong>Product ID Matching:</strong> The delivery partner must input and verify the specific product ID prior to delivery confirmation.
                            </li>
                            <li>
                              <strong>COD Collection:</strong> If the order is Cash on Delivery, you must collect the exact cash payment and tick the validation receipt box.
                            </li>
                          </ol>
                        </div>

                        {/* Form details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div className="form-group-settings">
                            <label className="form-label-settings">Operating City</label>
                            <input 
                              type="text" 
                              value={deliveryCity} 
                              onChange={(e) => setDeliveryCity(e.target.value)} 
                              placeholder="e.g. Mumbai" 
                              className="settings-input-field"
                            />
                          </div>
                          <div className="form-group-settings">
                            <label className="form-label-settings">Operating Pincode</label>
                            <input 
                              type="text" 
                              value={deliveryPincode} 
                              onChange={(e) => setDeliveryPincode(e.target.value)} 
                              placeholder="Pincode" 
                              className="settings-input-field"
                            />
                          </div>
                        </div>

                        {/* Feedback Messages */}
                        {becomeDeliveryError && (
                          <p className="error-message text-red-500 text-xs font-semibold uppercase mb-4">
                            {becomeDeliveryError}
                          </p>
                        )}

                        {becomeDeliverySuccess && (
                          <p className="success-message text-green-500 text-xs font-semibold uppercase mb-4">
                            {becomeDeliverySuccess}
                          </p>
                        )}

                        {/* Upgrade Actions */}
                        <div className="onboarding-actions">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={agreeToDeliveryTerms}
                              onChange={(e) => setAgreeToDeliveryTerms(e.target.checked)}
                              className="terms-checkbox"
                            />
                            <span className="checkbox-text font-body">
                              I agree to comply with all Delivery Guidelines and Atelier protocols.
                            </span>
                          </label>

                          <button
                            onClick={handleBecomeDeliverySubmit}
                            disabled={!agreeToDeliveryTerms || upgradingDelivery || !deliveryCity || !deliveryPincode}
                            className={`settings-cta-btn ${(!agreeToDeliveryTerms || upgradingDelivery || !deliveryCity || !deliveryPincode) ? 'disabled' : ''}`}
                          >
                            {upgradingDelivery ? 'PROVISIONING DELIVERY PROFILE...' : 'ACTIVATE DELIVERY PARTNER'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* About Section */}
              <div className="settings-card section-card">
                <div className="section-title-wrap">
                  <FiInfo className="section-icon" />
                  <h2 className="section-title">About Luomi</h2>
                </div>
                <p className="section-desc">
                  Luomi is a premium fashion atelier designed for modern individuals who appreciate minimalistic elegance, luxury textiles, and tailored craftsmanship. Our digital flagship store offers curated collections crafted in collaboration with elite global designers.
                </p>
                <div className="about-details-grid">
                  <div className="about-detail-row">
                    <span className="about-detail-label">Philosophy</span>
                    <span className="about-detail-value">Minimalist luxury, zero-waste tailoring.</span>
                  </div>
                  <div className="about-detail-row">
                    <span className="about-detail-label">Version</span>
                    <span className="about-detail-value">v1.2.4 (Atelier Edition)</span>
                  </div>
                  <div className="about-detail-row">
                    <span className="about-detail-label">Contact</span>
                    <span className="about-detail-value">atelier@luomi.com</span>
                  </div>
                </div>
              </div>


            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Settings
