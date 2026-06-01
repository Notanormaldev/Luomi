import React, { useEffect, useRef, useState } from 'react'
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
  FiChevronRight,
  FiChevronLeft,
} from 'react-icons/fi'
import './Home.css'

/* ── Constants ──────────────────────── */
const CATEGORY_TABS = [
  { label: 'Discover',    value: 'All', sub: 'All' },
  { label: 'Shirts',      value: 'All', sub: 'shirt' },
  { label: 'T-Shirts',    value: 'All', sub: 't-shirt' },
  { label: 'Jeans',       value: 'All', sub: 'jeans' },
  { label: 'Trousers',    value: 'All', sub: 'trouser' },
  { label: 'Cargo Pants', value: 'All', sub: 'cargos' },
  { label: 'Polos',       value: 'All', sub: 'polos' },
  { label: 'Plus-Size',   value: 'All', sub: 'plus size' },
]

const FEATURED_CATS = [
  { label: 'SHIRTS',      sub: 'shirt',     tagline: 'Fresh & Sharp', defaultImg: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop' },
  { label: 'TROUSERS',    sub: 'trouser',   tagline: 'Clean Silhouette', defaultImg: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop' },
  { label: 'POLOS',       sub: 'polos',     tagline: 'Everyday Essential', defaultImg: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop' },
  { label: 'JEANS',       sub: 'jeans',     tagline: 'Effortlessly Cool', defaultImg: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop' },
  { label: 'CARGOS',      sub: 'cargos',    tagline: 'Street-Ready', defaultImg: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=600&auto=format&fit=crop' },
  { label: 'T-SHIRTS',    sub: 't-shirt',   tagline: 'Always On Trend', defaultImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop' },
]

const HERO_PANELS = [
  { sub: 'shirt',   headline: 'LINEN EDIT',    sub2: 'SOFT ON SKIN.\nSHARP ON STYLE.', defaultImg: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop' },
  { sub: 'jeans',   headline: 'DENIM DROP',    sub2: 'CLASSIC CUTS.\nMODERN FITS.', defaultImg: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop' },
  { sub: 't-shirt', headline: 'STREET SELECTS',sub2: 'KEEP IT SIMPLE.\nWEAR IT BOLD.', defaultImg: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop' },
]

const TOP_SEARCHES = ['Slim Fit Shirts', 'Black T-Shirts', 'Cargo Pants', 'Relaxed Jeans', 'Polo T-Shirts', 'Linen Shirts']

/* ── Component ──────────────────────── */
export default function Home() {
  const navigate   = useNavigate()
  const { handlegetallprodcuts } = useproduct()
  const { user }   = useauth()
  const { items: cartItems, handleGetCart, handleAddToCart, handleUpdateCart, handleRemoveFromCart, handleCheckout } = usecart()

  const [theme,           setTheme]           = useState(localStorage.getItem('luomi-theme') || 'light')
  const [loading,         setLoading]         = useState(true)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [activeTab,       setActiveTab]       = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isCartOpen,      setIsCartOpen]      = useState(false)
  const [isCatOpen,       setIsCatOpen]       = useState(false)
  const [heroIdx,         setHeroIdx]         = useState(0)  // for mobile hero carousel

  const searchRef = useRef(null)

  /* theme sync */
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

  useEffect(() => { if (user) handleGetCart() }, [user])

  useEffect(() => {
    const go = async () => {
      setLoading(true)
      try { await handlegetallprodcuts() }
      catch {}
      finally { setLoading(false) }
    }
    go()
  }, [])

  const allProducts = useSelector(s => s.product.products) || []

  /* helpers */
  const fmt = a => {
    if (a === undefined || a === null) return '0'
    const n = parseFloat(a)
    return isNaN(n) ? '0' : n.toLocaleString('en-IN')
  }

  /* pick first product for a sub-category (returns full product object) */
  const getSubProduct = (sub) => {
    return allProducts.find(x => x.subCategory?.toLowerCase() === sub.toLowerCase() && x.images?.length > 0) || null
  }

  /* Click handler to find product, navigate or fallback to tab filter */
  const handleHeroClick = (sub) => {
    const prod = getSubProduct(sub)
    if (prod) {
      navigate(`/product/${prod._id}`)
    } else {
      const tabIdx = CATEGORY_TABS.findIndex(t => t.sub.toLowerCase() === sub.toLowerCase())
      if (tabIdx !== -1) {
        setActiveTab(tabIdx)
        setTimeout(() => {
          document.querySelector('.sn-main')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }

  /* filter */
  const currentTab      = CATEGORY_TABS[activeTab]
  const filteredProducts = allProducts.filter(p => {
    const mSearch = !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const mGender = currentTab.value === 'All' || p.genderCategory?.toLowerCase() === currentTab.value.toLowerCase()
    const mSub    = currentTab.sub   === 'All' || p.subCategory?.toLowerCase() === currentTab.sub.toLowerCase()
    return mSearch && mGender && mSub
  })

  const searchResults = searchQuery
    ? allProducts.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  /* cart helpers */
  const totalItems = cartItems.reduce((a, c) => a + c.quantity, 0)
  const cartTotal  = cartItems.reduce((a, c) => {
    const v     = c.selectedVariant && c.product.variants ? c.product.variants.find(x => x._id === c.selectedVariant) : null
    const price = parseFloat((v?.price || c.product.price)?.amount || 0)
    return a + (isNaN(price) ? 0 : price) * c.quantity
  }, 0)

  const addToCart = async (product) => {
    if (!user) { navigate('/login'); return }
    const existing    = cartItems.find(i => i.product._id === product._id && !i.selectedVariant)
    const currentQty  = existing?.quantity || 0
    if (currentQty + 1 > (product.stock || 0)) { alert(`Only ${product.stock || 0} in stock`); return }
    const res = await handleAddToCart({ productId: product._id, quantity: 1 })
    if (res.success) setIsCartOpen(true)
    else alert(res.error || 'Failed')
  }

  const updateQty = async (productId, currentQty, delta, stock) => {
    if (delta > 0 && currentQty + 1 > stock) { alert(`Only ${stock} in stock`); return }
    const nq = currentQty + delta
    if (nq <= 0) await handleRemoveFromCart({ productId })
    else         await handleUpdateCart({ productId, quantity: nq })
  }

  const checkout = async () => {
    const res = await handleCheckout()
    if (res.success) { alert('Order placed!'); setIsCartOpen(false) }
    else alert(res.error || 'Checkout failed')
  }

  /* hero auto‑advance on mobile */
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_PANELS.length), 4500)
    return () => clearInterval(t)
  }, [])

  /* ── JSX ── */
  return (
    <div className="sn-home">

      {/* ════════════════ NAVBAR ════════════════ */}
      <div className="sn-navbar">
        <div className="sn-nav-inner">

          {/* left */}
          <div className="sn-nav-left">
            <button className="sn-icon-btn" onClick={() => setIsCatOpen(true)} aria-label="Menu">
              <FiMenu size={20} />
            </button>
            <Link to="/" className="sn-logo-link"><Logo /></Link>
          </div>

          {/* center tabs */}
          <nav className="sn-cat-tabs" aria-label="Categories">
            {CATEGORY_TABS.map((tab, i) => (
              <button
                key={tab.label}
                className={`sn-cat-tab${activeTab === i ? ' active' : ''}`}
                onClick={() => { setActiveTab(i); setSearchQuery('') }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* right */}
          <div className="sn-nav-right">
            {/* search */}
            <div className="sn-search-wrap" ref={searchRef}>
              <FiSearch size={15} className="sn-search-icon" />
              <input
                type="text"
                className="sn-search-input"
                placeholder='Search "POLO T-SHIRTS"'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={()  => setTimeout(() => setIsSearchFocused(false), 180)}
              />
              {searchQuery && (
                <button className="sn-search-clear" onClick={() => setSearchQuery('')}>
                  <FiX size={13} />
                </button>
              )}

              {/* dropdown */}
              {isSearchFocused && (
                <div className="sn-search-dropdown">
                  {!searchQuery ? (
                    <>
                      <p className="sn-dd-heading">TOP SEARCHES</p>
                      <div className="sn-top-searches">
                        {TOP_SEARCHES.map(s => (
                          <button key={s} className="sn-top-pill" onClick={() => setSearchQuery(s)}>{s}</button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="sn-dd-heading">RESULTS ({searchResults.length})</p>
                      {searchResults.length === 0
                        ? <p className="sn-dd-empty">No products for "{searchQuery}"</p>
                        : (
                          <div className="sn-dd-list">
                            {searchResults.map(p => (
                              <div key={p._id} className="sn-dd-item"
                                onClick={() => { navigate(`/product/${p._id}`); setSearchQuery(''); setIsSearchFocused(false) }}>
                                {p.images?.[0]?.url
                                  ? <img src={p.images[0].url} alt={p.title} className="sn-dd-img" />
                                  : <div className="sn-dd-img sn-dd-img-ph" />
                                }
                                <div className="sn-dd-info">
                                  <span className="sn-dd-title">{p.title}</span>
                                  <span className="sn-dd-price">₹{fmt(p.price?.amount)}</span>
                                </div>
                                <FiChevronRight size={13} style={{ color: 'var(--sn-text-subtle)', flexShrink: 0 }} />
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </>
                  )}
                </div>
              )}
            </div>

            {/* user */}
            {user
              ? <Link to="/settings" className="sn-icon-btn" title={user.fullname}><FiUser size={19} /></Link>
              : <Link to="/login"    className="sn-icon-btn"><FiUser size={19} /></Link>
            }

            {/* cart */}
            <button className="sn-icon-btn sn-cart-btn" onClick={() => setIsCartOpen(true)}>
              <FiShoppingBag size={19} />
              {totalItems > 0 && <span className="sn-cart-badge">{totalItems}</span>}
            </button>
          </div>
        </div>

        {/* mobile tabs */}
        <div className="sn-mobile-tabs" aria-label="Mobile categories">
          {CATEGORY_TABS.map((tab, i) => (
            <button
              key={tab.label}
              className={`sn-cat-tab${activeTab === i ? ' active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════ CATEGORY SIDEBAR ════════════════ */}
      {isCatOpen && (
        <div className="sn-cat-overlay" onClick={() => setIsCatOpen(false)}>
          <div className="sn-cat-sidebar" onClick={e => e.stopPropagation()}>
            <div className="sn-cat-sidebar-head">
              <button className="sn-icon-btn" onClick={() => setIsCatOpen(false)}><FiX size={20} /></button>
              <span className="sn-cat-sidebar-label">CATEGORIES</span>
            </div>
            <div className="sn-cat-sidebar-body">
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

      {/* ════════════════ HERO — only on Discover tab ════════════════ */}
      {activeTab === 0 && !searchQuery && (
        <>
          {/* 3-panel editorial hero (desktop) */}
          <section className="sn-hero" aria-label="Hero banners">
            {HERO_PANELS.map((panel, i) => {
              const prod = getSubProduct(panel.sub)
              return (
                <div
                  key={i}
                  className="sn-hero-panel"
                  onClick={() => handleHeroClick(panel.sub)}
                >
                  {/* real img tag so image always renders, using Unsplash lifestyle fallback */}
                  <img 
                    src={prod?.images?.[0]?.url || panel.defaultImg} 
                    alt={panel.headline} 
                    className="sn-hero-bg-img" 
                  />
                  <div className="sn-hero-overlay" />
                  <div className="sn-hero-text">
                    <p className="sn-hero-headline">{panel.headline}</p>
                    <p className="sn-hero-sub">{panel.sub2}</p>
                  </div>
                </div>
              )
            })}
          </section>

          {/* mobile hero carousel */}
          <section className="sn-hero-mobile" aria-label="Mobile hero">
            {HERO_PANELS.map((panel, i) => {
              const prod = getSubProduct(panel.sub)
              return (
                <div
                  key={i}
                  className={`sn-hero-slide${heroIdx === i ? ' active' : ''}`}
                  onClick={() => handleHeroClick(panel.sub)}
                >
                  <img 
                    src={prod?.images?.[0]?.url || panel.defaultImg} 
                    alt={panel.headline} 
                    className="sn-hero-bg-img" 
                  />
                  <div className="sn-hero-overlay" />
                  <div className="sn-hero-text">
                    <p className="sn-hero-headline">{panel.headline}</p>
                    <p className="sn-hero-sub">{panel.sub2}</p>
                  </div>
                </div>
              )
            })}
            {/* dots */}
            <div className="sn-hero-dots">
              {HERO_PANELS.map((_, i) => (
                <button key={i} className={`sn-hero-dot${heroIdx === i ? ' active' : ''}`} onClick={() => setHeroIdx(i)} />
              ))}
            </div>
            {/* arrows */}
            <button className="sn-hero-arrow left" onClick={() => setHeroIdx(i => (i - 1 + HERO_PANELS.length) % HERO_PANELS.length)}>
              <FiChevronLeft size={20} />
            </button>
            <button className="sn-hero-arrow right" onClick={() => setHeroIdx(i => (i + 1) % HERO_PANELS.length)}>
              <FiChevronRight size={20} />
            </button>
          </section>

          {/* ═══ FEATURED CATEGORIES ═══ */}
          <section className="sn-feat-cats" aria-label="Featured categories">
            <h2 className="sn-sect-title">FEATURED CATEGORIES</h2>
            <div className="sn-feat-grid">
              {FEATURED_CATS.map(cat => {
                const prod   = getSubProduct(cat.sub)
                return (
                  <div
                    key={cat.label}
                    className="sn-feat-card"
                    onClick={() => handleHeroClick(cat.sub)}
                  >
                    <div className="sn-feat-card-inner">
                      <img 
                        src={prod?.images?.[0]?.url || cat.defaultImg} 
                        alt={cat.label} 
                        className="sn-feat-img" 
                      />
                    </div>
                    <div className="sn-feat-label">
                      <span className="sn-feat-name">{cat.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* ════════════════ PRODUCT GRID ════════════════ */}
      <div className="sn-main">
        {(activeTab !== 0 || searchQuery) && (
          <div className="sn-filter-bar">
            <span className="sn-filter-count">
              {filteredProducts.length} Products
              {currentTab.label !== 'Discover' && ` — ${currentTab.label}`}
            </span>
          </div>
        )}

        {activeTab === 0 && !searchQuery && (
          <div className="sn-grid-header">
            <h2 className="sn-sect-title">NEW ARRIVALS</h2>
          </div>
        )}

        {loading ? (
          <div className="sn-grid">
            {[...Array(8)].map((_, n) => (
              <div key={n} className="sn-card-skeleton">
                <div className="sn-skeleton-img sn-shimmer" />
                <div className="sn-skeleton-line sn-shimmer" style={{ width: '70%', marginTop: 12 }} />
                <div className="sn-skeleton-line sn-shimmer" style={{ width: '40%', marginTop: 6 }} />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="sn-empty">
            <FiSearch size={32} style={{ opacity: .3 }} />
            <p>No products found</p>
            <button onClick={() => { setActiveTab(0); setSearchQuery('') }} className="sn-empty-reset">
              Show all products
            </button>
          </div>
        ) : (
          <div className="sn-grid">
            {filteredProducts.map(product => (
              <div key={product._id} className="sn-card" onClick={() => navigate(`/product/${product._id}`)}>
                <div className="sn-card-img-wrap">
                  {product.images?.[0]?.url
                    ? <img src={product.images[0].url} alt={product.title} className="sn-card-img" />
                    : <div className="sn-card-img-placeholder"><span>LUOMI</span></div>
                  }
                  {product.images?.[1]?.url && (
                    <img src={product.images[1].url} alt={product.title} className="sn-card-img sn-card-img-hover" />
                  )}
                  {/* ADD TO BAG hover CTA */}
                  <button
                    className="sn-card-atb"
                    onClick={e => { e.stopPropagation(); addToCart(product) }}
                  >
                    ADD TO BAG
                  </button>
                </div>
                <div className="sn-card-body">
                  <h3 className="sn-card-title">{product.title}</h3>
                  <span className="sn-card-price">₹{fmt(product.price?.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════ CART DRAWER ════════════════ */}
      <div className={`sn-cart-overlay${isCartOpen ? ' open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="sn-cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="sn-cart-head">
            <h3 className="sn-cart-title">Your Bag ({totalItems})</h3>
            <button className="sn-icon-btn" onClick={() => setIsCartOpen(false)}><FiX size={20} /></button>
          </div>

          <div className="sn-cart-body">
            {cartItems.length === 0 ? (
              <div className="sn-cart-empty">
                <FiShoppingBag size={32} />
                <p>Your bag is empty</p>
                <button className="sn-cart-empty-cta" onClick={() => setIsCartOpen(false)}>Continue Shopping</button>
              </div>
            ) : cartItems.map(item => {
              const v     = item.selectedVariant && item.product.variants ? item.product.variants.find(x => x._id === item.selectedVariant) : null
              const price = parseFloat((v?.price || item.product.price)?.amount || 0)
              const img   = v?.images?.[0]?.url || item.product.images?.[0]?.url
              const stock = v ? v.stock : (item.product.stock || 0)
              const key   = item.selectedVariant ? `${item.product._id}-${item.selectedVariant}` : item.product._id
              return (
                <div key={key} className="sn-cart-item">
                  {img && <img src={img} alt={item.product.title} className="sn-cart-item-img" />}
                  <div className="sn-cart-item-info">
                    <p className="sn-cart-item-name">{item.product.title}</p>
                    {v && <p className="sn-cart-item-variant">{Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' | ')}</p>}
                    <p className="sn-cart-item-price">₹{fmt(price)}</p>
                    <div className="sn-cart-item-controls">
                      <div className="sn-qty-row">
                        <button className="sn-qty-btn" onClick={() => updateQty(item.product._id, item.quantity, -1, stock)}><FiMinus size={12} /></button>
                        <span className="sn-qty-num">{item.quantity}</span>
                        <button className="sn-qty-btn" onClick={() => updateQty(item.product._id, item.quantity, 1,  stock)}><FiPlus  size={12} /></button>
                      </div>
                      <button className="sn-remove-btn" onClick={() => handleRemoveFromCart({ productId: item.product._id, variantId: item.selectedVariant })}>Remove</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {cartItems.length > 0 && (
            <div className="sn-cart-foot">
              <div className="sn-cart-total-row">
                <span>Subtotal</span>
                <span>₹{fmt(cartTotal)}</span>
              </div>
              <p className="sn-cart-note">Taxes and shipping calculated at checkout</p>
              <button className="sn-checkout-btn" onClick={checkout}>PROCEED TO CHECKOUT</button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
