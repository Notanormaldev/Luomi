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

// Helper function to parse Jerry's responses (bold text and relative/absolute links)
const parseMessageText = (text) => {
  if (!text) return null;
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const closeBracketIdx = part.indexOf(']');
      const linkText = part.slice(1, closeBracketIdx);
      const url = part.slice(closeBracketIdx + 2, -1);
      if (url.startsWith('/')) {
        return (
          <Link
            to={url}
            key={index}
            className="jerry-chat-link"
            onClick={() => window.scrollTo(0, 0)}
          >
            {linkText}
          </Link>
        );
      }
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="jerry-chat-link">
          {linkText}
        </a>
      );
    }
    return part;
  });
};

function Productdetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { handlegetoneprodcut, handlegetallprodcuts } = useproduct()
  const { user } = useauth()
  const allProducts = useSelector(state => state.product.products) || []
  const { items: cartItems, handleGetCart, handleAddToCart } = usecart()
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
    { sender: 'jerry', text: "Hi! I'm Jerry 👋, your Luomi personal shopping assistant. I can answer any questions about this product. What would you like to know?" }
  ])
  const [jerryInput, setJerryInput] = useState('')
  const [jerryLoading, setJerryLoading] = useState(false)
  const jerryMsgsRef = useRef(null)

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

  // Fetch product
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await handlegetoneprodcut({ productid: id })
        if (data && data.success && data.products) {
          const prod = data.products
          setProduct(prod)
          setJerryMessages([
            {
              sender: 'jerry',
              text: `Hi! I'm Jerry 👋, your Luomi personal shopping assistant. I can answer any questions about **${prod.title}**:
- **Sizes & Fit** (available sizes, fit recommendation)
- **Fabric & Care** (materials, wash instructions)
- **Colors** (shades and swatches)
- **Stock Status & Pricing**
- **Styling Suggestions**

What would you like to know?`
            }
          ])
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

  // Scroll Jerry messages container to bottom
  useEffect(() => {
    if (jerryMsgsRef.current) {
      jerryMsgsRef.current.scrollTop = jerryMsgsRef.current.scrollHeight
    }
  }, [jerryMessages, isJerryOpen])

  const handleAttributeSelect = (key, val) => {
    setSelectedAttributes(prev => {
      const next = { ...prev, [key]: val }

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
    if (user.role === 'delivery') {
      setToastMsg("Delivery Partners are restricted from shopping or placing orders.")
      setTimeout(() => setToastMsg(null), 3000)
      return
    }
    const cartPayload = { productId: product._id, quantity }
    if (selectedVariant) cartPayload.variantId = selectedVariant._id
    const existing = cartItems.find(i => {
      if (selectedVariant) return i.product._id === product._id && i.selectedVariant === selectedVariant._id
      return i.product._id === product._id && !i.selectedVariant
    })
    const currentQty = existing?.quantity || 0
    if (availableStock > 0 && currentQty + quantity > availableStock) {
      setToastMsg(`Only ${availableStock} available in stock`)
      setTimeout(() => setToastMsg(null), 3000)
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
      setToastMsg(res.error || 'Failed to add')
      setTimeout(() => setToastMsg(null), 3000)
    }
  }

  const handlePageQtyChange = (delta) => {
    const newQty = quantity + delta
    if (newQty < 1) return
    if (newQty > availableStock) {
      setToastMsg(`Only ${availableStock} in stock`)
      setTimeout(() => setToastMsg(null), 3000)
      return
    }
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
      <div className="lh-page-loader">
        <div className="lh-nano-bar"></div>
        <h1 className="lh-loader-logo">LUOMI</h1>
      </div>
    )
  }

  return (
    <div className="pd-root-design">

      {/* ── Navbar ── */}
      <div className="pd-navbar-design">
        <div className="pd-nav-inner-design">
          <div className="pd-nav-left-design">
            <button className="pd-icon-btn-design" onClick={() => navigate(-1)}>
              <FiArrowLeft size={18} />
            </button>
            <Link to="/" className="pd-logo-link-design"><Logo /></Link>
          </div>
          <div className="pd-nav-right-design">
            {user?.role === 'seller' && (
              <Link to="/dashbord/seller" className="pd-dashboard-link-design" title="Go to Seller Atelier Dashboard">
                Atelier
              </Link>
            )}
            <Link to="/wishlist" className="pd-icon-btn-design" title="Wishlist">
              <FiHeart size={19} />
            </Link>
            <button className="pd-cart-btn-design pd-icon-btn-design" onClick={() => navigate('/cart')}>
              <FiShoppingBag size={19} />
              {totalCartItems > 0 && <span className="pd-cart-badge-design">{totalCartItems}</span>}
            </button>
            {user ? (
              <Link to="/settings" className="pd-icon-btn-design"><FiUser size={19} /></Link>
            ) : (
              <Link to="/login" className="pd-icon-btn-design"><FiUser size={19} /></Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Details Grid ── */}
      {error || !product ? (
        <div className="pd-error-design">
          <p>{error || 'Product not found'}</p>
          <button onClick={() => navigate('/')}>Go back</button>
        </div>
      ) : (
        <div className="pd-content-design">

          {/* Left: Gallery (Sticky on desktop, horizontal thumb strip below) */}
          <div className="pd-gallery-design">
            {/* Main image container */}
            <div className="pd-main-img-wrap-design">
              {activeImgUrl ? (
                <img src={activeImgUrl} alt={product.title} className="pd-main-img-design" />
              ) : (
                <div className="pd-img-empty-design"><span>LUOMI</span></div>
              )}
              {galleryImages.length > 1 && (
                <>
                  <button className="pd-img-nav-design pd-img-prev-design" onClick={() => {
                    const i = galleryImages.indexOf(activeImgUrl)
                    setActiveImgUrl(galleryImages[(i - 1 + galleryImages.length) % galleryImages.length])
                  }}>‹</button>
                  <button className="pd-img-nav-design pd-img-next-design" onClick={() => {
                    const i = galleryImages.indexOf(activeImgUrl)
                    setActiveImgUrl(galleryImages[(i + 1) % galleryImages.length])
                  }}>›</button>
                </>
              )}
            </div>

            {/* Thumbnail horizontal scroll strip below */}
            {galleryImages.length > 1 && (
              <div className="pd-thumbs-strip-design">
                {galleryImages.map((url, i) => (
                  <div
                    key={i}
                    className={`pd-thumb-tile-design ${activeImgUrl === url ? 'active' : ''}`}
                    onClick={() => setActiveImgUrl(url)}
                  >
                    <img src={url} alt={`view ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="pd-info-design">

            {/* Breadcrumbs */}
            <nav className="pd-breadcrumbs-design">
              <Link to="/">Shop</Link>
              <span>/</span>
              <span className="pd-breadcrumb-active-design">{product.category || 'Apparel'}</span>
            </nav>

            {/* Header: Title & Prices */}
            <div className="pd-header-design">
              <h1 className="pd-title-design">{product.title}</h1>
              <div className="pd-price-row-design">
                <span className="pd-price-design">₹{fmt(selectedVariant?.price?.amount ?? product.price?.amount)}</span>
                {hasDiscount && (
                  <>
                    <span className="pd-price-original-design">₹{fmt(product.price?.amount)}</span>
                    <span className="pd-discount-tag-design">{discountPct}% OFF</span>
                  </>
                )}
              </div>
              <p className="pd-tax-note-design">Inclusive of all taxes</p>
            </div>

            {/* Selector groups */}
            {product.variants?.length > 0 && (
              <div className="pd-variants-design">
                {attributeList.map(attr => {
                  const isColor = attr.key === 'color'
                  const isSize = attr.key === 'size'
                  const current = selectedAttributes[attr.key]
                  const vals = isSize ? sortSizes(attr.values) : attr.values

                  return (
                    <div key={attr.key} className="pd-attr-group-design">
                      <div className="pd-attr-label-design">
                        <span>{attr.displayName}</span>
                        {current && <span className="pd-attr-selected-design">{current}</span>}
                      </div>

                      {isColor ? (
                        <div className="pd-color-list-design">
                          {vals.map(val => {
                            const matchVar = product.variants.find(v => getAttr(v.attributes, 'color') === val)
                            const preview = matchVar?.images?.[0]?.url || product.images?.[0]?.url
                            const isActive = current === val
                            return (
                              <button
                                key={val}
                                className={`pd-color-btn-design ${isActive ? 'active' : ''}`}
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
                        <div className="pd-size-list-design">
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
                                className={`pd-size-btn-design ${isActive ? 'active' : ''} ${isOos || notAvail ? 'oos' : ''}`}
                                disabled={notAvail}
                                onClick={() => handleAttributeSelect(attr.key, val)}
                              >
                                {val}
                                {isOos && !notAvail && <span className="pd-oos-line-design"></span>}
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

            {/* Qty and buying CTAs */}
            <div className="pd-purchase-design">
              <div className="pd-qty-row-design">
                <span className="pd-qty-label-design">Qty</span>
                <div className="pd-qty-ctrl-design">
                  <button onClick={() => handlePageQtyChange(-1)} className="pd-qty-btn-design"><FiMinus size={12} /></button>
                  <span className="pd-qty-val-design">{quantity}</span>
                  <button onClick={() => handlePageQtyChange(1)} className="pd-qty-btn-design"><FiPlus size={12} /></button>
                </div>
                <span className="pd-stock-info-design">
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

              {/* Buying CTA row: Solid Add to Bag (full width black) and Outlined Buy Now */}
              <div className="pd-cta-row-design">
                <button
                  className="pd-add-bag-btn-design"
                  disabled={hasVariants ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0)) : product?.stock <= 0}
                  onClick={() => addToCart(false)}
                >
                  {hasVariants
                    ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0) ? 'OUT OF STOCK' : 'ADD TO BAG')
                    : (product?.stock > 0 ? 'ADD TO BAG' : 'OUT OF STOCK')
                  }
                </button>
                <button
                  className="pd-buy-now-btn-design"
                  disabled={hasVariants ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0)) : product?.stock <= 0}
                  onClick={() => addToCart(true)}
                >
                  {hasVariants
                    ? (selectedAttributes['size'] && (!selectedVariant || selectedVariant.stock <= 0) ? 'OUT OF STOCK' : 'BUY NOW')
                    : (product?.stock > 0 ? 'BUY NOW' : 'OUT OF STOCK')
                  }
                </button>
                <button
                  className={`pd-wishlist-btn-design ${isWishlisted(id) ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) { navigate('/login'); return }
                    handleToggleWishlist({ productId: id })
                  }}
                  title="Toggle Wishlist"
                >
                  <FiHeart size={18} fill={isWishlisted(id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Delivery benefits */}
            <div className="pd-delivery-info-design">
              <div className="pd-delivery-item-design">
                <FiTruck size={14} />
                <span>Free delivery on orders above ₹999</span>
              </div>
              <div className="pd-delivery-item-design">
                <FiRefreshCw size={14} />
                <span>Easy 14-day returns & exchanges</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="pd-info-accordion-design">
              <details className="pd-accordion-item-design" open>
                <summary className="pd-accordion-summary-design">
                  <span>Product Details</span>
                </summary>
                <div className="pd-accordion-content-design">
                  <p>{product.description || "A premium minimalist piece designed for the modern wardrobe. Meticulously crafted with clean silhouettes and high-quality materials to ensure longevity and comfort."}</p>
                  <ul className="pd-accordion-list-design">
                    <li>Fine tailoring and architectural structure</li>
                    <li>Sourced from sustainable premium organic linen blends</li>
                    <li>Comfort fit designed for everyday luxury styling</li>
                  </ul>
                </div>
              </details>

              <details className="pd-accordion-item-design">
                <summary className="pd-accordion-summary-design">
                  <span>Fabric & Care</span>
                </summary>
                <div className="pd-accordion-content-design">
                  <p>Dry clean only or cold hand wash. Handle with care. Use soft steaming to remove wrinkles. Avoid hot ironing or machine spinning to preserve fabric fibers.</p>
                </div>
              </details>

              <details className="pd-accordion-item-design">
                <summary className="pd-accordion-summary-design">
                  <span>Shipping & Returns</span>
                </summary>
                <div className="pd-accordion-content-design">
                  <p>Complimentary standard delivery across all domestic locations. Returns and exchanges are accepted within 14 days of delivery provided the item is in pristine, unused condition with all original tags attached.</p>
                </div>
              </details>
            </div>

            {/* Jerry AI section */}
            <div className="pd-jerry-section-design">
              <button
                className="pd-jerry-toggle-design"
                onClick={() => setIsJerryOpen(!isJerryOpen)}
              >
                <FiMessageCircle size={16} />
                <span>ASK JERRY</span>
                <span className="pd-jerry-badge-design">AI</span>
                <span className="pd-jerry-chevron-design">{isJerryOpen ? '▲' : '▼'}</span>
              </button>

              {isJerryOpen && (
                <div className="pd-jerry-box-design">
                  <div className="pd-jerry-msgs-design" ref={jerryMsgsRef}>
                    {jerryMessages.map((msg, i) => (
                      <div key={i} className={`pd-jerry-msg-design ${msg.sender}`}>
                        {msg.sender === 'jerry' && (
                          <span className="pd-jerry-avatar-design">J</span>
                        )}
                        <div className="pd-jerry-bubble-design" style={{ whiteSpace: 'pre-line', textAlign: 'left' }}>
                          {parseMessageText(msg.text)}
                        </div>
                      </div>
                    ))}
                    {jerryLoading && (
                      <div className="pd-jerry-msg-design jerry">
                        <span className="pd-jerry-avatar-design">J</span>
                        <div className="pd-jerry-bubble-design pd-jerry-typing-design">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pd-jerry-quick-design">
                    {QUICK_ASKS.map(q => (
                      <button key={q} className="pd-jerry-chip-design"
                        disabled={jerryLoading}
                        onClick={() => handleAskJerry(null, q)}>
                        {q}
                      </button>
                    ))}
                  </div>

                  <form className="pd-jerry-form-design" onSubmit={handleAskJerry}>
                    <input
                      type="text"
                      placeholder="Type your question..."
                      value={jerryInput}
                      onChange={e => setJerryInput(e.target.value)}
                      className="pd-jerry-input-design"
                      disabled={jerryLoading}
                    />
                    <button type="submit" className="pd-jerry-send-design" disabled={jerryLoading || !jerryInput.trim()}>
                      <FiSend size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Complete the Look section */}
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
            .slice(0, 4);

          if (similarProducts.length === 0) return null;

          return (
            <div className="pd-similar-section-design">
              <h2 className="pd-similar-title-design">Complete the Look</h2>
              <div className="pd-similar-grid-design">
                {similarProducts.map(p => (
                  <div key={p._id} className="pd-similar-card-design" onClick={() => { window.scrollTo(0, 0); navigate(`/product/${p._id}`) }}>
                    <div className="pd-similar-card-img-wrap-design">
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.title} className="pd-similar-card-img-design" />
                      ) : (
                        <div className="pd-similar-card-img-placeholder-design"><span>LUOMI</span></div>
                      )}
                      {p.images?.[1]?.url && (
                        <img src={p.images[1].url} alt={p.title} className="pd-similar-card-img-hover-design" />
                      )}
                    </div>
                    <div className="pd-similar-card-body-design">
                      <span className="pd-similar-card-cat-design">{p.subCategory?.toUpperCase() || 'APPAREL'}</span>
                      <h3 className="pd-similar-card-title-design">{p.title}</h3>
                      <span className="pd-similar-card-price-design">₹{fmt(p.price?.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      )}

      {/* Footer */}
      <footer className="pd-footer-design">
        <div className="pd-footer-logo-design">LUOMI MAISON</div>
        <div className="pd-footer-links-design">
          <a href="#sustainability">Sustainability</a>
          <a href="#service">Client Service</a>
          <a href="#stores">Store Locator</a>
          <a href="#instagram">Instagram</a>
          <a href="#pinterest">Pinterest</a>
        </div>
        <div className="pd-footer-copy-design">© 2026 LUOMI ATELIER. ALL RIGHTS RESERVED.</div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="pd-toast-design animate-slide-up">
          <FiShoppingBag size={14} className="pd-toast-icon-design" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  )
}

export default Productdetails
