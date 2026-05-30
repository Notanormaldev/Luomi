import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useproduct } from '../hook/useproduct'
import { useauth } from '../../auth/hook/useauth'
import Logo from '../../auth/components/Logo'
import { 
  FiSun, 
  FiMoon, 
  FiArrowLeft,
  FiUser,
  FiBox,
  FiCalendar,
  FiLayers,
  FiDollarSign
} from 'react-icons/fi'
import './Sellerproductdetails.css'

function Sellerproductdetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { handlegetoneprodcut } = useproduct()
  const { user } = useauth()

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  
  // UI & Loading States
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImgUrl, setActiveImgUrl] = useState('')
  const [galleryImages, setGalleryImages] = useState([])

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('luomi-theme', theme)
  }, [theme])

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
          
          // Gather all primary images + variant images for a comprehensive preview assets list
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
          setError("This creation could not be found.")
        }
      } catch (err) {
        console.error("Failed to load seller product preview:", err)
        setError(err.msg || "Failed to retrieve the product. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSingleProduct()
    }
  }, [id])

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

  const totalStock = product?.variants 
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0) 
    : 0

  return (
    <div className="seller-details-container">
      
      {/* Sticky Premium Navbar */}
      <div className="seller-nav-container">
        <div className="seller-navbar">
          <div className="nav-left">
            <Link to="/dashbord/seller" className="no-underline">
              <Logo />
            </Link>
            <div className="nav-links">
              <span className="nav-link" onClick={() => navigate('/dashbord/seller')}>Atelier Dashboard</span>
              <span className="nav-link" onClick={() => navigate('/createproduct/seller')}>List New Creation</span>
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

            {/* Profile Action */}
            {user && (
              <div className="btn-nav-pill">
                <FiUser size={13} />
                <span className="hidden sm:inline">{user.fullname}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="seller-details-wrapper">
        
        {/* Back Link Row */}
        <div className="details-back-bar">
          <button className="btn-back-home" onClick={() => navigate('/dashbord/seller')}>
            <FiArrowLeft size={12} />
            <span>Back to Dashboard</span>
          </button>
          <span className="preview-indicator-badge">Atelier Seller Preview</span>
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
            </div>
          </div>
        ) : error || !product ? (
          /* Error State */
          <div className="empty-state-box">
            <span className="empty-brand-mark">LUOMI</span>
            <p className="empty-primary">{error || "Creation unavailable"}</p>
            <button className="btn-hero-cta" onClick={() => navigate('/dashbord/seller')}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          /* Premium Content Grid */
          <div className="details-main-grid">
            
            {/* Column Left: Visual Assets Gallery */}
            <div className="details-gallery-section">
              <div className="main-image-viewport">
                {activeImgUrl ? (
                  <img 
                    src={activeImgUrl} 
                    alt={product.title} 
                  />
                ) : (
                  <div className="details-gallery-empty">
                    <span className="details-gallery-empty-label">LUOMI ASSET</span>
                  </div>
                )}
              </div>

              {/* Comprehensive visual asset thumbnails listing */}
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
                        alt={`Asset ${idx + 1}`} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column Right: Listing Metadata & Variants Inventory Breakdown */}
            <div className="details-info-section">
              
              {/* Product Info Heading */}
              <div className="details-meta-labels">
                <div className="flex justify-between items-center w-full">
                  <span className="details-brand-tag">Atelier Silhouette</span>
                  <div className="flex items-center gap-1.5 text-xs text-[#888888]">
                    <FiCalendar size={11} />
                    <span>Listed: {new Date(product.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <h1 className="details-title">{product.title || 'Untitled Piece'}</h1>
              </div>

              {/* Quick Metrics Bar */}
              <div className="preview-metrics-row">
                <div className="metric-box">
                  <FiLayers size={14} className="text-[#888888]" />
                  <div className="metric-box-text">
                    <span className="metric-box-label">Variants</span>
                    <span className="metric-box-val">{product.variants?.length || 0} Types</span>
                  </div>
                </div>

                <div className="metric-box">
                  <FiBox size={14} className="text-[#888888]" />
                  <div className="metric-box-text">
                    <span className="metric-box-label">Total Inventory</span>
                    <span className="metric-box-val">{totalStock} Units</span>
                  </div>
                </div>

                <div className="metric-box">
                  <FiDollarSign size={14} className="text-[#888888]" />
                  <div className="metric-box-text">
                    <span className="metric-box-label">Base Catalog Price</span>
                    <span className="metric-box-val">{getCurrencySymbol(product.price?.currency)}{formatPrice(product.price?.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Storytelling Narrative Description */}
              <div className="narrative-section">
                <label className="section-heading-label">Atelier Storytelling Narrative</label>
                <div className="details-desc-area">
                  {product.description || "No catalog description has been provided for this silhouette."}
                </div>
              </div>

              {/* Dynamic Variants & Attributes Catalog Listing */}
              <div className="variants-inventory-section">
                <label className="section-heading-label">Active Variants & Attributes Portfolio</label>
                
                <div className="variants-grid-breakdown">
                  {/* Base Product (Original) */}
                  <div className="variant-inventory-card">
                    
                    {/* Card Header pricing & stock */}
                    <div className="card-head-row">
                      <span className="variant-index-tag">Original Option</span>
                      <div className="flex items-center gap-3">
                        {typeof product.stock === 'number' && (
                          <span className={`stock-status-badge ${product.stock === 0 ? 'stock-out' : product.stock <= 5 ? 'stock-low' : 'stock-in'}`}>
                            {product.stock} Units - {product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? 'Low Stock' : 'In Stock'}
                          </span>
                        )}
                        <span className="variant-card-price">
                          {getCurrencySymbol(product.price?.currency)}
                          {formatPrice(product.price?.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Attributes badges array */}
                    <div className="attributes-badges-row">
                      <div className="attr-pill-badge">
                        <span className="attr-badge-key">Included Images</span>
                        <span className="attr-badge-val">{product.images?.length || 0}</span>
                      </div>
                    </div>

                    {/* Variant image previews if any */}
                    {product.images && product.images.length > 0 && (
                      <div className="variant-asset-images">
                        <span className="text-[9px] uppercase tracking-widest text-[#888888] font-label mb-1 block">Base Visual Assets:</span>
                        <div className="flex gap-2.5 items-center flex-wrap">
                          {product.images.map((img, imgIdx) => (
                            <div 
                              key={img._id || imgIdx} 
                              className="asset-mini-thumb"
                              onClick={() => setActiveImgUrl(img.url)}
                              title="Click to view image"
                            >
                              <img src={img.url} alt="Original asset" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Variants */}
                  {product.variants && product.variants.map((variant, idx) => {
                      // Calculate stock state styling
                      const stockVal = variant.stock ?? 0
                      let stockStateClass = 'stock-in'
                      let stockStateLabel = 'In Stock'
                      if (stockVal === 0) {
                        stockStateClass = 'stock-out'
                        stockStateLabel = 'Out of Stock'
                      } else if (stockVal <= 5) {
                        stockStateClass = 'stock-low'
                        stockStateLabel = 'Low Stock'
                      }

                      return (
                        <div key={variant._id || idx} className="variant-inventory-card">
                          
                          {/* Card Header pricing & stock */}
                          <div className="card-head-row">
                            <span className="variant-index-tag">Variant #{idx + 1}</span>
                            <div className="flex items-center gap-3">
                              <span className={`stock-status-badge ${stockStateClass}`}>
                                {stockVal} Units - {stockStateLabel}
                              </span>
                              <span className="variant-card-price">
                                {getCurrencySymbol(variant.price?.currency || product.price?.currency)}
                                {formatPrice(variant.price?.amount || product.price?.amount)}
                              </span>
                            </div>
                          </div>

                          {/* Attributes badges array */}
                          <div className="attributes-badges-row">
                            {variant.attributes && Object.keys(variant.attributes).length > 0 ? (
                              Object.entries(variant.attributes).map(([key, val], aIdx) => (
                                <div key={aIdx} className="attr-pill-badge">
                                  <span className="attr-badge-key">{key}</span>
                                  <span className="attr-badge-val">{val}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-[#888888] italic tracking-wide">No Attributes</span>
                            )}
                          </div>

                          {/* Variant image previews if any */}
                          {variant.images && variant.images.length > 0 && (
                            <div className="variant-asset-images">
                              <span className="text-[9px] uppercase tracking-widest text-[#888888] font-label mb-1 block">Variant Visual Assets:</span>
                              <div className="flex gap-2.5 items-center flex-wrap">
                                {variant.images.map((img, imgIdx) => (
                                  <div 
                                    key={img._id || imgIdx} 
                                    className="asset-mini-thumb"
                                    onClick={() => setActiveImgUrl(img.url)}
                                    title="Click to view image"
                                  >
                                    <img src={img.url} alt="Variant asset" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-[9px] font-label text-gray-500 uppercase tracking-widest text-right mt-1 opacity-40 select-none">
                            Variant ID: {variant._id || 'None'}
                          </div>

                        </div>
                      )
                    })}
                  </div>
              </div>

            </div>

          </div>
        )}

      </div>
      
    </div>
  )
}

export default Sellerproductdetails
