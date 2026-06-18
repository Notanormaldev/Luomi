import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  FiHeart,
  FiLogOut
} from 'react-icons/fi'
import { usewishlist } from '../../wishlist/hook/usewishlist'
import './Home.css'

/* ── Constants ──────────────────────── */
const CATEGORY_TABS = [
  { label: 'Discover', value: 'All', sub: 'All' },
  { label: 'Shirts', value: 'All', sub: 'shirt' },
  { label: 'T-Shirts', value: 'All', sub: 't-shirt' },
  { label: 'Jeans', value: 'All', sub: 'jeans' },
  { label: 'Trousers', value: 'All', sub: 'trouser' },
  { label: 'Cargo Pants', value: 'All', sub: 'cargos' },
  { label: 'Polos', value: 'All', sub: 'polos' },
  { label: 'Hoodies', value: 'All', sub: 'hoodies' },
  { label: 'Sweatshirts', value: 'All', sub: 'sweatshirts' },
  { label: 'Shorts', value: 'All', sub: 'shorts' },
  { label: 'Activewear', value: 'All', sub: 'activewear' },
  { label: 'Plus-Size', value: 'All', sub: 'plus size' }
]

const SHOP_BY_CATS = [
  { label: 'Shirts', sub: 'shirt', img: '/cat_shirt.png', tabIndex: 1 },
  { label: 'T-Shirts', sub: 't-shirt', img: '/cat_tshirts.png', tabIndex: 2 },
  { label: 'Jeans', sub: 'jeans', img: '/cat_jeans.png', tabIndex: 3 },
  { label: 'Trousers', sub: 'trouser', img: '/cat_trousers.png', tabIndex: 4 },
  { label: 'Cargo Pants', sub: 'cargos', img: '/cat_cargos.png', tabIndex: 5 },
  { label: 'Polos', sub: 'polos', img: '/cat_polos.png', tabIndex: 6 },
  { label: 'Hoodies', sub: 'hoodies', img: '/cat_hoodies.png', tabIndex: 7 },
  { label: 'Sweatshirts', sub: 'sweatshirts', img: '/cat_sweatshirts.png', tabIndex: 8 },
  { label: 'Shorts', sub: 'shorts', img: '/cat_shorts.png', tabIndex: 9 },
  { label: 'Activewear', sub: 'activewear', img: '/cat_activewear.png', tabIndex: 10 }
]

const HERO_PANELS = [
  { sub: 'polos', headline: 'THE POLO ATELIER', sub2: 'CELEB-STYLED KNITS. REFINED SPORT AESTHETIC.', img: '/hero_polo.png' },
  { sub: 'jeans', headline: 'DENIM ESCAPE', sub2: 'PREMIUM COZY CUTS. STRETCH & STRUCTURE.', img: '/hero_denim.png' },
  { sub: 'shirt', headline: 'SHIRTING & LINENS', sub2: 'EFFORTLESS LUXURY. ORGANIC FABRICS.', img: '/hero_linen.png' },
  { sub: 't-shirt', headline: 'GRAPHIC LUXE TEES', sub2: 'STREET CULTURE STYLE. HEAVYWEIGHT COTTON.', img: '/hero_streetwear.png' },
]

const TOP_SEARCHES = ['Slim Fit Shirts', 'Black T-Shirts', 'Cargo Pants', 'Relaxed Jeans', 'Polo T-Shirts', 'Linen Shirts']

const PLACEHOLDERS = [
  'Search "Shirts"',
  'Search "Jeans"',
  'Search "Polos"',
  'Search "Cargos"',
  'Search "T-Shirts"',
  'Search "Trousers"'
]

