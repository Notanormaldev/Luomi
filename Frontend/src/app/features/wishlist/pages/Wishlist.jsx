import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useauth } from '../../auth/hook/useauth'
import { usewishlist } from '../hook/usewishlist'
import { usecart } from '../../cart/hook/usecart'
import Logo from '../../auth/components/Logo'
import { FiHeart, FiShoppingBag, FiArrowLeft, FiUser, FiX, FiArrowRight } from 'react-icons/fi'
import './Wishlist.css'

export default function Wishlist() {
  const navigate = useNavigate()
  const { user } = useauth()
  const { items: wishlistItems, handleGetWishlist, handleToggleWishlist, loading: wishlistLoading } = usewishlist()
  const { items: cartItems, handleAddToCart, handleGetCart } = usecart()

  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')
  const [loading, setLoading] = useState(true)

  // Theme Sync
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

  // Fetch wishlist on page load
  useEffect(() => {
    if (user) {
      const fetchAll = async () => {
        setLoading(true)
        try {
          await handleGetWishlist()
          await handleGetCart()
        } catch (err) {
          console.error("Error loading wishlist details:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchAll()
    } else {
      setLoading(false)
    }
  }, [user])

  const fmt = (amount) => {
    if (amount === undefined || amount === null) return '0'
    const n = parseFloat(amount)
    return isNaN(n) ? '0' : n.toLocaleString('en-IN')
  }

  const handleRemove = async (productId) => {
    await handleToggleWishlist({ productId })
  }

  const handleMoveToBag = async (product) => {
    if (product.variants && product.variants.length > 0) {
      navigate(`/product/${product._id}`)
      return
    }
    const existing = cartItems.find(i => i.product._id === product._id && !i.selectedVariant)
    const currentQty = existing?.quantity || 0
    const stock = product.stock ?? 0
    if (stock > 0 && currentQty + 1 > stock) {
      alert(`Only ${stock} items in stock`)
      return
    }
    const res = await handleAddToCart({ productId: product._id, quantity: 1 })
    if (res.success) {
      // Remove from wishlist after moving to bag
      await handleToggleWishlist({ productId: product._id })
      alert('Moved item to Bag!')
    } else {
      alert(res.error || 'Failed to add to bag')
    }
  }

  const totalCartItems = cartItems.reduce((acc, i) => acc + i.quantity, 0)

  if (!user && !loading) {
    return (
      <div className="wl-root">
        <div className="wl-navbar">
          <div className="wl-nav-inner">
            <div className="wl-nav-left">
              <button className="wl-icon-btn" onClick={() => navigate('/')}><FiArrowLeft size={18} /></button>
              <Link to="/" className="wl-logo-link"><Logo /></Link>
            </div>
          </div>
        </div>
        <div className="wl-empty" style={{ paddingTop: 120 }}>
          <div className="wl-empty-icon"><FiUser size={32} /></div>
          <h2 className="wl-empty-title">Sign in to view your wishlist</h2>
          <p className="wl-empty-text">Keep track of your favorite luxury pieces</p>
          <button className="wl-empty-cta" onClick={() => navigate('/login')}>
            SIGN IN <FiArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="wl-page-loader">
        <div className="wl-nano-bar"></div>
        <h1 className="wl-loader-logo">LUOMI</h1>
      </div>
    )
  }

  const isEmpty = !wishlistItems || wishlistItems.length === 0

  return (
    <div className="wl-root">
      {/* Navbar */}
      <div className="wl-navbar">
        <div className="wl-nav-inner">
          <div className="wl-nav-left">
            <button className="wl-icon-btn" onClick={() => navigate(-1)}>
              <FiArrowLeft size={18} />
            </button>
            <Link to="/" className="wl-logo-link"><Logo /></Link>
          </div>
          <div className="wl-nav-right">
            {user?.role === 'seller' && (
              <Link to="/dashbord/seller" className="wl-dashboard-link" title="Go to Seller Atelier Dashboard">
                Atelier
              </Link>
            )}
            <button className="wl-cart-btn wl-icon-btn" onClick={() => navigate('/cart')}>
              <FiShoppingBag size={19} />
              {totalCartItems > 0 && <span className="wl-cart-badge">{totalCartItems}</span>}
            </button>
            <Link to="/settings" className="wl-icon-btn"><FiUser size={19} /></Link>
          </div>
        </div>
      </div>

      {/* Main Page Body */}
      <div className="wl-page">
        <div className="wl-page-header">
          <div>
            <h1 className="wl-page-title">My Wishlist</h1>
            {!isEmpty && (
              <p className="wl-page-subtitle">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved in your luxury catalog
              </p>
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className="wl-empty">
            <div className="wl-empty-icon">
              <FiHeart size={32} />
            </div>
            <h2 className="wl-empty-title">Your wishlist is empty</h2>
            <p className="wl-empty-text">Explore our collection and add pieces you love to your wishlist</p>
            <button className="wl-empty-cta" onClick={() => navigate('/')}>
              DISCOVER PIECES <FiArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="wl-grid">
            {wishlistItems.map(product => {
              if (!product) return null
              const image = product.images?.[0]?.url
              return (
                <div key={product._id} className="wl-card">
                  <div className="wl-card-img-wrap" onClick={() => navigate(`/product/${product._id}`)}>
                    {image ? (
                      <img src={image} alt={product.title} className="wl-card-img" />
                    ) : (
                      <div className="wl-card-img-placeholder">LUOMI</div>
                    )}
                    <button
                      className="wl-card-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(product._id)
                      }}
                      title="Remove from Wishlist"
                    >
                      <FiX size={15} />
                    </button>
                  </div>

                  <div className="wl-card-info">
                    <h3 className="wl-card-title" onClick={() => navigate(`/product/${product._id}`)}>
                      {product.title}
                    </h3>
                    <p className="wl-card-price">₹{fmt(product.price?.amount)}</p>
                    <button
                      className="wl-card-bag-btn"
                      onClick={() => handleMoveToBag(product)}
                    >
                      ADD TO BAG
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
