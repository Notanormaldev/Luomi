import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import { usecart } from '../../cart/hook/usecart'
import Logo from '../../auth/components/Logo'
import axios from 'axios'
import {
  FiShoppingBag,
  FiX,
  FiPlus,
  FiMinus,
  FiArrowLeft,
  FiUser,
  FiSend,
  FiMessageCircle,
  FiRefreshCw,
  FiTruck,
  FiHeart
} from 'react-icons/fi'
import { usewishlist } from '../../wishlist/hook/usewishlist'
import './Productdetails.css'

function Productdetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { handlegetoneprodcut, handlegetallprodcuts } = useproduct()
  const { user } = useauth()
  const allProducts = useSelector(state => state.product.products) || []
  const { items: cartItems, handleGetCart, handleAddToCart, handleUpdateCart, handleRemoveFromCart, handleCheckout } = usecart()
  const { handleGetWishlist, handleToggleWishlist, isWishlisted } = usewishlist()

  useEffect(() => {
    if (user) {
      handleGetCart()
      handleGetWishlist()
    }
  }, [user])

  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [toastMsg, setToastMsg] = useState(null)

  // Jerry
  const [isJerryOpen, setIsJerryOpen] = useState(false)
  const [jerryMessages, setJerryMessages] = useState([
    { sender: 'jerry', text: "Hi! I'm Jerry 👋 Ask me anything about this product — sizes, fit, material, styling tips, or stock." }
  ])
  const [jerryInput, setJerryInput] = useState('')
  const [jerryLoading, setJerryLoading] = useState(false)
  const jerryEndRef = useRef(null)

  // Variants
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [galleryImages, setGalleryImages] = useState([])
  const [activeImgUrl, setActiveImgUrl] = useState('')

  const getAttr = (attributes, keyName) => {
    if (!attributes) return null
    for (const [key, val] of Object.entries(attributes)) {
      if (key.toLowerCase() === keyName.toLowerCase()) return val
    }
    return null
  }

  // Sync theme
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

  // Fetch cart
  useEffect(() => { if (user) handleGetCart() }, [user])

  // Fetch product
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        // Fix: hook expects { productid } object, returns { success, products: product }
        const data = await handlegetoneprodcut({ productid: id })
        if (data && data.success && data.products) {
          const prod = data.products
          setProduct(prod)
          const pImgs = prod.images ? prod.images.map(i => i.url).filter(Boolean) : []
          const allVImgs = prod.variants ? prod.variants.flatMap(v => v.images ? v.images.map(i => i.url).filter(Boolean) : []) : []
          const combined = Array.from(new Set([...pImgs, ...allVImgs]))
          setGalleryImages(combined)
          if (combined.length > 0) setActiveImgUrl(combined[0])
        } else {
          setError('Product not found')
        }
      } catch (e) {
        console.error('Product fetch error:', e)
        setError('Failed to load product')
      }
      finally { setLoading(false) }
    }
    fetch()
    handlegetallprodcuts()
    window.scrollTo(0, 0)
  }, [id])

  // Init default attributes from first variant
  useEffect(() => {
    if (product?.variants?.length > 0) {
      const firstVariant = product.variants[0]
      const initAttrs = {}
      Object.entries(firstVariant.attributes || {}).forEach(([k, v]) => {
        initAttrs[k.toLowerCase()] = v
      })
      setSelectedAttributes(initAttrs)
    } else {
      setSelectedAttributes({})
    }
  }, [product])

  // Resolve selected variant from selected attributes
  useEffect(() => {
    if (!product?.variants?.length) { setSelectedVariant(null); return }
    const match = product.variants.find(v =>
      Object.entries(selectedAttributes).every(([k, val]) => getAttr(v.attributes, k) === val)
    )
    if (match) {
      setSelectedVariant(match)
      const vImgs = match.images?.map(i => i.url).filter(Boolean) || []
      if (vImgs.length > 0) {
        setActiveImgUrl(vImgs[0])
      }
    } else {
      setSelectedVariant(null)
    }
  }, [selectedAttributes, product])

  // Reset qty on variant change
  useEffect(() => { setQuantity(1) }, [selectedVariant])

  // Scroll Jerry messages
  useEffect(() => {
    jerryEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [jerryMessages, isJerryOpen])

  const handleAttributeSelect = (key, val) => {
    setSelectedAttributes(prev => {
      const next = { ...prev, [key]: val }

      // If color was changed, check if the previously selected size is available in this new color.
      // If not, clear size selection so they must explicitly choose an available size again.
      if (key.toLowerCase() === 'color' && prev['size']) {
        const sizeVal = prev['size']
        const isCompatible = product.variants.some(v =>
          getAttr(v.attributes, 'color') === val &&
          getAttr(v.attributes, 'size') === sizeVal
        )
        if (!isCompatible) {
          delete next['size']
        }
      }
      return next
    })
  }

  // Build unique attributes
  const uniqueAttributes = {}
  const keyCasingMap = {}
  if (product?.variants) {
    product.variants.forEach(v => {
      Object.entries(v.attributes || {}).forEach(([key, val]) => {
        const lk = key.toLowerCase()
        keyCasingMap[lk] = key
        if (!uniqueAttributes[lk]) uniqueAttributes[lk] = new Set()
        uniqueAttributes[lk].add(val)
      })
    })
  }

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
  const sortSizes = arr => [...arr].sort((a, b) => {
    const ai = sizeOrder.indexOf(a.toUpperCase()), bi = sizeOrder.indexOf(b.toUpperCase())
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return parseInt(a) - parseInt(b) || a.localeCompare(b)
  })

  const attributeList = Object.keys(uniqueAttributes).map(lk => ({
    key: lk,
    displayName: keyCasingMap[lk],
    values: Array.from(uniqueAttributes[lk])
  }))

  const fmt = (amount) => {
    if (amount === undefined || amount === null) return '0'
    const n = parseFloat(amount)
    return isNaN(n) ? '0' : n.toLocaleString('en-IN')
  }

  const currentPrice = parseFloat(selectedVariant?.price?.amount ?? product?.price?.amount ?? 0)
  const basePrice = parseFloat(product?.price?.amount ?? 0)
  const hasDiscount = basePrice > 0 && currentPrice > 0 && basePrice > currentPrice
  const discountPct = hasDiscount ? Math.round(((basePrice - currentPrice) / basePrice) * 100) : 0

  const totalCartItems = cartItems.reduce((a, c) => a + c.quantity, 0)
  const cartTotal = useSelector(s => s.cart.subtotal) || 0

  const hasVariants = product?.variants && product.variants.length > 0
  const availableStock = hasVariants
    ? (selectedVariant ? (selectedVariant.stock ?? 0) : 0)
    : (product?.stock ?? 0)

  const addToCart = async (navigateAfter = false) => {
    if (hasVariants && !selectedAttributes['size']) {
      setToastMsg("Please select a size first")
      setTimeout(() => setToastMsg(null), 3000)
      return
    }
    if (!user) { navigate('/login'); return }
    const cartPayload = { productId: id, quantity }
    if (selectedVariant) cartPayload.variantId = selectedVariant._id
    const existing = cartItems.find(i => {
      if (selectedVariant) return i.product._id === id && i.selectedVariant === selectedVariant._id
      return i.product._id === id && !i.selectedVariant
    })
    const currentQty = existing?.quantity || 0
    // Let backend be the final authority for stock — only do a soft check here
    if (availableStock > 0 && currentQty + quantity > availableStock) {
      alert(`Only ${availableStock} available in stock`)
      return
    }
    const res = await handleAddToCart(cartPayload)
    if (res.success) {
      if (navigateAfter === true) {
        navigate('/cart')
      } else {
        setToastMsg(`"${product.title}" added to your bag`)
        setTimeout(() => setToastMsg(null), 3000)
      }
    } else {
      alert(res.error || 'Failed to add')
    }
  }

  const handlePageQtyChange = (delta) => {
    const newQty = quantity + delta
    if (newQty < 1) return
    if (newQty > availableStock) { alert(`Only ${availableStock} in stock`); return }
    setQuantity(newQty)
  }

  const handleAskJerry = async (e, customMsg = '') => {
    if (e) e.preventDefault()
    const msg = customMsg || jerryInput
    if (!msg.trim()) return
    setJerryMessages(prev => [...prev, { sender: 'user', text: msg }])
    setJerryInput('')
    setJerryLoading(true)
    try {
      const res = await axios.post(`/api/ai/${id}/ask-jerry`, { message: msg })
      if (res.data.success) {
        setJerryMessages(prev => [...prev, { sender: 'jerry', text: res.data.reply }])
      } else {
        setJerryMessages(prev => [...prev, { sender: 'jerry', text: "Sorry, I couldn't find an answer. Try asking differently!" }])
      }
    } catch {
      setJerryMessages(prev => [...prev, { sender: 'jerry', text: "Connection error. Please try again." }])
    } finally {
      setJerryLoading(false)
    }
  }

  const QUICK_ASKS = [
    "What sizes are available?",
    "How does it fit?",
    "What is it made of?",
    "How to style this?",
  ]

  if (loading) {
    return (
      <div className="sn-page-loader">
        <div className="sn-nano-bar"></div>
        <h1 className="sn-loader-logo">LUOMI</h1>
      </div>
    )
  }

  return (
    <div className="pd-root">

      {/* ── Navbar ── */}
      <div className="pd-navbar">
        <div className="pd-nav-inner">
          <div className="pd-nav-left">
            <button className="pd-icon-btn" onClick={() => navigate('/')}>
              <FiArrowLeft size={18} />
            </button>
            <Link to="/" className="pd-logo-link"><Logo /></Link>
          </div>
          <div className="pd-nav-right">
            {user?.role === 'seller' && (
              <Link to="/dashbord/seller" className="pd-dashboard-link" title="Go to Seller Atelier Dashboard">
                Atelier
              </Link>
            )}
            <button className="pd-cart-btn pd-icon-btn" onClick={() => navigate('/cart')}>
              <FiShoppingBag size={19} />
              {totalCartItems > 0 && <span className="pd-cart-badge">{totalCartItems}</span>}
            </button>
            {user ? (
              <Link to="/settings" className="pd-icon-btn"><FiUser size={19} /></Link>
            ) : (
              <Link to="/login" className="pd-icon-btn"><FiUser size={19} /></Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      {loading ? (
        <div className="pd-skeleton-wrap">
          <div className="pd-skeleton-gallery pd-shimmer"></div>
          <div className="pd-skeleton-info">
            <div className="pd-skeleton-line pd-shimmer" style={{ width: '60%', height: '24px' }}></div>
            <div className="pd-skeleton-line pd-shimmer" style={{ width: '40%', height: '18px', marginTop: '10px' }}></div>
            <div className="pd-skeleton-line pd-shimmer" style={{ width: '80%', height: '14px', marginTop: '16px' }}></div>
            <div className="pd-skeleton-line pd-shimmer" style={{ width: '100%', height: '44px', marginTop: '24px' }}></div>
          </div>
        </div>
      ) : error || !product ? (
        <div className="pd-error">
          <p>{error || 'Product not found'}</p>
          <button onClick={() => navigate('/')}>Go back</button>
        </div>
      ) : (
        <div className="pd-content">

          {/* Left: Gallery */}
          <div className="pd-gallery">
            {/* Thumbnail rail */}
            {galleryImages.length > 1 && (
              <div className="pd-thumbs">
                {galleryImages.map((url, i) => (
                  <div
                    key={i}
                    className={`pd-thumb ${activeImgUrl === url ? 'active' : ''}`}
                    onClick={() => setActiveImgUrl(url)}
                  >
                    <img src={url} alt={`view ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="pd-main-img-wrap">
              {activeImgUrl ? (
                <img src={activeImgUrl} alt={product.title} className="pd-main-img" />
              ) : (
                <div className="pd-img-empty"><span>LUOMI</span></div>
              )}
              {/* Nav arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button className="pd-img-nav pd-img-prev" onClick={() => {
                    const i = galleryImages.indexOf(activeImgUrl)
                    setActiveImgUrl(galleryImages[(i - 1 + galleryImages.length) % galleryImages.length])
                  }}>‹</button>
                  <button className="pd-img-nav pd-img-next" onClick={() => {
                    const i = galleryImages.indexOf(activeImgUrl)
                    setActiveImgUrl(galleryImages[(i + 1) % galleryImages.length])
                  }}>›</button>
                </>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="pd-info">

            {/* Title + Price */}
            <div className="pd-header">
              <h1 className="pd-title">{product.title}</h1>
              <div className="pd-price-row">
                <span className="pd-price">₹{fmt(selectedVariant?.price?.amount ?? product.price?.amount)}</span>
                {hasDiscount && (
                  <>
                    <span className="pd-price-original">₹{fmt(product.price?.amount)}</span>
                    <span className="pd-discount-tag">{discountPct}% OFF</span>
                  </>
                )}
              </div>
              <p className="pd-tax-note">Inclusive of all taxes</p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="pd-desc">{product.description}</p>
            )}

            {/* Variant selectors */}
            {product.variants?.length > 0 && (
              <div className="pd-variants">
                {attributeList.map(attr => {
                  const isColor = attr.key === 'color'
                  const isSize = attr.key === 'size'
                  const current = selectedAttributes[attr.key]
                  const vals = isSize ? sortSizes(attr.values) : attr.values

                  return (
                    <div key={attr.key} className="pd-attr-group">
                      <div className="pd-attr-label">
                        <span>{attr.displayName}</span>
                        {current && <span className="pd-attr-selected">{current}</span>}
                      </div>

                      {isColor ? (
                        <div className="pd-color-list">
                          {vals.map(val => {
                            const matchVar = product.variants.find(v => getAttr(v.attributes, 'color') === val)
                            const preview = matchVar?.images?.[0]?.url || product.images?.[0]?.url
                            const isActive = current === val
                            return (
                              <button
                                key={val}
                                className={`pd-color-btn ${isActive ? 'active' : ''}`}
                                onClick={() => handleAttributeSelect(attr.key, val)}
                                title={val}
                              >
                                {preview
                                  ? <img src={preview} alt={val} />
                                  : <span>{val.slice(0, 2)}</span>
                                }
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="pd-size-list">
                          {vals.map(val => {
                            const testAttrs = { ...selectedAttributes, [attr.key]: val }
                            const matchVar = product.variants.find(v =>
                              Object.entries(testAttrs).every(([k, v2]) => getAttr(v.attributes, k) === v2)
                            )
                            const isActive = current === val
                            const isOos = matchVar ? matchVar.stock <= 0 : true
                            const notAvail = !matchVar

                            return (
                              <button
                                key={val}
                                className={`pd-size-btn ${isActive ? 'active' : ''} ${isOos || notAvail ? 'oos' : ''}`}
                                disabled={notAvail}
                                onClick={() => handleAttributeSelect(attr.key, val)}
                              >
                                {val}
                                {isOos && !notAvail && <span className="pd-oos-line"></span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Qty + Add to bag */}
            <div className="pd-purchase">
              {/* Qty row */}
              <div className="pd-qty-row">
                <span className="pd-qty-label">Qty</span>
                <div className="pd-qty-ctrl">
                  <button onClick={() => handlePageQtyChange(-1)} className="pd-qty-btn"><FiMinus size={12} /></button>
                  <span className="pd-qty-val">{quantity}</span>
                  <button onClick={() => handlePageQtyChange(1)} className="pd-qty-btn"><FiPlus size={12} /></button>
                </div>
                <span className="pd-stock-info">
                  {hasVariants ? (
                    !selectedAttributes['size'] ? (
                      'Select size to check availability'
                    ) : (
                      selectedVariant ? (
                        selectedVariant.stock > 0 ? (
                          selectedVariant.stock <= 10 ? `⚠ Only ${selectedVariant.stock} left!` : ''
                        ) : '❌ Out of stock'
                      ) : '❌ Out of stock'
                    )
                  ) : (
                    product?.stock > 0
                      ? (product.stock <= 10 ? `⚠ Only ${product.stock} left!` : '')
                      : '❌ Out of stock'
                  )}
                </span>
              </div>

              <div className="pd-cta-row">
                <button
                  className="pd-add-bag-btn"
                  disabled={hasVariants ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0)) : product?.stock <= 0}
                  onClick={() => addToCart(false)}
                >
                  {hasVariants
                    ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0) ? 'OUT OF STOCK' : 'ADD TO BAG')
                    : (product?.stock > 0 ? 'ADD TO BAG' : 'OUT OF STOCK')
                  }
                </button>
                <button
                  className="pd-buy-now-btn"
                  disabled={hasVariants ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0)) : product?.stock <= 0}
                  onClick={() => addToCart(true)}
                >
                  {hasVariants
                    ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0) ? 'OUT OF STOCK' : 'BUY NOW')
                    : (product?.stock > 0 ? 'BUY NOW' : 'OUT OF STOCK')
                  }
                </button>
                <button
                  className={`pd-wishlist-btn ${isWishlisted(id) ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) { navigate('/login'); return }
                    handleToggleWishlist({ productId: id })
                  }}
                  title="Toggle Wishlist"
                >
                  <FiHeart size={18} fill={isWishlisted(id) ? "#ff5a36" : "none"} />
                </button>
              </div>
            </div>

            {/* Delivery info */}
            <div className="pd-delivery-info">
              <div className="pd-delivery-item">
                <FiTruck size={14} />
                <span>Free delivery on orders above ₹999</span>
              </div>
              <div className="pd-delivery-item">
                <FiRefreshCw size={14} />
                <span>Easy 14-day returns & exchanges</span>
              </div>
            </div>

            {/* ASK JERRY - inline */}
            <div className="pd-jerry-section">
              <button
                className="pd-jerry-toggle"
                onClick={() => setIsJerryOpen(!isJerryOpen)}
              >
                <FiMessageCircle size={16} />
                <span>ASK JERRY</span>
                <span className="pd-jerry-badge">AI</span>
                <span className="pd-jerry-chevron">{isJerryOpen ? '▲' : '▼'}</span>
              </button>

              {isJerryOpen && (
                <div className="pd-jerry-box">
                  {/* Messages */}
                  <div className="pd-jerry-msgs">
                    {jerryMessages.map((msg, i) => (
                      <div key={i} className={`pd-jerry-msg ${msg.sender}`}>
                        {msg.sender === 'jerry' && (
                          <span className="pd-jerry-avatar">J</span>
                        )}
                        <div className="pd-jerry-bubble">
                          {msg.text.split("**").map((part, pi) =>
                            pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part
                          )}
                        </div>
                      </div>
                    ))}
                    {jerryLoading && (
                      <div className="pd-jerry-msg jerry">
                        <span className="pd-jerry-avatar">J</span>
                        <div className="pd-jerry-bubble pd-jerry-typing">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    )}
                    <div ref={jerryEndRef}></div>
                  </div>

                  {/* Quick asks */}
                  <div className="pd-jerry-quick">
                    {QUICK_ASKS.map(q => (
                      <button key={q} className="pd-jerry-chip"
                        disabled={jerryLoading}
                        onClick={() => handleAskJerry(null, q)}>
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <form className="pd-jerry-form" onSubmit={handleAskJerry}>
                    <input
                      type="text"
                      placeholder="Type your question..."
                      value={jerryInput}
                      onChange={e => setJerryInput(e.target.value)}
                      className="pd-jerry-input"
                      disabled={jerryLoading}
                    />
                    <button type="submit" className="pd-jerry-send" disabled={jerryLoading || !jerryInput.trim()}>
                      <FiSend size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Similar Products Section */}
      {product && (
        (() => {
          const similarProducts = allProducts
            .filter(p => p._id !== id)
            .sort((a, b) => {
              if (a.subCategory === product?.subCategory && b.subCategory !== product?.subCategory) return -1
              if (b.subCategory === product?.subCategory && a.subCategory !== product?.subCategory) return 1
              if (a.genderCategory === product?.genderCategory && b.genderCategory !== product?.genderCategory) return -1
              if (b.genderCategory === product?.genderCategory && a.genderCategory !== product?.genderCategory) return 1
              return 0
            })
            .slice(0, 8);

          if (similarProducts.length === 0) return null;

          return (
            <div className="pd-similar-section">
              <h2 className="pd-similar-title">SIMILAR PRODUCTS</h2>
              <div className="pd-similar-grid">
                {similarProducts.map(p => (
                  <div key={p._id} className="pd-similar-card" onClick={() => { window.scrollTo(0, 0); navigate(`/product/${p._id}`) }}>
                    <div className="pd-similar-card-img-wrap">
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.title} className="pd-similar-card-img" />
                      ) : (
                        <div className="pd-similar-card-img-placeholder"><span>LUOMI</span></div>
                      )}
                      {p.images?.[1]?.url && (
                        <img src={p.images[1].url} alt={p.title} className="pd-similar-card-img pd-similar-card-img-hover" />
                      )}
                    </div>
                    <div className="pd-similar-card-body">
                      <h3 className="pd-similar-card-title">{p.title}</h3>
                      <span className="pd-similar-card-price">₹{fmt(p.price?.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="pd-toast animate-slide-up">
          <FiShoppingBag size={14} className="pd-toast-icon" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  )
}

export default Productdetails
