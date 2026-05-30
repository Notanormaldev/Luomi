import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/dist/locomotive-scroll.css'
import { FiSun, FiMoon } from 'react-icons/fi'
import Logo from '../components/Logo'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useauth } from '../hook/useauth'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const { handlelogin, handlegoogleauth, loading } = useauth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('luomi-theme', theme)
  }, [theme])

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Refs for GSAP animations
  const scrollRef = useRef(null)
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  const buttonRef = useRef(null)
  const editorialRef = useRef(null)

  useEffect(() => {
    // 1. Initialize Locomotive Scroll
    let scroll
    if (scrollRef.current) {
      scroll = new LocomotiveScroll({
        el: scrollRef.current,
        smooth: true,
        multiplier: 1.0,
      })
    }

    // 2. Custom Cursor Movement
    const onMouseMove = (e) => {
      const { clientX, clientY } = e
      
      // Instantly position the dot
      gsap.to(cursorDotRef.current, {
        x: clientX,
        y: clientY,
        duration: 0,
      })
      
      // Smoothly lag the ring behind the dot
      gsap.to(cursorRingRef.current, {
        x: clientX,
        y: clientY,
        duration: 0.15,
        ease: 'power2.out',
      })
    };

    window.addEventListener('mousemove', onMouseMove)

    // 3. Page Entrance Animations
    const entranceTimeline = gsap.timeline()
    
    // Logo entrance
    entranceTimeline.fromTo('.logo-container', 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )

    // Divider line
    entranceTimeline.fromTo('.divider-line', 
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power2.inOut' },
      '-=0.4'
    )

    // Heading splits and falls in
    entranceTimeline.fromTo('.heading-char',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, stagger: 0.03, ease: 'expo.out' },
      '-=0.4'
    )

    // Input fields stagger in from the left
    entranceTimeline.fromTo('.auth-input-wrapper',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      '-=0.6'
    )

    // CTA button fade entrance
    entranceTimeline.fromTo(buttonRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.5'
    )

    // Google Sign In & Footer links
    entranceTimeline.fromTo('.footer-animate',
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
      '-=0.4'
    )

    // Left editorial column slide-in + blur fade
    gsap.fromTo(editorialRef.current,
      { x: -60, filter: 'blur(10px)', opacity: 0 },
      { x: 0, filter: 'blur(0px)', opacity: 1, duration: 1.2, ease: 'power4.out' }
    )

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (scroll) scroll.destroy()
    }
  }, [])

  // 4. CTA Button Hover Setup (only for custom cursor scaling)
  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseEnter = () => {
      if (cursorRingRef.current) {
        cursorRingRef.current.classList.add('hovered')
      }
    }

    const handleMouseLeave = () => {
      if (cursorRingRef.current) {
        cursorRingRef.current.classList.remove('hovered')
      }
    }

    button.addEventListener('mouseenter', handleMouseEnter)
    button.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      if (button) {
        button.removeEventListener('mouseenter', handleMouseEnter)
        button.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      setError('Please enter your email.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      const res = await handlelogin({ email, password })
      console.log(res);
      
      if (res.data.user.role == "buyer" && res.success) {
        navigate('/')
      }else if(res.data.user.role == "seller" && res.success){
        navigate('/dashbord/seller')
      }

    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors[0].msg)
      } else if (err.msg) {
        setError(err.msg)
      } else {
        setError('Login failed. Please check your credentials and try again.')
      }
    }
  }

  const headingText = "Welcome Back"

  return (
    <div data-scroll-container ref={scrollRef} className="w-full min-h-screen flex flex-row overflow-hidden relative">
      {/* Floating Theme Toggle */}
      <button 
        type="button" 
        className="theme-toggle-floating" 
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      >
        {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
      </button>

      {/* Custom Cursors */}
      <div ref={cursorDotRef} className="custom-cursor-dot" />
      <div ref={cursorRingRef} className="custom-cursor-ring" />

      {/* Left editorial column (55%) */}
      <div 
        ref={editorialRef}
        className="editorial-column w-[55%] h-screen relative hidden md:block overflow-hidden"
      >
        {/* Dark/Light overlay and slow parallax image */}
        <div 
          className="absolute inset-0 w-full h-full object-cover scale-110"
          data-scroll
          data-scroll-speed="-2"
          style={{
            backgroundImage: theme === 'dark' ? "url('/editorial_fashion.png')" : "url('/editorial_fashion_light.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Theme-aware overlay gradient — subtle in light mode, deeper in dark */}
        <div className="editorial-overlay absolute inset-0 pointer-events-none" />
        
        {/* High-fashion brand Statement Pull Quote */}
        <div className="absolute inset-x-12 bottom-20 z-10 flex flex-col justify-end text-left select-none">
          <p className="font-logo text-3xl lg:text-4xl italic auth-editorial-quote leading-relaxed tracking-wider font-light max-w-xl">
            "A study in silent luxury. The architecture of modern attire."
          </p>
          <div className="h-[1px] w-20 auth-editorial-line mt-6" />
          <span className="font-label text-[11px] font-medium tracking-[2px] uppercase auth-editorial-sub mt-3">
            LUOMI EDITORIAL STILLS
          </span>
        </div>
      </div>

      {/* Right Form column (45%) */}
      <div className="form-column w-full md:w-[45%] h-screen flex flex-col justify-between py-12 px-8 sm:px-16 overflow-y-auto z-10 no-scrollbar">
        {/* Top brand header */}
        <div className="w-full flex flex-col items-center">
          <Logo />
          <div className="divider-line h-[1px] auth-divider-line w-full my-6 origin-center" />
        </div>

        {/* Center Auth Form */}
        <div className="my-auto w-full max-w-[400px] mx-auto flex flex-col justify-center">
          {/* Header */}
          <h1 className="font-heading text-[38px] font-medium auth-heading mb-8 leading-none tracking-tight flex flex-row flex-wrap">
            {headingText.split(" ").map((word, wordIdx) => (
              <span key={wordIdx} className="flex flex-row mr-3">
                {word.split("").map((char, charIdx) => (
                  <span key={charIdx} className="inline-block heading-char origin-bottom">
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col text-left">
            {/* Error messaging */}
            {error && (
              <p className="font-body text-xs text-red-500 mb-4 tracking-wide font-medium uppercase">
                {error}
              </p>
            )}

            {/* Field 1: Email */}
            <div className="auth-input-wrapper flex flex-col">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
              <span className="input-underline" />
            </div>

            {/* Field 2: Password */}
            <div className="auth-input-wrapper flex flex-col relative">
              <label className="auth-label">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <span className="input-underline" />
              {/* Minimal text show/hide */}
              <div className="absolute right-4 top-[38px] flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-label font-medium tracking-[1.5px] uppercase text-[#888888] hover:text-[#C0C0C0] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="w-full flex justify-end -mt-2 mb-6 footer-animate">
              <Link 
                to="/forgot-password" 
                className="text-xs font-label text-[#888888] hover:text-[#C0C0C0] underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* CTA Button */}
            <button
              ref={buttonRef}
              type="submit"
              disabled={loading}
              className="cta-button"
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER LUOMI'}
            </button>
          </form>

          {/* Social Divider */}
          <div className="social-divider footer-animate">
            <div className="social-divider-line" />
            <span className="social-divider-text">Or continue with</span>
            <div className="social-divider-line" />
          </div>

          {/* Google Sign-In Button */}
          <div className="google-signin-container footer-animate">
            <GoogleSignInButton 
              onSuccess={async (token) => {
                try {
                  const res = await handlegoogleauth(token)
                  if (res && res.success) {
                    navigate('/')
                  }
                } catch (err) {
                  console.error('Google auth failed:', err)
                }
              }}
              onError={() => {
                setError('Google sign-in failed. Please try again.')
              }}
              mode="login"
            />
          </div>
        </div>

        {/* Bottom Footer links */}
        <div className="w-full text-center flex flex-col items-center gap-4 mt-auto">
          <p className="font-label text-xs auth-text-muted footer-animate">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link hover:text-[#C0C0C0] transition-colors">
              Create one
            </Link>
          </p>
          <p className="font-legal text-[11px] auth-legal-text tracking-wide footer-animate">
            © 2026 LUOMI LTD. ALL RIGHTS RESERVED. PRIVACY POLICY & TERMS.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
