import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/dist/locomotive-scroll.css'
import { FiSun, FiMoon } from 'react-icons/fi'
import { DiJira } from "react-icons/di";
import Logo from '../components/Logo'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useauth } from '../hook/useauth'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const { user, handlelogin, handlegoogleauth, handleforgotpassword, handleresetpassword, loading } = useauth()

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'delivery') {
        navigate('/dashbord/delivery')
      } else if (user.role === 'seller') {
        navigate('/dashbord/seller')
      } else {
        navigate('/')
      }
    }
  }, [user, loading, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newForgotPwd, setNewForgotPwd] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1 = enter email, 2 = enter otp + reset password
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    if (!forgotEmail) {
      setForgotError('Please enter your email.')
      return
    }
    setForgotLoading(true)
    try {
      await handleforgotpassword({ email: forgotEmail })
      setForgotSuccess('OTP sent successfully to your email.')
      setForgotStep(2)
    } catch (err) {
      setForgotError(err.msg || 'Failed to send OTP.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    if (!forgotOtp) {
      setForgotError('Please enter the 6-digit OTP.')
      return
    }
    if (!newForgotPwd) {
      setForgotError('Please enter your new password.')
      return
    }
    if (newForgotPwd.length < 8) {
      setForgotError('New password must be at least 8 characters.')
      return
    }
    setForgotLoading(true)
    try {
      await handleresetpassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: newForgotPwd
      })
      setForgotSuccess('Password reset successfully. You can now log in.')
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotEmail('')
        setForgotOtp('')
        setNewForgotPwd('')
        setForgotSuccess('')
      }, 3000)
    } catch (err) {
      setForgotError(err.msg || 'Failed to reset password.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Refs for GSAP animations
  const scrollRef = useRef(null)
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  const buttonRef = useRef(null)

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

    // Left editorial column slow blur-in fade
    gsap.fromTo('.editorial-column',
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

      if (res.data.user.role === "buyer" && res.success) {
        navigate('/')
      } else if (res.data.user.role === "seller" && res.success) {
        navigate('/dashbord/seller')
      } else if (res.data.user.role === "delivery" && res.success) {
        navigate('/dashbord/delivery')
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
    <div data-scroll-container ref={scrollRef} className="genz-grid-bg genz-auth-body">
      {/* Custom Cursors */}
      <div ref={cursorDotRef} className="custom-cursor-dot" />
      <div ref={cursorRingRef} className="custom-cursor-ring" />

      {/* Left Column: Fashion Editorial Column (50% Width) */}
      <div className="editorial-column relative hidden md:block">
        <div
          className="absolute inset-0 w-full h-full object-cover scale-105"
          data-scroll
          data-scroll-speed="-1.5"
          style={{
            backgroundImage: theme === 'dark' ? "url('/editorial_fashion.png')" : "url('/editorial_fashion_light.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="editorial-overlay" />

        {/* Corner 1: Top Left */}
        <div className="absolute top-10 left-10 z-10">
          <span className="font-body text-sm font-bold editorial-corner-text" style={{ letterSpacing: '0.3em' }}>
            LUOMI
          </span>
        </div>

        {/* Corner 2: Top Right */}
        <div className="absolute top-10 right-10 z-10 text-right">
          <span className="font-mono text-[10px] uppercase editorial-corner-text" style={{ letterSpacing: '0.25em' }}>
            ATELIER / SELECTION '26
          </span>
        </div>

        {/* Corner 3: Bottom Left */}
        <div className="absolute bottom-10 left-10 z-10">
          <span className="font-mono text-[10px] uppercase editorial-corner-text" style={{ letterSpacing: '0.2em' }}>
            EST. 2026 // STUDIO
          </span>
        </div>
      </div>

      {/* Right Column: Spacious Form Column (50% Width) */}
      <div className="form-column">

        {/* Center Auth Card */}
        <div className="genz-auth-card">
          {/* Logo above text */}
          <div className="mb-4 flex justify-start w-full auth-logo-container">
            <div className="logo-scale-wrapper">
              <Logo />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-left">
            <h1 className="font-body text-[32px] md:text-[38px] font-light mb-3 leading-tight tracking-tight text-[var(--dash-title)]">
              Your next <span className="font-bold">favorite</span> outfit is<br />only one click away.
            </h1>
            <p className="text-[var(--dash-subtitle)] text-[15px]">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col text-left">
            {/* Error messaging */}
            {error && (
              <p className="font-mono text-xs text-red-500 mb-4 tracking-wide font-bold uppercase">
                {error}
              </p>
            )}

            {/* Field 1: Email */}
            <div className="auth-input-wrapper flex flex-col">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>

            {/* Field 2: Password */}
            <div className="auth-input-wrapper flex flex-col relative">
              <label className="auth-label">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                style={{ paddingRight: '50px' }}
              />
              {/* Minimal text show/hide */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-mono font-bold tracking-[1.5px] uppercase text-[var(--dash-subtitle)] hover:text-[var(--dash-title)] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="w-full flex justify-end -mt-2 mb-6 footer-animate">
              <button
                type="button"
                onClick={() => {
                  setForgotError('')
                  setForgotSuccess('')
                  setForgotStep(1)
                  setShowForgotModal(true)
                }}
                className="text-xs font-mono text-[var(--dash-subtitle)] hover:text-[var(--dash-title)] underline transition-colors cursor-pointer"
              >
                forgot_password?
              </button>
            </div>

            {/* CTA Button */}
            <button
              ref={buttonRef}
              type="submit"
              disabled={loading}
              className="cta-button bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
            >
              {loading ? 'Logging in...' : 'Login'}
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
        <div className="w-full text-center flex flex-col items-center mt-6 pt-2">
          <p className="auth-text-muted footer-animate">
            don't have an account?{' '}
            <Link to="/register" className="auth-link">
              create one
            </Link>
          </p>
          <p className="auth-legal-text footer-animate">
            © 2026 LUOMI LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[var(--dash-card-bg)] border border-[var(--dash-card-border)] text-[var(--dash-text)] w-full max-w-[420px] p-8 rounded-none relative flex flex-col gap-6 shadow-2xl transition-all duration-300">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[var(--dash-subtitle)] hover:text-[var(--dash-title)] text-lg cursor-pointer font-bold"
            >
              &times;
            </button>

            <div className="flex flex-col gap-2 text-left">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-[var(--dash-title)]">
                Reset Password
              </h2>
              <p className="text-xs text-[var(--dash-subtitle)] font-body">
                {forgotStep === 1
                  ? "Enter your email to request a 6-digit OTP code."
                  : "Enter the OTP code received and set a new password."}
              </p>
            </div>

            {forgotError && (
              <p className="text-xs text-red-500 font-mono uppercase tracking-wider font-semibold text-left">
                {forgotError}
              </p>
            )}

            {forgotSuccess && (
              <p className="text-xs text-green-500 font-mono uppercase tracking-wider font-semibold text-left">
                {forgotSuccess}
              </p>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotEmailSubmit} className="flex flex-col gap-5 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="cta-button w-full mt-2"
                >
                  {forgotLoading ? "SENDING OTP..." : "REQUEST OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetSubmit} className="flex flex-col gap-5 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength="6"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="auth-input otp-input"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Create new password..."
                    value={newForgotPwd}
                    onChange={(e) => setNewForgotPwd(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="cta-button w-full mt-2"
                >
                  {forgotLoading ? "RESETTING..." : "UPDATE PASSWORD"}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="text-[10px] font-mono text-[var(--dash-subtitle)] hover:text-[var(--dash-title)] uppercase tracking-wider text-center cursor-pointer transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
