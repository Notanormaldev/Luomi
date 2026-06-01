import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import { usecart } from '../../cart/hook/usecart'
import Logo from '../../auth/components/Logo'
import { 
  FiSearch, 
  FiShoppingBag, 
  FiSun, 
  FiMoon, 
  FiX, 
  FiPlus, 
  FiMinus, 
  FiArrowRight,
  FiUser
} from 'react-icons/fi'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const { handlegetallprodcuts } = useproduct()
  const { user } = useauth()
  const { items: cartItems, handleGetCart, handleAddToCart, handleUpdateCart, handleRemoveFromCart, handleCheckout } = usecart()

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'dark')
  
  // Catalog & UI States
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGender, setActiveGender] = useState('All')
  const [activeSub, setActiveSub] = useState('All')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  
  // Cart overlay state
  const [isCartOpen, setIsCartOpen] = useState(false)

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

  // Sync cart from cloud DB if logged in
  useEffect(() => {
    if (user) {
      handleGetCart()
    }
  }, [user])

  // Fetch all products
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true)
      try {
        await handlegetallprodcuts()
      } catch (err) {
        console.error("Failed to load storefront products:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllProducts()
  }, [])

  const allProducts = useSelector(state => state.product.products) || []



  // Cart Operations
  const addToCart = async (product) => {
    if (!user) {
      alert("Please log in to add items to your atelier bag.")
      navigate('/login')
      return
    }

    // Live Stock Validation
    const existing = cartItems.find(item => item.product._id === product._id && !item.selectedVariant)
    const currentQty = existing ? existing.quantity : 0
    const availableStock = product.stock || 0

    if (currentQty + 1 > availableStock) {
      alert(`Cannot add more. Only ${availableStock} items left in stock.`)
      return
    }

    const res = await handleAddToCart({ productId: product._id, quantity: 1 })
    if (res.success) {
      setIsCartOpen(true)
    } else {
      alert(res.error || "Failed to add to cart")
    }
  }

  const triggerCheckout = async () => {
    try {
      const res = await handleCheckout()
      if (res.success) {
        alert("Order placed successfully! Stock levels updated.")
        setIsCartOpen(false)
      } else {
        alert(res.error || "Checkout failed.")
      }
    } catch (err) {
      alert("Checkout failed.")
    }
  }

  const updateCartQty = async (productId, currentQty, delta, availableStock) => {
    if (delta > 0 && currentQty + 1 > availableStock) {
      alert(`Cannot add more. Only ${availableStock} items left in stock.`)
      return
    }
    const newQty = currentQty + delta
    if (newQty <= 0) {
      await handleRemoveFromCart({ productId })
    } else {
      await handleUpdateCart({ productId, quantity: newQty })
    }
  }

  const removeFromCart = async (productId) => {
    await handleRemoveFromCart({ productId })
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

  // Filter products by search, gender category, and subcategory
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.genderCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subCategory?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesGender = activeGender === 'All' || 
      (product.genderCategory && product.genderCategory.toLowerCase() === activeGender.toLowerCase())
      
    const matchesSub = activeSub === 'All' || 
      (product.subCategory && product.subCategory.toLowerCase() === activeSub.toLowerCase())

    return matchesSearch && matchesGender && matchesSub
  })

  // Calculate cart counts and totals
  const totalCartItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0)
  const cartTotal = cartItems.reduce((acc, curr) => {
    const amt = parseFloat(curr.product.price?.amount || 0)
    return acc + (isNaN(amt) ? 0 : amt) * curr.quantity
  }, 0)

  // Use primary currency from first item in cart or fallback
  const cartCurrencySymbol = cartItems.length > 0 ? getCurrencySymbol(cartItems[0].product.price?.currency) : '₹'

  const handleSelectProduct = (product) => {
    navigate(`/product/${product._id}`)
  }

  return (
    <div className="home-container">
      
      {/* Sticky Premium Navbar */}
      <div className="home-nav-container">
        <div className="home-navbar">
          
          <div className="nav-left">
            <Link to="/" className="no-underline">
              <Logo />
            </Link>
            <div className="nav-links">
              <span className="nav-link active">Collections</span>
              <span className="nav-link" onClick={() => navigate('/dashbord/seller')}>Atelier</span>
            </div>
          </div>

          {/* Minimal Search Bar */}
          <div className="search-bar-wrapper">
            <FiSearch size={15} className="search-icon-pos" />
            <input 
              type="text" 
              placeholder="Search catalog silhouettes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="search-input"
            />
            {searchQuery && isSearchFocused && (
              <>
                <div className="search-overlay-backdrop" onClick={() => setIsSearchFocused(false)} />
                <div className="search-dropdown-overlay">
                  <div className="search-dropdown-header">
                    <span>Matching Silhouettes ({filteredProducts.length})</span>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }} 
                      className="clear-search-btn"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="search-dropdown-results">
                    {filteredProducts.slice(0, 5).map(prod => (
                      <div 
                        key={prod._id} 
                        className="search-dropdown-item"
                        onClick={() => {
                          navigate(`/product/${prod._id}`);
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                      >
                        {prod.images && prod.images.length > 0 ? (
                          <img src={prod.images[0].url} alt={prod.title} className="search-item-thumb" />
                        ) : (
                          <div className="search-item-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-input)', fontSize: '8px' }}>LUOMI</div>
                        )}
                        <div className="search-item-info">
                          <span className="search-item-title">{prod.title}</span>
                          <span className="search-item-price">
                            {getCurrencySymbol(prod.price?.currency)}{formatPrice(prod.price?.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="search-no-results">No matching silhouettes found.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="nav-right">
            


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
                to="/settings" 
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

      <div className="home-wrapper">
        
        {/* Hero Banner Showcase */}
        <div className="home-hero-section">
          <div className="hero-editorial-banner">
            <div className="hero-content">
              <span className="hero-eyebrow">Maison Silhouette Collection</span>
              <h2 className="hero-headline">The Art of Silent Luxury</h2>
              <p className="hero-body">
                Minimal designs crafted by independent ateliers. Hand-tailored silhouetted lines, structured textures, and monochrome excellence.
              </p>
              <button className="btn-hero-cta" onClick={() => setActiveGender('Men')}>
                Discover Collection
              </button>
            </div>
            <div className="hero-art-block hidden md:flex">
              <span className="hero-art-label">LUOMI</span>
            </div>
          </div>
        </div>

        {/* Snitch-like Premium Gender Filter */}
        <div className="gender-filter-container">
          {['All', 'Men', 'Women', 'Kids', 'Unisex'].map(gender => (
            <button
              key={gender}
              className={`gender-filter-btn ${activeGender === gender ? 'active' : ''}`}
              onClick={() => {
                setActiveGender(gender)
                setActiveSub('All')
              }}
            >
              {gender}
            </button>
          ))}
        </div>

        {/* Snitch-like Subcategory Pills */}
        <div className="subcategory-pills-container">
          {['All', 'Shirt', 'T-Shirt', 'Pants', 'Cargos', 'Polos', 'Plus Size', 'Trouser', 'Jeans'].map(sub => (
            <button
              key={sub}
              className={`subcategory-pill-btn ${activeSub === sub ? 'active' : ''}`}
              onClick={() => setActiveSub(sub)}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="home-catalog-section">
          {loading ? (
            <div className="home-products-grid">
              {[1, 2, 4, 8].map((n) => (
                <div key={n} className="skeleton-card">
                  <div className="skeleton-shimmer"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="home-empty-state">
              <span className="empty-brand-mark">LUOMI</span>
              <p className="empty-primary">No pieces found</p>
              <p className="empty-secondary">
                No luxury silhouettes match your active filters or search terms. Try modifying your query.
              </p>
            </div>
          ) : (
            <div className="home-products-grid">
              {filteredProducts.map((product) => (
                <div key={product._id} className="home-product-card">
                  <div className="card-img-wrap" onClick={() => handleSelectProduct(product)}>
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]?.url} 
                        alt={product.title} 
                      />
                    ) : (
                      <div className="card-no-image">
                        <span className="card-no-image-label">LUOMI</span>
                      </div>
                    )}
                    <div className="card-stamp">LUXURY ORIGINAL</div>
                  </div>

                  <div className="card-body">
                    <span className="card-brand">LUOMI MAISON</span>
                    <h3 className="card-title" onClick={() => handleSelectProduct(product)}>
                      {product.title || 'Untitled Piece'}
                    </h3>
                    <p className="card-desc">
                      {product.description || 'Artisanal creation waiting to be discovered.'}
                    </p>

                    <div className="card-footer">
                      <div className="card-price">
                        <span className="card-currency">{getCurrencySymbol(product.price?.currency)}</span>
                        <span className="card-amount">{formatPrice(product.price?.amount)}</span>
                      </div>
                      <button 
                        className="btn-add-bag" 
                        onClick={() => addToCart(product)}
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Cart Drawer */}
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
              <button className="btn-checkout" onClick={triggerCheckout}>
                Secure Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)} onClick={()=>{
          navigate(`/product/${selectedProduct._id}`)
        }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
              <FiX size={15} />
            </button>
            
            <div className="modal-gallery">
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <>
                  <img 
                    src={selectedProduct.images[activeImgIndex]?.url || selectedProduct.images[0]?.url} 
                    alt={selectedProduct.title} 
                  />
                  {selectedProduct.images.length > 1 && (
                    <div className="modal-thumbs">
                      {selectedProduct.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`${selectedProduct.title} view ${idx + 1}`}
                          className={`modal-thumb ${activeImgIndex === idx ? 'active' : ''}`}
                          onClick={() => setActiveImgIndex(idx)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="modal-gallery-empty">
                  <span className="modal-gallery-label">LUOMI</span>
                </div>
              )}
            </div>

            <div className="modal-info">
              <span className="modal-brand-label">LUOMI MAISON</span>
              <h2 className="modal-title">{selectedProduct.title}</h2>
              
              <div className="modal-price-block">
                <span className="modal-currency">{getCurrencySymbol(selectedProduct.price?.currency)}</span>
                <span className="modal-price">{formatPrice(selectedProduct.price?.amount)}</span>
              </div>
              
              <p className="modal-desc-text">
                {selectedProduct.description || 'No detailed description provided for this creation.'}
              </p>

              <button 
                className="modal-add-btn" 
                onClick={() => {
                  addToCart(selectedProduct)
                  setSelectedProduct(null)
                }}
              >
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Home
