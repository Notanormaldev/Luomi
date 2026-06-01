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
  FiX, 
  FiPlus, 
  FiMinus, 
  FiUser,
  FiMenu,
  FiChevronRight
} from 'react-icons/fi'
import './Home.css'

const CATEGORY_TABS = [
  { label: 'Discover', value: 'All', sub: 'All' },
  { label: 'Shirts', value: 'All', sub: 'shirt' },
  { label: 'T-Shirts', value: 'All', sub: 't-shirt' },
  { label: 'Jeans', value: 'All', sub: 'jeans' },
  { label: 'Trousers', value: 'All', sub: 'trouser' },
  { label: 'Cargo Pants', value: 'All', sub: 'cargos' },
  { label: 'Polos', value: 'All', sub: 'polos' },
  { label: 'Plus-Size', value: 'All', sub: 'plus size' },
]

const TOP_SEARCHES = [
  'Slim Fit Shirts', 'Black T-Shirts', 'Cargo Pants', 'Relaxed Jeans', 'Polo T-Shirts', 'Linen Shirts'
]

function Home() {
  const navigate = useNavigate()
  const { handlegetallprodcuts } = useproduct()
  const { user } = useauth()
  const { items: cartItems, handleGetCart, handleAddToCart, handleUpdateCart, handleRemoveFromCart, handleCheckout } = usecart()

  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCatOpen, setIsCatOpen] = useState(false)

  useEffect(() => {
    const syncTheme = () => {
      const t = localStorage.getItem('luomi-theme') || 'light'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    }
    syncTheme()
    window.addEventListener('theme-changed', syncTheme)
    return () => window.removeEventListener('theme-changed', syncTheme)
  }, [])

  useEffect(() => {
    if (user) handleGetCart()
  }, [user])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try { await handlegetallprodcuts() }
      catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const allProducts = useSelector(state => state.product.products) || []

  const addToCart = async (product) => {
    if (!user) { navigate('/login'); return }
    const existing = cartItems.find(i => i.product._id === product._id && !i.selectedVariant)
    const currentQty = existing ? existing.quantity : 0
    if (currentQty + 1 > (product.stock || 0)) {
      alert(`Only ${product.stock || 0} in stock`)
      return
    }
    const res = await handleAddToCart({ productId: product._id, quantity: 1 })
    if (res.success) setIsCartOpen(true)
    else alert(res.error || 'Failed')
  }

  const triggerCheckout = async () => {
    const res = await handleCheckout()
    if (res.success) { alert('Order placed!'); setIsCartOpen(false) }
    else alert(res.error || 'Checkout failed')
  }

  const updateCartQty = async (productId, currentQty, delta, availableStock) => {
    if (delta > 0 && currentQty + 1 > availableStock) { alert(`Only ${availableStock} in stock`); return }
    const newQty = currentQty + delta
    if (newQty <= 0) await handleRemoveFromCart({ productId })
    else await handleUpdateCart({ productId, quantity: newQty })
  }

  const fmt = (amount) => {
    if (!amount && amount !== 0) return '0'
    const n = parseFloat(amount)
    return isNaN(n) ? '0' : n.toLocaleString('en-IN')
  }

  // Filter by tab
  const currentTab = CATEGORY_TABS[activeTab]
  const filteredProducts = allProducts.filter(p => {
    const matchSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchGender = currentTab.value === 'All' || p.genderCategory?.toLowerCase() === currentTab.value.toLowerCase()
    const matchSub = currentTab.sub === 'All' || p.subCategory?.toLowerCase() === currentTab.sub.toLowerCase()
    return matchSearch && matchGender && matchSub
  })

  const searchResults = searchQuery
    ? allProducts.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const totalCartItems = cartItems.reduce((a, c) => a + c.quantity, 0)
  const cartTotal = cartItems.reduce((a, c) => {
    const v = c.selectedVariant && c.product.variants ? c.product.variants.find(x => x._id === c.selectedVariant) : null
    const price = parseFloat((v?.price || c.product.price)?.amount || 0)
    return a + (isNaN(price) ? 0 : price) * c.quantity
  }, 0)

  return (
    <div className="sn-home">

      {/* ── Navbar ── */}
      <div className="sn-navbar">
        <div className="sn-nav-inner">
          {/* Left: hamburger + logo */}
          <div className="sn-nav-left">
            <button className="sn-icon-btn" onClick={() => setIsCatOpen(true)} aria-label="Menu">
              <FiMenu size={20} />
            </button>
            <Link to="/" className="sn-logo-link">
              <Logo />
            </Link>
          </div>

          {/* Center: category tabs */}
          <nav className="sn-cat-tabs">
            {CATEGORY_TABS.map((tab, i) => (
              <button
                key={tab.label}
                className={`sn-cat-tab ${activeTab === i ? 'active' : ''}`}
                onClick={() => { setActiveTab(i); setSearchQuery('') }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: search + bag + user */}
          <div className="sn-nav-right">
            {/* Search */}
            <div className="sn-search-wrap">
              <FiSearch size={16} className="sn-search-icon" />
              <input
                type="text"
                className="sn-search-input"
                placeholder='Search products...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              {searchQuery && (
                <button className="sn-search-clear" onClick={() => setSearchQuery('')}>
                  <FiX size={14} />
                </button>
              )}

              {/* Search Dropdown */}
              {isSearchFocused && (
                <div className="sn-search-dropdown">
                  {!searchQuery ? (
                    <>
                      <div className="sn-search-section-title">TOP SEARCHES</div>
                      <div className="sn-top-searches">
                        {TOP_SEARCHES.map(s => (
                          <button key={s} className="sn-top-search-pill"
                            onClick={() => setSearchQuery(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sn-search-section-title">RESULTS ({searchResults.length})</div>
                      {searchResults.length === 0 ? (
                        <div className="sn-search-empty">No products found for "{searchQuery}"</div>
                      ) : (
                        <div className="sn-search-results-list">
                          {searchResults.map(p => (
                            <div key={p._id} className="sn-search-result-item"
                              onClick={() => { navigate(`/product/${p._id}`); setSearchQuery(''); setIsSearchFocused(false) }}>
                              <img
                                src={p.images?.[0]?.url}
                                alt={p.title}
                                className="sn-search-result-img"
                              />
                              <div className="sn-search-result-info">
                                <span className="sn-search-result-title">{p.title}</span>
                                <span className="sn-search-result-price">₹{fmt(p.price?.amount)}</span>
                              </div>
                              <FiChevronRight size={14} className="sn-search-result-arrow" />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User */}
            {user ? (
              <Link to="/settings" className="sn-icon-btn" title={user.fullname}>
                <FiUser size={19} />
              </Link>
            ) : (
              <Link to="/login" className="sn-icon-btn">
                <FiUser size={19} />
              </Link>
            )}

            {/* Cart */}
            <button className="sn-icon-btn sn-cart-btn" onClick={() => setIsCartOpen(true)}>
              <FiShoppingBag size={19} />
              {totalCartItems > 0 && <span className="sn-cart-badge">{totalCartItems}</span>}
            </button>
          </div>
        </div>

        {/* Mobile category scroll */}
        <div className="sn-mobile-tabs">
          {CATEGORY_TABS.map((tab, i) => (
            <button
              key={tab.label}
              className={`sn-cat-tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Sidebar ── */}
      {isCatOpen && (
        <div className="sn-cat-overlay" onClick={() => setIsCatOpen(false)}>
          <div className="sn-cat-sidebar" onClick={e => e.stopPropagation()}>
            <div className="sn-cat-sidebar-head">
              <button className="sn-icon-btn" onClick={() => setIsCatOpen(false)}><FiX size={20}/></button>
              <span className="sn-cat-sidebar-title">CATEGORIES</span>
            </div>
            <div className="sn-cat-sidebar-links">
              {CATEGORY_TABS.map((tab, i) => (
                <button key={tab.label} className="sn-cat-sidebar-link"
                  onClick={() => { setActiveTab(i); setIsCatOpen(false) }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="sn-main">

        {/* Active filter label */}
        <div className="sn-filter-bar">
          <span className="sn-filter-count">
            {filteredProducts.length} Products
            {currentTab.label !== 'Discover' && ` — ${currentTab.label}`}
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="sn-grid">
            {[1,2,3,4,5,6,7,8].map(n => (
              <div key={n} className="sn-card-skeleton">
                <div className="sn-skeleton-img sn-shimmer"></div>
                <div className="sn-skeleton-line sn-shimmer" style={{width:'70%',marginTop:'12px'}}></div>
                <div className="sn-skeleton-line sn-shimmer" style={{width:'40%',marginTop:'6px'}}></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="sn-empty">
            <FiSearch size={32} style={{opacity:0.3}} />
            <p>No products found</p>
            <button onClick={() => { setActiveTab(0); setSearchQuery('') }} className="sn-empty-reset">Show all products</button>
          </div>
        ) : (
          <div className="sn-grid">
            {filteredProducts.map(product => (
              <div key={product._id} className="sn-card" onClick={() => navigate(`/product/${product._id}`)}>
                {/* Image */}
                <div className="sn-card-img-wrap">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.title} className="sn-card-img" />
                  ) : (
                    <div className="sn-card-img-placeholder">
                      <span>LUOMI</span>
                    </div>
                  )}
                  {/* Hover second image */}
                  {product.images?.[1]?.url && (
                    <img src={product.images[1].url} alt={product.title} className="sn-card-img sn-card-img-hover" />
                  )}
                  {/* Color dots */}
                  {product.variants && product.variants.length > 0 && (() => {
                    const colors = [...new Set(product.variants.map(v => {
                      const attrs = v.attributes || {}
                      return Object.entries(attrs).find(([k]) => k.toLowerCase() === 'color')?.[1]
                    }).filter(Boolean))]
                    return colors.length > 1 ? (
                      <div className="sn-card-colors">
                        {colors.slice(0,4).map(c => (
                          <span key={c} className="sn-card-color-dot" title={c}></span>
                        ))}
                        {colors.length > 4 && <span className="sn-card-color-more">+{colors.length - 4}</span>}
                      </div>
                    ) : null
                  })()}
                </div>

                {/* Info */}
                <div className="sn-card-body">
                  <h3 className="sn-card-title">{product.title}</h3>
                  <div className="sn-card-price-row">
                    <span className="sn-card-price">₹{fmt(product.price?.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cart Drawer ── */}
      <div className={`sn-cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="sn-cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="sn-cart-head">
            <h3 className="sn-cart-title">Your Bag ({totalCartItems})</h3>
            <button className="sn-icon-btn" onClick={() => setIsCartOpen(false)}><FiX size={20}/></button>
          </div>

          <div className="sn-cart-body">
            {cartItems.length === 0 ? (
              <div className="sn-cart-empty">
                <FiShoppingBag size={32} />
                <p>Your bag is empty</p>
                <button onClick={() => setIsCartOpen(false)} className="sn-cart-empty-cta">Continue Shopping</button>
              </div>
            ) : (
              cartItems.map(item => {
                const v = item.selectedVariant && item.product.variants
                  ? item.product.variants.find(x => x._id === item.selectedVariant)
                  : null
                const price = parseFloat((v?.price || item.product.price)?.amount || 0)
                const img = v?.images?.[0]?.url || item.product.images?.[0]?.url
                const stock = v ? v.stock : (item.product.stock || 0)
                const key = item.selectedVariant ? `${item.product._id}-${item.selectedVariant}` : item.product._id
                return (
                  <div key={key} className="sn-cart-item">
                    <img src={img} alt={item.product.title} className="sn-cart-item-img" />
                    <div className="sn-cart-item-info">
                      <p className="sn-cart-item-name">{item.product.title}</p>
                      {v && (
                        <p className="sn-cart-item-variant">
                          {Object.entries(v.attributes || {}).map(([k,val]) => `${k}: ${val}`).join(' | ')}
                        </p>
                      )}
                      <p className="sn-cart-item-price">₹{fmt(price)}</p>
                      <div className="sn-cart-item-controls">
                        <div className="sn-qty-row">
                          <button className="sn-qty-btn" onClick={() => updateCartQty(item.product._id, item.quantity, -1, stock)}>
                            <FiMinus size={12}/>
                          </button>
                          <span className="sn-qty-num">{item.quantity}</span>
                          <button className="sn-qty-btn" onClick={() => updateCartQty(item.product._id, item.quantity, 1, stock)}>
                            <FiPlus size={12}/>
                          </button>
                        </div>
                        <button className="sn-remove-btn" onClick={() => handleRemoveFromCart({ productId: item.product._id, variantId: item.selectedVariant })}>
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
            <div className="sn-cart-foot">
              <div className="sn-cart-total-row">
                <span>Subtotal</span>
                <span>₹{fmt(cartTotal)}</span>
              </div>
              <p className="sn-cart-note">Taxes and shipping calculated at checkout</p>
              <button className="sn-checkout-btn" onClick={triggerCheckout}>
                PROCEED TO CHECKOUT
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Home
