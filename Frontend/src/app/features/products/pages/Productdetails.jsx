import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import Logo from '../../auth/components/Logo'
import { 
  FiShoppingBag, 
  FiSun, 
  FiMoon, 
  FiX, 
  FiPlus, 
  FiMinus, 
  FiArrowLeft,
  FiUser,
  FiInfo,
  FiTruck,
  FiShield
} from 'react-icons/fi'
import './Productdetails.css'

function Productdetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { handlegetoneprodcut } = useproduct()
  const { user } = useauth()

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'dark')
  
  // UI & Loading States
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  
  // Accordion open/close state
  const [openTabs, setOpenTabs] = useState({
    specifications: true,
    delivery: false,
  })

  // Cart State
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('luomi-cart')
    return savedCart ? JSON.parse(savedCart) : []
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('luomi-theme', theme)
  }, [theme])

  // Sync cart
  useEffect(() => {
    localStorage.setItem('luomi-cart', JSON.stringify(cart))
  }, [cart])

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Fetch product detail on mount
  useEffect(() => {
    const fetchSingleProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await handlegetoneprodcut({ productid: id })
        if (response.success && response.products) {
          setProduct(response.products)
          setActiveImgIndex(0)
        } else {
          setError("This artisanal piece could not be found.")
        }
      } catch (err) {
        console.error("Failed to load single product:", err)
        setError(err.msg || "Failed to retrieve the product. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSingleProduct()
    }
  }, [id])

  // Cart Operations
  const addToCart = (productObj, selectedQty = 1) => {
    if (!productObj) return
    setCart(prev => {
      const existing = prev.find(item => item.product._id === productObj._id)
      if (existing) {
        return prev.map(item => 
          item.product._id === productObj._id 
            ? { ...item, quantity: item.quantity + selectedQty }
            : item
        )
      }
      return [...prev, { product: productObj, quantity: selectedQty }]
    })
    setIsCartOpen(true)
  }

  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product._id === productId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : null
        }
        return item
      }).filter(Boolean)
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product._id !== productId))
  }

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

  const toggleTab = (tabName) => {
    setOpenTabs(prev => ({
      ...prev,
      [tabName]: !prev[tabName]
    }))
  }

  // Calculate cart subtotal
  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const cartTotal = cart.reduce((acc, curr) => {
    const amt = parseFloat(curr.product.price?.amount || 0)
    return acc + (isNaN(amt) ? 0 : amt) * curr.quantity
  }, 0)
  const cartCurrencySymbol = cart.length > 0 ? getCurrencySymbol(cart[0].product.price?.currency) : '₹'

  return (
    <div className="prod-details-container">
      
      {/* Sticky Premium Navbar */}
      <div className="home-nav-container">
        <div className="home-navbar">
          
          <div className="nav-left">
            <Link to="/" className="no-underline">
              <Logo />
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Collections</Link>
              <span className="nav-link" onClick={() => navigate('/dashbord/seller')}>Atelier</span>
            </div>
          </div>

          <div className="nav-right">
            {/* Theme Toggle */}
            <button 
              className="btn-icon-round" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            {/* Shopping Bag Button */}
            <div className="btn-bag-wrap">
              <button className="btn-icon-round" onClick={() => setIsCartOpen(true)}>
                <FiShoppingBag size={18} />
              </button>
              {totalCartItems > 0 && <span className="bag-count-badge">{totalCartItems}</span>}
            </div>

            {/* Seller / Profile Action */}
            {user ? (
              <Link 
                to="/dashbord/seller" 
                className="btn-nav-pill"
              >
                <FiUser size={13} />
                <span className="hidden sm:inline">{user.fullname?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="btn-nav-pill"
              >
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="prod-details-wrapper">
        
        {/* Back Link Row */}
        <div className="details-back-bar">
          <button className="btn-back-home" onClick={() => navigate('/')}>
            <FiArrowLeft size={12} />
            <span>Back to Silhouettes</span>
          </button>
        </div>

        {loading ? (
          /* Premium Shimmer Loading State */
          <div className="details-skeleton-grid">
            <div className="skeleton-gallery">
              <div className="skeleton-shimmer"></div>
            </div>
            <div className="skeleton-specs-panel">
              <div className="skeleton-pill"></div>
              <div className="skeleton-title-bar"></div>
              <div className="skeleton-pill"></div>
              <div className="skeleton-desc-block"></div>
              <div className="skeleton-btn-bar"></div>
            </div>
          </div>
        ) : error || !product ? (
          /* Elegant Error State */
          <div className="home-empty-state">
            <span className="empty-brand-mark">LUOMI</span>
            <p className="empty-primary">{error || "Artisanal creation unavailable"}</p>
            <button className="btn-hero-cta" onClick={() => navigate('/')}>
              Return to Catalog
            </button>
          </div>
        ) : (
          /* Premium Content Grid */
          <div className="details-main-grid">
            
            {/* Column Left: High-End Photo Gallery */}
            <div className="details-gallery-section">
              <div className="main-image-viewport">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img 
                      src={product.images[activeImgIndex]?.url || product.images[0]?.url} 
                      alt={product.title} 
                    />
                    {product.images.length > 1 && (
                      <>
                        <button 
                          className="gallery-nav-btn prev-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImgIndex(prev => (prev - 1 + product.images.length) % product.images.length);
                          }}
                          aria-label="Previous Image"
                        >
                          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 9L1 5L5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="gallery-nav-btn next-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImgIndex(prev => (prev + 1) % product.images.length);
                          }}
                          aria-label="Next Image"
                        >
                          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="details-gallery-empty">
                    <span className="details-gallery-empty-label">LUOMI</span>
                  </div>
                )}
              </div>

              {/* Dynamic Thumbnail list displaying all photos */}
              {product.images && product.images.length > 1 && (
                <div className="thumbnail-tray">
                  {product.images.map((img, idx) => (
                    <div 
                      key={img._id || idx} 
                      className={`thumbnail-wrapper ${activeImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(idx)}
                    >
                      <img 
                        src={img.url} 
                        alt={`${product.title} view ${idx + 1}`} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column Right: Specifications and Purchase Actions */}
            <div className="details-info-section">
              <div className="details-meta-labels">
                <span className="details-brand-tag">LUOMI MAISON</span>
                <h1 className="details-title">{product.title || 'Untitled Piece'}</h1>
              </div>

              <div className="details-price-tag">
                <span className="details-currency">{getCurrencySymbol(product.price?.currency)}</span>
                <span className="details-amount">{formatPrice(product.price?.amount)}</span>
              </div>

              <div className="details-desc-area">
                {product.description || "Artisanal creation waiting to be discovered. Hand-tailored silhouetted lines, structured textures, and monochrome excellence."}
              </div>

              {/* Verified Seller Badge */}
              {product.seller ? (
                <div className="verified-seller-badge">
                  {typeof product.seller === 'object' && product.seller.profilepic ? (
                    <img 
                      src={product.seller.profilepic} 
                      alt={product.seller.fullname || 'Seller'} 
                      className="verified-seller-pic" 
                    />
                  ) : (
                    <div className="verified-seller-pic-fallback">
                      {typeof product.seller === 'object' && product.seller.fullname 
                        ? product.seller.fullname[0].toUpperCase() 
                        : 'S'}
                    </div>
                  )}
                  <div className="verified-seller-info">
                    <span className="verified-seller-name">
                      {typeof product.seller === 'object' 
                        ? (product.seller.fullname || 'Independent Atelier') 
                        : `Independent Atelier #${product.seller.substring(0, 6).toUpperCase()}`}
                    </span>
                    {(typeof product.seller !== 'object' || product.seller.isverified) && (
                      <div className="verified-seller-check">
                        <svg className="verified-check-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="verified-check-text">Verified Seller</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="verified-seller-badge">
                  <div className="verified-seller-pic-fallback">L</div>
                  <div className="verified-seller-info">
                    <span className="verified-seller-name">LUOMI House</span>
                  </div>
                </div>
              )}

              {/* Purchase Controls */}
              <div className="purchase-controls">
                
                {/* Quantity Numeric Switcher */}
                <div className="qty-selection-row">
                  <span className="qty-label">Quantity</span>
                  <div className="qty-widget">
                    <button 
                      className="btn-qty-action" 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    >
                      <FiMinus size={11} />
                    </button>
                    <span className="qty-display">{quantity}</span>
                    <button 
                      className="btn-qty-action" 
                      onClick={() => setQuantity(prev => prev + 1)}
                    >
                      <FiPlus size={11} />
                    </button>
                  </div>
                </div>

                {/* Call To Action Buttons */}
                <div className="cta-buttons-stack">
                  <button 
                    className="btn-add-bag-details"
                    onClick={() => addToCart(product, quantity)}
                  >
                    Add to Bag
                  </button>
                  <button 
                    className="btn-buy-now-details"
                    onClick={() => {
                      addToCart(product, quantity)
                      setIsCartOpen(true)
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              {/* Premium Details Accordions */}
              <div className="details-tabs-accordions">
                
                {/* Accordion Item 1 */}
                <div className={`accordion-tab ${openTabs.specifications ? 'open' : ''}`}>
                  <button className="accordion-tab-head" onClick={() => toggleTab('specifications')}>
                    <span className="accordion-tab-title">Specifications</span>
                    <FiPlus size={12} className="accordion-tab-icon" />
                  </button>
                  <div className="accordion-tab-body">
                    <div className="specs-grid">
                      <span className="specs-label">Material</span>
                      <span className="specs-val">100% Organic Silk & Tailored Linen blend</span>
                      <span className="specs-label">Care</span>
                      <span className="specs-val">Dry clean only. Store on soft padded hangers.</span>
                      <span className="specs-label">Origin</span>
                      <span className="specs-val">Handcrafted in independent regional atelier</span>
                      <span className="specs-label">Updated</span>
                      <span className="specs-val">{new Date(product.updatedAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Accordion Item 2 */}
                <div className={`accordion-tab ${openTabs.delivery ? 'open' : ''}`}>
                  <button className="accordion-tab-head" onClick={() => toggleTab('delivery')}>
                    <span className="accordion-tab-title">Shipping & Returns</span>
                    <FiPlus size={12} className="accordion-tab-icon" />
                  </button>
                  <div className="accordion-tab-body">
                    <p style={{ margin: 0 }}>
                      Complementary courier shipping on all regional atelier creations. Express delivery arrives within 3-5 business days complete with signature receipt.
                    </p>
                    <p style={{ margin: '8px 0 0 0' }}>
                      Easy returns accepted within 14 days of delivery. Silhouettes must remain unworn, unaltered, and intact with all primary security tags.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Slide-In Cart Drawer Overlay */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-head">
            <h3 className="cart-head-title">Your Atelier Bag</h3>
            <button className="btn-close-cart" onClick={() => setIsCartOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          <div className="cart-items-area">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <FiShoppingBag size={24} />
                <p className="cart-empty-label">Bag is Empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product._id} className="cart-item">
                  <img 
                    src={item.product.images?.[0]?.url} 
                    alt={item.product.title} 
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.product.title}</h4>
                    <span className="cart-item-price">
                      {getCurrencySymbol(item.product.price?.currency)}
                      {formatPrice(item.product.price?.amount)}
                    </span>
                    
                    <div className="cart-item-controls">
                      <div className="qty-row">
                        <button className="btn-qty-ctrl" onClick={() => updateCartQty(item.product._id, -1)}>
                          <FiMinus size={10} />
                        </button>
                        <span className="qty-num">{item.quantity}</span>
                        <button className="btn-qty-ctrl" onClick={() => updateCartQty(item.product._id, 1)}>
                          <FiPlus size={10} />
                        </button>
                      </div>
                      <button className="btn-remove" onClick={() => removeFromCart(item.product._id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-foot">
              <div className="cart-total-row">
                <span className="cart-total-label">Subtotal</span>
                <span className="cart-total-amount">
                  {cartCurrencySymbol}{formatPrice(cartTotal)}
                </span>
              </div>
              <button className="btn-checkout" onClick={() => alert("Checkout pipeline initialized.")}>
                Secure Checkout
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Productdetails
