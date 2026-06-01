import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import { usecart } from '../../cart/hook/usecart'
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
  FiRefreshCw,
  FiTruck,
  FiShield
} from 'react-icons/fi'
import './Productdetails.css'

function Productdetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { handlegetoneprodcut } = useproduct()
  const { user } = useauth()
  const { items: cartItems, handleGetCart, handleAddToCart, handleUpdateCart, handleRemoveFromCart } = usecart()

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'dark')
  
  // UI & Loading States
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  
  // Dynamic Selected Variant & Visual Assets
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [activeImgUrl, setActiveImgUrl] = useState('')

  // Accordion open/close state
  const [openTabs, setOpenTabs] = useState({
    specifications: true,
    delivery: false,
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('luomi-theme', theme)
  }, [theme])

  // Sync cart from cloud DB if logged in
  useEffect(() => {
    if (user) {
      handleGetCart()
    }
  }, [user])

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
          const prod = response.products
          setProduct(prod)
          
          const primaryImgs = prod.images ? prod.images.map(img => img.url) : []
          const variantImgs = prod.variants 
            ? prod.variants.reduce((acc, curr) => {
                if (curr.images) {
                  curr.images.forEach(img => {
                    if (img.url && !acc.includes(img.url)) acc.push(img.url)
                  })
                }
                return acc
              }, [])
            : []
          
          const allImages = [...primaryImgs, ...variantImgs]
          setGalleryImages(allImages)
          if (allImages.length > 0) {
            setActiveImgUrl(allImages[0])
          }


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
  const addToCart = async (productObj, selectedQty = 1, variantObj = null) => {
    if (!user) {
      alert("Please log in to add items to your atelier bag.")
      navigate('/login')
      return
    }
    if (!productObj) return
    const variantId = variantObj?._id || ''
    
    // Check available stock
    const availableStock = variantObj ? variantObj.stock : (productObj.stock || 0)

    const existing = cartItems.find(item => 
      item.product._id === productObj._id && 
      (variantId ? item.selectedVariant === variantId : !item.selectedVariant)
    )
    const currentQty = existing ? existing.quantity : 0

    if (currentQty + selectedQty > availableStock) {
      alert(`Cannot add more. Only ${availableStock} items left in stock. (You already have ${currentQty} in cart)`)
      return
    }

    const res = await handleAddToCart({ 
      productId: productObj._id, 
      quantity: selectedQty, 
      variantId: variantId || null 
    })
    if (res.success) {
      setIsCartOpen(true)
    } else {
      alert(res.error || "Failed to add to cart")
    }
  }

  const updateCartQty = async (productId, currentQty, delta, availableStock, variantId = null) => {
    if (delta > 0 && currentQty + 1 > availableStock) {
      alert(`Cannot add more. Only ${availableStock} items left in stock.`)
      return
    }
    const newQty = currentQty + delta
    if (newQty <= 0) {
      await handleRemoveFromCart({ productId, variantId })
    } else {
      await handleUpdateCart({ productId, quantity: newQty, variantId })
    }
  }

  const removeFromCart = async (productId, variantId = null) => {
    await handleRemoveFromCart({ productId, variantId })
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
  const totalCartItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0)
  const cartTotal = cartItems.reduce((acc, curr) => {
    const variantObj = curr.selectedVariant && curr.product.variants
      ? curr.product.variants.find(v => v._id === curr.selectedVariant)
      : null
    const priceObj = variantObj?.price || curr.product.price
    const amt = parseFloat(priceObj?.amount || 0)
    return acc + (isNaN(amt) ? 0 : amt) * curr.quantity
  }, 0)
  const cartCurrencySymbol = cartItems.length > 0 
    ? getCurrencySymbol(cartItems[0].product.price?.currency) 
    : '₹'

  // Calculate price comparison variables (Amazon/Flipkart inspired)
  const basePrice = product ? parseFloat(product.price?.amount || 0) : 0;
  const currentPrice = product ? parseFloat(selectedVariant?.price?.amount ?? product.price?.amount ?? 0) : 0;
  const hasDiscount = basePrice > 0 && currentPrice > 0 && basePrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((basePrice - currentPrice) / basePrice) * 100) : 0;
  const savingsAmt = hasDiscount ? (basePrice - currentPrice) : 0;

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant])

  const handlePageQtyChange = (delta) => {
    const availableStock = selectedVariant ? selectedVariant.stock : (product ? (product.stock || 0) : 0)
    const newQty = quantity + delta
    if (newQty < 1) return
    if (newQty > availableStock) {
      alert(`Only ${availableStock} items left in stock.`)
      return
    }
    setQuantity(newQty)
  }

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
          <div className="details-main-grid">
            
            {/* Column Left: High-End Photo Gallery */}
            <div className="details-gallery-section">
              <div className="main-image-viewport">
                {activeImgUrl ? (
                  <>
                    <img 
                      src={activeImgUrl} 
                      alt={product.title} 
                    />
                    {galleryImages.length > 1 && (
                      <>
                        <button 
                          className="gallery-nav-btn prev-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const currIdx = galleryImages.indexOf(activeImgUrl);
                            const nextIdx = (currIdx - 1 + galleryImages.length) % galleryImages.length;
                            setActiveImgUrl(galleryImages[nextIdx]);
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
                            const currIdx = galleryImages.indexOf(activeImgUrl);
                            const nextIdx = (currIdx + 1) % galleryImages.length;
                            setActiveImgUrl(galleryImages[nextIdx]);
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
              {galleryImages.length > 1 && (
                <div className="thumbnail-tray">
                  {galleryImages.map((imgUrl, idx) => (
                    <div 
                      key={idx} 
                      className={`thumbnail-wrapper ${activeImgUrl === imgUrl ? 'active' : ''}`}
                      onClick={() => setActiveImgUrl(imgUrl)}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${product.title} view ${idx + 1}`} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column Right: Product Info */}
            <div className="details-info-section">
              <div className="details-meta-labels">
                <span className="details-brand-tag">LUOMI MAISON</span>
                <h1 className="details-title">{product.title || 'Untitled Piece'}</h1>
              </div>

              {/* Price Display */}
              <div className="price-comparison-row">
                <div className="details-price-tag">
                  <span className="details-currency">
                    {getCurrencySymbol(selectedVariant?.price?.currency || product.price?.currency)}
                  </span>
                  <span className="details-amount">
                    {formatPrice(selectedVariant?.price?.amount ?? product.price?.amount)}
                  </span>
                </div>
                {hasDiscount && (
                  <>
                    <span className="details-original-price">
                      {getCurrencySymbol(product.price?.currency)}
                      {formatPrice(product.price?.amount)}
                    </span>
                    <span className="details-discount-badge">
                      Save {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="details-desc-area">
                {product.description || "Artisanal creation waiting to be discovered."}
              </div>

              {/* Variant Picker — Main Product + Variants */}
              <div className="variants-selector-container">
                <span className="qty-label">Select Option</span>
                <div className="variants-selector-grid">

                  {/* Main Product Card (Original / Base) */}
                  <div 
                    className={`variant-select-card ${!selectedVariant ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedVariant(null)
                      const mainImgs = product.images ? product.images.map(i => i.url) : []
                      setGalleryImages(mainImgs)
                      if (mainImgs.length > 0) setActiveImgUrl(mainImgs[0])
                    }}
                  >
                    {product.images?.[0]?.url && (
                      <img 
                        src={product.images[0].url} 
                        alt="Original" 
                        className="variant-mini-thumb"
                      />
                    )}
                    <div className="variant-card-info">
                      <div className="variant-select-header">
                        <span className="variant-select-name">Original</span>
                        {typeof product.stock === 'number' && product.stock <= 0 && <span className="variant-select-badge out-of-stock">Sold Out</span>}
                        {typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5 && <span className="variant-select-badge low-stock">{product.stock} left</span>}
                      </div>
                      <div className="variant-select-attributes">
                        <span className="variant-attr-pill">{product.images?.length || 0} images</span>
                      </div>
                      <div className="variant-select-price">
                        {getCurrencySymbol(product.price?.currency)}
                        {formatPrice(product.price?.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Actual Variants */}
                  {product.variants && product.variants.map((variant, idx) => {
                    const isSelected = selectedVariant?._id === variant._id
                    const miniThumb = variant.images?.[0]?.url || product.images?.[0]?.url
                    const attrSummary = Object.entries(variant.attributes || {})
                      .filter(([k]) => ['color', 'size'].includes(k.toLowerCase()))
                      .map(([, v]) => v)
                      .join(' / ')
                    
                    return (
                      <div 
                        key={variant._id || idx} 
                        className={`variant-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedVariant(variant)
                          const vImgs = variant.images ? variant.images.map(i => i.url) : []
                          const imgs = vImgs.length > 0 ? vImgs : (product.images ? product.images.map(i => i.url) : [])
                          setGalleryImages(imgs)
                          if (imgs.length > 0) setActiveImgUrl(imgs[0])
                        }}
                      >
                        {miniThumb && (
                          <img 
                            src={miniThumb} 
                            alt={attrSummary || `Variant ${idx + 1}`} 
                            className="variant-mini-thumb"
                          />
                        )}
                        <div className="variant-card-info">
                          <div className="variant-select-header">
                            <span className="variant-select-name">{attrSummary || `Option ${idx + 1}`}</span>
                            {variant.stock <= 0 && <span className="variant-select-badge out-of-stock">Sold Out</span>}
                            {variant.stock > 0 && variant.stock <= 5 && <span className="variant-select-badge low-stock">{variant.stock} left</span>}
                          </div>
                          <div className="variant-select-attributes">
                            {Object.entries(variant.attributes || {}).map(([key, val], aIdx) => (
                              <span key={aIdx} className="variant-attr-pill">
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                          <div className="variant-select-price">
                            {getCurrencySymbol(variant.price?.currency || product.price?.currency)}
                            {formatPrice(variant.price?.amount ?? product.price?.amount)}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                </div>
              </div>

              {/* Purchase Controls */}
              <div className="purchase-controls">
                <div className="qty-selection-row">
                  <span className="qty-label">Quantity</span>
                  <div className="qty-widget">
                    <button 
                      className="btn-qty-action" 
                      onClick={() => handlePageQtyChange(-1)}
                    >
                      <FiMinus size={11} />
                    </button>
                    <span className="qty-display">{quantity}</span>
                    <button 
                      className="btn-qty-action" 
                      onClick={() => handlePageQtyChange(1)}
                    >
                      <FiPlus size={11} />
                    </button>
                  </div>
                </div>

                <div className="cta-buttons-stack">
                  <button 
                    className="btn-add-bag-details"
                    disabled={selectedVariant ? selectedVariant.stock <= 0 : false}
                    onClick={() => addToCart(product, quantity, selectedVariant)}
                  >
                    {selectedVariant && selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}
                  </button>
                  <button 
                    className="btn-buy-now-details"
                    disabled={selectedVariant ? selectedVariant.stock <= 0 : false}
                    onClick={() => {
                      addToCart(product, quantity, selectedVariant)
                      setIsCartOpen(true)
                    }}
                  >
                    {selectedVariant && selectedVariant.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
                  </button>
                </div>
              </div>

              {/* Accordions */}
              <div className="details-tabs-accordions">
                <div className={`accordion-tab ${openTabs.specifications ? 'open' : ''}`}>
                  <button className="accordion-tab-head" onClick={() => toggleTab('specifications')}>
                    <span className="accordion-tab-title">Specifications</span>
                    <FiPlus size={12} className="accordion-tab-icon" />
                  </button>
                  <div className="accordion-tab-body">
                    <div className="specs-grid">
                      {selectedVariant && Object.entries(selectedVariant.attributes || {}).map(([key, val], i) => (
                        <React.Fragment key={i}>
                          <span className="specs-label">{key}</span>
                          <span className="specs-val">{val}</span>
                        </React.Fragment>
                      ))}
                      <span className="specs-label">Updated</span>
                      <span className="specs-val">{new Date(product.updatedAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className={`accordion-tab ${openTabs.delivery ? 'open' : ''}`}>
                  <button className="accordion-tab-head" onClick={() => toggleTab('delivery')}>
                    <span className="accordion-tab-title">Shipping & Returns</span>
                    <FiPlus size={12} className="accordion-tab-icon" />
                  </button>
                  <div className="accordion-tab-body">
                    <p style={{ margin: 0 }}>
                      Complementary courier shipping on all regional atelier creations. Express delivery arrives within 3-5 business days.
                    </p>
                    <p style={{ margin: '8px 0 0 0' }}>
                      Easy returns accepted within 14 days of delivery. Items must remain unworn and intact with all tags.
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
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <FiShoppingBag size={24} />
                <p className="cart-empty-label">Bag is Empty</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const variantObj = item.selectedVariant && item.product.variants
                  ? item.product.variants.find(v => v._id === item.selectedVariant)
                  : null

                const priceObj = variantObj?.price || item.product.price
                const imgUrl = variantObj?.images?.[0]?.url || item.product.images?.[0]?.url
                const availableStock = variantObj ? variantObj.stock : (item.product.stock || 0)
                const itemKey = item.selectedVariant 
                  ? `${item.product._id}-${item.selectedVariant}` 
                  : item.product._id

                return (
                  <div key={itemKey} className="cart-item">
                    <img 
                      src={imgUrl} 
                      alt={item.product.title} 
                      className="cart-item-thumb"
                    />
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.product.title}</h4>
                      
                      {variantObj && (
                        <div className="cart-item-variant-attrs" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '2px 0' }}>
                          {Object.entries(variantObj.attributes || {}).map(([key, val], aIdx) => (
                            <span key={aIdx} className="cart-item-attr-pill" style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--badge-bg)', border: '0.5px solid var(--border)', borderRadius: '100px', color: 'var(--text-muted)' }}>
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <span className="cart-item-price">
                        {getCurrencySymbol(priceObj?.currency)}
                        {formatPrice(priceObj?.amount)}
                      </span>
                      
                      <div className="cart-item-controls">
                        <div className="qty-row">
                          <button className="btn-qty-ctrl" onClick={() => updateCartQty(item.product._id, item.quantity, -1, availableStock, item.selectedVariant)}>
                            <FiMinus size={10} />
                          </button>
                          <span className="qty-num">{item.quantity}</span>
                          <button className="btn-qty-ctrl" onClick={() => updateCartQty(item.product._id, item.quantity, 1, availableStock, item.selectedVariant)}>
                            <FiPlus size={10} />
                          </button>
                        </div>
                        <button className="btn-remove" onClick={() => removeFromCart(item.product._id, item.selectedVariant)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {cartItems.length > 0 && (
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
