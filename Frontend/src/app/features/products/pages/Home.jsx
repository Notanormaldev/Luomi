import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
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

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'dark')
  
  // Catalog & UI States
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  
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

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Cart Operations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id)
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
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

  // Filter products by search and category
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Mock category categorization
    if (activeCategory === 'All') return matchesSearch
    if (activeCategory === 'Maison Pieces') {
      return matchesSearch && parseFloat(product.price?.amount || 0) > 500
    }
    if (activeCategory === 'Ready-To-Wear') {
      return matchesSearch && parseFloat(product.price?.amount || 0) <= 500
    }
    return matchesSearch
  })

  // Calculate cart counts and totals
  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const cartTotal = cart.reduce((acc, curr) => {
    const amt = parseFloat(curr.product.price?.amount || 0)
    return acc + (isNaN(amt) ? 0 : amt) * curr.quantity
  }, 0)

  // Use primary currency from first item in cart or fallback
  const cartCurrencySymbol = cart.length > 0 ? getCurrencySymbol(cart[0].product.price?.currency) : '₹'

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    setActiveImgIndex(0)
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
              className="search-input"
            />
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
              <button className="btn-hero-cta" onClick={() => setActiveCategory('Maison Pieces')}>
                Discover Collection
              </button>
            </div>
            <div className="hero-art-block hidden md:flex">
              <span className="hero-art-label">LUOMI</span>
            </div>
          </div>
        </div>

        {/* Filter Categories Row */}
        <div className="catalog-filters-row">
          <button 
            className={`btn-filter ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All Silhouettes
          </button>
          <button 
            className={`btn-filter ${activeCategory === 'Ready-To-Wear' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Ready-To-Wear')}
          >
            Ready-To-Wear
          </button>
          <button 
            className={`btn-filter ${activeCategory === 'Maison Pieces' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Maison Pieces')}
          >
            Maison Atelier Pieces
          </button>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
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