/* ── Component ──────────────────────── */
export default function Home() {
  const navigate = useNavigate()
  const { handlegetallprodcuts } = useproduct()
  const { user, handlelogout } = useauth()
  const { items: cartItems, handleGetCart, handleAddToCart } = usecart()
  const { handleGetWishlist, handleToggleWishlist, isWishlisted } = usewishlist()

  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || ''
  const genderParam = searchParams.get('gender') || 'All'
  const browseParam = searchParams.get('browse') === 'true'

  const selectedGender = genderParam
  const isBrowsing = browseParam || !!categoryParam || !!searchParams.get('q')

  const activeTab = categoryParam
    ? Math.max(0, CATEGORY_TABS.findIndex(t => t.sub.toLowerCase() === categoryParam.toLowerCase()))
    : 0

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [isCatOpen, setIsCatOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  const searchRef = useRef(null)

  // Keep local search input query in sync with URL changes (e.g. Back button)
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  const handleGenderChange = (g) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (g === 'All') {
        next.delete('gender')
      } else {
        next.set('gender', g)
      }
      return next
    })
  }

  const handleCategoryTabClick = (index) => {
    const tab = CATEGORY_TABS[index]
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (index === 0) {
        next.delete('category')
        next.delete('browse')
      } else {
        next.set('category', tab.sub)
        next.set('browse', 'true')
      }
      return next
    })
  }

  const handleHeroClick = (sub) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('category', sub)
      next.set('browse', 'true')
      return next
    })
    window.scrollTo(0, 0)
  }

  const handleSearchInputChange = (val) => {
    setSearchQuery(val)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (!val) {
        next.delete('q')
      } else {
        next.set('q', val)
      }
      return next
    }, { replace: true })
  }

  const handleSearchSelect = (val) => {
    setSearchQuery(val)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('q', val)
      return next
    })
  }

  const handleViewAll = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('browse', 'true')
      next.delete('category')
      return next
    })
  }

  const handleReset = () => {
    setSearchParams(new URLSearchParams())
    setSearchQuery('')
  }

  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

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

  useEffect(() => {
    if (user) {
      if (user.role === 'delivery') {
        navigate('/dashbord/delivery')
        return
      }
      handleGetCart()
      handleGetWishlist()
    }
  }, [user, navigate])

  useEffect(() => {
    const go = async () => {
      setLoading(true)
      try { await handlegetallprodcuts() }
      catch { }
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

  /* filter */
  const currentTab = CATEGORY_TABS[activeTab]
  const filteredProducts = allProducts.filter(p => {
    const mGender = selectedGender === 'All' || p.genderCategory?.toLowerCase() === selectedGender.toLowerCase()
    const mSub = currentTab.sub === 'All' || p.subCategory?.toLowerCase() === currentTab.sub.toLowerCase()
    if (!mGender || !mSub) return false

    if (!searchQuery) return true

    const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    return queryTerms.every(term => {
      const title = (p.title || "").toLowerCase()
      const sub = (p.subCategory || "").toLowerCase()
      const desc = (p.description || "").toLowerCase()

      return title.includes(term) ||
        sub.includes(term) ||
        desc.includes(term) ||
        (term.endsWith('s') && (title.includes(term.slice(0, -1)) || sub.includes(term.slice(0, -1)) || desc.includes(term.slice(0, -1)))) ||
        (!term.endsWith('s') && (title.includes(term + 's') || sub.includes(term + 's') || desc.includes(term + 's')))
    })
  })

  const searchResults = searchQuery
    ? allProducts.filter(p => {
      const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
      return queryTerms.every(term => {
        const title = (p.title || "").toLowerCase()
        const sub = (p.subCategory || "").toLowerCase()
        const desc = (p.description || "").toLowerCase()

        return title.includes(term) ||
          sub.includes(term) ||
          desc.includes(term) ||
          (term.endsWith('s') && (title.includes(term.slice(0, -1)) || sub.includes(term.slice(0, -1)) || desc.includes(term.slice(0, -1)))) ||
          (!term.endsWith('s') && (title.includes(term + 's') || sub.includes(term + 's') || desc.includes(term + 's')))
      })
    }).slice(0, 8)
    : []

  /* cart helpers */
  const totalItems = cartItems.reduce((a, c) => a + c.quantity, 0)

  const addToCart = async (product) => {
    if (!user) { navigate('/login'); return }
    // Products with variants need size/color selection — redirect to detail page
    if (product.variants && product.variants.length > 0) {
      navigate(`/product/${product._id}`)
      return
    }
    const existing = cartItems.find(i => i.product._id === product._id && !i.selectedVariant)
    const currentQty = existing?.quantity || 0
    const stock = product.stock ?? 0
    if (stock > 0 && currentQty + 1 > stock) { setToastMsg(`Only ${stock} in stock`); setTimeout(() => setToastMsg(null), 3000); return }
    const res = await handleAddToCart({ productId: product._id, quantity: 1 })
    if (res.success) {
      setToastMsg(`"${product.title}" added to your bag`)
      setTimeout(() => setToastMsg(null), 3000)
    } else {
      setToastMsg(res.error || 'Failed to add to bag')
      setTimeout(() => setToastMsg(null), 3000)
    }
  }

  /* hero auto‑advance */
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_PANELS.length), 4500)
    return () => clearInterval(t)
  }, [])

  /* ── JSX ── */
  if (loading) {
    return (
      <div className="lh-page-loader">
        <div className="lh-nano-bar"></div>
        <h1 className="lh-loader-logo">LUOMI</h1>
      </div>
    )
  }

  return (
    <div className="lh-home">

      {/* ════════════════ NAVBAR ════════════════ */}
      <div className="lh-navbar">
        {/* Mobile-only Search Bar Overlay */}
        {isMobileSearchOpen && (
          <div className="lh-mobile-search-bar" ref={searchRef}>
            <div className="lh-mobile-search-input-wrap">
              <FiSearch size={18} className="lh-mobile-search-icon" />
              <input
                type="text"
                autoFocus
                className="lh-mobile-search-input"
                placeholder={PLACEHOLDERS[placeholderIdx]}
                value={searchQuery}
                onChange={e => handleSearchInputChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
              />
              {searchQuery && (
                <button className="lh-mobile-search-clear" onClick={() => handleSearchInputChange('')}>
                  <FiX size={15} />
                </button>
              )}
            </div>
            <button 
              className="lh-mobile-search-cancel" 
              onClick={() => { setIsMobileSearchOpen(false); handleSearchInputChange(''); setIsSearchFocused(false); }}
            >
              Cancel
            </button>

            {/* Mobile Search dropdown */}
            {isSearchFocused && (
              <div className="lh-search-dropdown">
                {!searchQuery ? (
                  <>
                    <p className="lh-dd-heading">TOP SEARCHES</p>
                    <div className="lh-top-searches">
                      {TOP_SEARCHES.map(s => (
                        <button key={s} className="lh-top-pill" onClick={() => handleSearchSelect(s)}>{s}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="lh-dd-heading">RESULTS ({searchResults.length})</p>
                    {searchResults.length === 0
                      ? <p className="lh-dd-empty">No products for "{searchQuery}"</p>
                      : (
                        <div className="lh-dd-list">
                          {searchResults.map(p => (
                            <div key={p._id} className="lh-dd-item"
                              onClick={() => { navigate(`/product/${p._id}`); handleSearchInputChange(''); setIsMobileSearchOpen(false); setIsSearchFocused(false) }}>
                              {p.images?.[0]?.url
                                ? <img src={p.images[0].url} alt={p.title} className="lh-dd-img" />
                                : <div className="lh-dd-img lh-dd-img-ph" />
                              }
                              <div className="lh-dd-info">
                                <span className="lh-dd-title">{p.title}</span>
                                <span className="lh-dd-price">₹{fmt(p.price?.amount)}</span>
                              </div>
                              <FiChevronRight size={13} style={{ color: 'var(--lh-text-muted)', flexShrink: 0 }} />
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
        )}

        <div className="lh-nav-inner">
          {/* Left: Menu button */}
          <div className="lh-nav-left">
            <button className="lh-nav-action-btn lh-menu-btn" onClick={() => setIsCatOpen(true)} aria-label="Menu" style={{ paddingLeft: 0, marginLeft: '-8px' }}>
              <FiMenu size={24} />
            </button>
          </div>

          {/* Center: Logo */}
          <div className="lh-nav-center">
            <Link to="/" className="lh-logo-link" onClick={handleReset}><Logo /></Link>
          </div>

          {/* Right: Actions */}
          <div className="lh-nav-right">
            {/* Desktop-only Search input */}
            <div className="lh-search-wrap desktop-only-search" ref={searchRef}>
              <FiSearch size={15} className="lh-search-icon" />
              <input
                type="text"
                className="lh-search-input"
                placeholder={PLACEHOLDERS[placeholderIdx]}
                value={searchQuery}
                onChange={e => handleSearchInputChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
              />
              {searchQuery && (
                <button className="lh-search-clear" onClick={() => handleSearchInputChange('')}>
                  <FiX size={13} />
                </button>
              )}

              {/* Search dropdown */}
              {isSearchFocused && (
                <div className="lh-search-dropdown">
                  {!searchQuery ? (
                    <>
                      <p className="lh-dd-heading">TOP SEARCHES</p>
                      <div className="lh-top-searches">
                        {TOP_SEARCHES.map(s => (
                          <button key={s} className="lh-top-pill" onClick={() => handleSearchSelect(s)}>{s}</button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="lh-dd-heading">RESULTS ({searchResults.length})</p>
                      {searchResults.length === 0
                        ? <p className="lh-dd-empty">No products for "{searchQuery}"</p>
                        : (
                          <div className="lh-dd-list">
                            {searchResults.map(p => (
                              <div key={p._id} className="lh-dd-item"
                                onClick={() => { navigate(`/product/${p._id}`); handleSearchInputChange(''); setIsSearchFocused(false) }}>
                                {p.images?.[0]?.url
                                  ? <img src={p.images[0].url} alt={p.title} className="lh-dd-img" />
                                  : <div className="lh-dd-img lh-dd-img-ph" />
                                }
                                <div className="lh-dd-info">
                                  <span className="lh-dd-title">{p.title}</span>
                                  <span className="lh-dd-price">₹{fmt(p.price?.amount)}</span>
                                </div>
                                <FiChevronRight size={13} style={{ color: 'var(--lh-text-muted)', flexShrink: 0 }} />
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

            {/* Mobile-only Search Button */}
            <button 
              className="lh-icon-btn mobile-only-search-btn" 
              onClick={() => setIsMobileSearchOpen(true)}
              title="Search"
            >
              <FiSearch size={19} />
            </button>

            {user?.role === 'seller' && (
              <Link to="/dashbord/seller" className="lh-dashboard-link" title="Go to Seller Atelier Dashboard">
                Atelier
              </Link>
            )}

            {user
              ? <Link to="/settings" className="lh-icon-btn" title={user.fullname}><FiUser size={19} /></Link>
              : <Link to="/login" className="lh-icon-btn"><FiUser size={19} /></Link>
            }

            <Link to="/wishlist" className="lh-icon-btn" title="Wishlist">
              <FiHeart size={19} />
            </Link>

            <button className="lh-icon-btn lh-cart-btn" onClick={() => navigate('/cart')}>
              <FiShoppingBag size={19} />
              {totalItems > 0 && <span className="lh-cart-badge">{totalItems}</span>}
            </button>
          </div>
        </div>

        {/* Gender Bar & Category Bar (Only visible in browse/search mode) */}
        {(isBrowsing || searchQuery) && (
          <div className="lh-filter-strip">
            <div className="lh-gender-bar">
              {['All', 'Men', 'Women', 'Kids', 'Unisex'].map(g => (
                <button
                  key={g}
                  className={`lh-gender-btn ${selectedGender === g ? 'active' : ''}`}
                  onClick={() => { handleGenderChange(g); }}
                >
                  {g === 'All' ? 'ALL ATELIER' : g.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="lh-cat-bar" aria-label="Product categories">
              {CATEGORY_TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  className={`lh-cat-btn ${activeTab === i ? 'active' : ''}`}
                  onClick={() => handleCategoryTabClick(i)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════ CATEGORY SIDEBAR ════════════════ */}
      <div className={`lh-cat-overlay ${isCatOpen ? 'open' : ''}`} onClick={() => setIsCatOpen(false)}>
        <div className="lh-cat-sidebar" onClick={e => e.stopPropagation()}>
          <div className="lh-cat-sidebar-head">
            <button className="lh-icon-btn" onClick={() => setIsCatOpen(false)}><FiX size={20} /></button>
            <span className="lh-cat-sidebar-label">LUOMI ATELIER</span>
          </div>
          <div className="lh-cat-sidebar-body">
            {user?.role === 'seller' && (
              <button className="lh-cat-sidebar-link-btn"
                onClick={() => { navigate('/dashbord/seller'); setIsCatOpen(false); }}>
                ATELIER DASHBOARD
              </button>
            )}
            <p className="lh-sidebar-section-title">SECTIONS</p>
            {['All', 'Men', 'Women', 'Kids', 'Unisex'].map(g => (
              <button
                key={g}
                className={`lh-cat-sidebar-link ${selectedGender === g ? 'active' : ''}`}
                onClick={() => {
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev)
                    if (g === 'All') next.delete('gender')
                    else next.set('gender', g)
                    next.set('browse', 'true')
                    return next
                  })
                  setIsCatOpen(false)
                }}
              >
                {g === 'All' ? 'ALL ATELIER' : g.toUpperCase()}
              </button>
            ))}
            <div className="lh-sidebar-divider" />
            <p className="lh-sidebar-section-title">CATEGORIES</p>
            {CATEGORY_TABS.map((tab, i) => (
              <button key={tab.label} className="lh-cat-sidebar-link"
                onClick={() => {
                  handleCategoryTabClick(i);
                  setIsCatOpen(false);
                  handleSearchInputChange('');
                }}>
                {tab.label}
              </button>
            ))}
            <div className="lh-sidebar-divider" />
            <p className="lh-sidebar-section-title">ACCOUNT</p>
            {user ? (
              <>
                <div className="lh-cat-sidebar-user-info">
                  Logged in as <strong className="lh-sidebar-username">{user.fullname}</strong>
                </div>
                <button className="lh-cat-sidebar-link"
                  onClick={() => { navigate('/settings'); setIsCatOpen(false); }}>
                  <FiUser size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Settings & Profile
                </button>
                <button className="lh-cat-sidebar-link"
                  onClick={async () => { await handlelogout(); navigate('/'); setIsCatOpen(false); }}>
                  <FiLogOut size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Log Out
                </button>
              </>
            ) : (
              <button className="lh-cat-sidebar-link"
                onClick={() => { navigate('/login'); setIsCatOpen(false); }}>
                <FiUser size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Log In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════ EDITORIAL HOME PAGE ════════════════ */}
      {!isBrowsing && !searchQuery && (
        <div className="lh-editorial-homepage">
          {/* 1. Hero Carousel */}
          <section className="lh-hero-carousel" aria-label="Hero carousel">
            {HERO_PANELS.map((panel, i) => {
              const isActive = heroIdx === i
              return (
                <div
                  key={i}
                  className={`lh-hero-slide ${isActive ? 'active' : ''}`}
                  onClick={() => handleHeroClick(panel.sub)}
                >
                  <img
                    src={panel.img}
                    alt={panel.headline}
                    className="lh-hero-slide-img"
                  />
                  <div className="lh-hero-slide-overlay" />
                  <div className="lh-hero-slide-content">
                    <p className="lh-hero-slide-subtitle">TRENDING COLLECTION</p>
                    <h2 className="lh-hero-slide-title">{panel.headline}</h2>
                    <p className="lh-hero-slide-desc">{panel.sub2}</p>
                    <button className="lh-hero-slide-cta">SHOP COLLECTION</button>
                  </div>
                </div>
              )
            })}

            {/* Dots */}
            <div className="lh-hero-carousel-dots">
              {HERO_PANELS.map((_, i) => (
                <button
                  key={i}
                  className={`lh-hero-carousel-dot ${heroIdx === i ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setHeroIdx(i); }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <button className="lh-hero-carousel-arrow left" onClick={(e) => { e.stopPropagation(); setHeroIdx(i => (i - 1 + HERO_PANELS.length) % HERO_PANELS.length); }}>
              <FiChevronLeft size={22} />
            </button>
            <button className="lh-hero-carousel-arrow right" onClick={(e) => { e.stopPropagation(); setHeroIdx(i => (i + 1) % HERO_PANELS.length); }}>
              <FiChevronRight size={22} />
            </button>
          </section>

          {/* 2. New Arrivals Section */}
          <section className="lh-new-arrivals">
            <div className="lh-section-header">
              <h2 className="lh-section-title">New Arrivals</h2>
              <button className="lh-view-all-btn" onClick={handleViewAll}>
                View All &rarr;
              </button>
            </div>
            <div className="lh-arrivals-grid">
              {allProducts.slice(0, 4).map(product => (
                <div key={product._id} className="lh-product-card" onClick={() => navigate(`/product/${product._id}`)}>
                  <div className="lh-img-wrapper">
                    {product.images?.[0]?.url
                      ? <img src={product.images[0].url} alt={product.title} className="lh-product-img" />
                      : <div className="lh-img-placeholder"><span>LUOMI</span></div>
                    }
                    {product.images?.[1]?.url && (
                      <img src={product.images[1].url} alt={product.title} className="lh-product-img lh-product-img-hover" />
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <span className="lh-low-stock-badge">Only Few Left</span>
                    )}
                    {/* wishlist heart */}
                    <button
                      className={`lh-card-heart ${isWishlisted(product._id) ? 'active' : ''}`}
                      onClick={e => {
                        e.stopPropagation()
                        if (!user) { navigate('/login'); return }
                        handleToggleWishlist({ productId: product._id })
                      }}
                      title="Add to Wishlist"
                    >
                      <FiHeart size={14} fill={isWishlisted(product._id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="lh-product-info">
                    <h3 className="lh-product-name">{product.title}</h3>
                    <span className="lh-product-price">₹{fmt(product.price?.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Shop by Category Section */}
          <section className="lh-categories">
            <h2 className="lh-section-title-centered">Shop by Category</h2>
            <div className="lh-category-grid">
              {SHOP_BY_CATS.map((cat, index) => (
                <div
                  key={cat.label}
                  className="lh-category-card"
                  onClick={() => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams(prev)
                      next.set('category', cat.sub)
                      next.set('browse', 'true')
                      return next
                    })
                    window.scrollTo(0, 0);
                  }}
                >
                  <div className="lh-category-img-wrap">
                    <img src={cat.img} alt={cat.label} className="lh-category-img" />
                  </div>
                  <div className="lh-category-info">
                    <span className="lh-category-number">0{index + 1}</span>
                    <span className="lh-category-name">{cat.label}</span>
                    <span className="lh-category-arrow">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Editorial Banner */}
          <section className="lh-editorial">
            <div className="lh-editorial-img">
              <img src="/images/hero/editorial.png" alt="Editorial Collection" />
            </div>
            <div className="lh-editorial-content">
              <p className="lh-editorial-subtitle">THE WINTER EDIT</p>
              <h2 className="lh-editorial-title">THE ART OF REFINE</h2>
              <p className="lh-editorial-desc">A curation of heavyweight knits, tailored silhouettes, and premium textures.</p>
              <button className="lh-editorial-btn" onClick={() => {
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev)
                  next.set('category', 'shirt')
                  next.set('browse', 'true')
                  return next
                })
                window.scrollTo(0, 0);
              }}>
                Shop Collection
              </button>
            </div>
          </section>

          {/* Atelier Note */}
          <section className="lh-atelier-note">
            <div className="lh-note-inner">
              <span className="lh-note-label">Atelier Note</span>
              <h2 className="lh-note-title">
                "Architecture you can wear. We believe in the quiet luxury of precision tailoring, the intimacy of pure silk, and the permanence of thoughtful design."
              </h2>
              <div className="lh-note-divider" />
              <p className="lh-note-author">L.M. — Creative Director</p>
            </div>
          </section>

          {/* 5. Minimal Footer */}
          <footer className="lh-footer">
            <div className="lh-footer-logo">LUOMI MAISON</div>
            <div className="lh-footer-links">
              <a href="#sustainability">Sustainability</a>
              <a href="#service">Client Service</a>
              <a href="#stores">Store Locator</a>
              <a href="#instagram">Instagram</a>
              <a href="#pinterest">Pinterest</a>
            </div>
            <div className="lh-footer-copy">© 2026 LUOMI ATELIER. ALL RIGHTS RESERVED.</div>
          </footer>
        </div>
      )}

      {/* ════════════════ PRODUCT BROWSE GRID (Browse Mode) ════════════════ */}
      {(isBrowsing || searchQuery) && (
        <div className="lh-main">
          <div className="lh-filter-bar">
            <span className="lh-filter-count">
              {filteredProducts.length} Products
              {currentTab.label !== 'Discover' && ` — ${currentTab.label}`}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="lh-empty">
              <FiSearch size={32} style={{ opacity: .3 }} />
              <p>No products found</p>
              <button onClick={handleReset} className="lh-empty-reset">
                Back to Homepage
              </button>
            </div>
          ) : (
            <div className="lh-grid">
              {filteredProducts.map(product => (
                <div key={product._id} className="lh-card" onClick={() => navigate(`/product/${product._id}`)}>
                  <div className="lh-card-img-wrap">
                    {product.images?.[0]?.url
                      ? <img src={product.images[0].url} alt={product.title} className="lh-card-img" />
                      : <div className="lh-card-img-placeholder"><span>LUOMI</span></div>
                    }
                    {product.images?.[1]?.url && (
                      <img src={product.images[1].url} alt={product.title} className="lh-card-img lh-card-img-hover" />
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <span className="lh-low-stock-badge">Only Few Left</span>
                    )}
                    {/* wishlist heart */}
                    <button
                      className={`lh-card-heart ${isWishlisted(product._id) ? 'active' : ''}`}
                      onClick={e => {
                        e.stopPropagation()
                        if (!user) { navigate('/login'); return }
                        handleToggleWishlist({ productId: product._id })
                      }}
                      title="Add to Wishlist"
                    >
                      <FiHeart size={14} fill={isWishlisted(product._id) ? "currentColor" : "none"} />
                    </button>
                    {/* ADD TO BAG hover CTA */}
                    <button
                      className="lh-card-atb"
                      onClick={e => { e.stopPropagation(); addToCart(product) }}
                    >
                      ADD TO BAG
                    </button>
                  </div>
                  <div className="lh-card-body">
                    <span className="lh-card-cat">{product.subCategory?.toUpperCase() || 'APPAREL'}</span>
                    <h3 className="lh-card-title">{product.title}</h3>
                    <span className="lh-card-price">₹{fmt(product.price?.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer on Browse Page too */}
          <footer className="lh-footer" style={{ marginTop: '80px' }}>
            <div className="lh-footer-logo">LUOMI MAISON</div>
            <div className="lh-footer-links">
              <a href="#sustainability">Sustainability</a>
              <a href="#service">Client Service</a>
              <a href="#stores">Store Locator</a>
              <a href="#instagram">Instagram</a>
              <a href="#pinterest">Pinterest</a>
            </div>
            <div className="lh-footer-copy">© 2026 LUOMI ATELIER. ALL RIGHTS RESERVED.</div>
          </footer>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="lh-toast animate-slide-up">
          <FiShoppingBag size={14} className="lh-toast-icon" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  )
}
