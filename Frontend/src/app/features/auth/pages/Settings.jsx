import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useauth } from '../hook/useauth'
import Logo from '../components/Logo'
import { FiArrowLeft, FiUser, FiSliders, FiSun, FiMoon, FiCheck, FiLogOut, FiInfo, FiCpu } from 'react-icons/fi'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { user, handlebecomeseller, handlelogout, loading } = useauth()

  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('luomi-theme') || 'dark')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [becomeSellerError, setBecomeSellerError] = useState('')
  const [becomeSellerSuccess, setBecomeSellerSuccess] = useState('')
  const [upgrading, setUpgrading] = useState(false)


  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

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
                    {user.role === 'seller' ? 'SELLER PROFILE' : 'BUYER PROFILE'}
                  </div>
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
                    <h2 className="section-title mb-2">Become a Seller</h2>
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
