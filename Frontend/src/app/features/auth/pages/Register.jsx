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

function Register() {
  const navigate = useNavigate()
  const { user, handleregister, handlegoogleauth, handleverifyotp, loading } = useauth()

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

  // Step 1: Registration form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Step 2: OTP verification
  const [step, setStep] = useState(1) // 1 = register form, 2 = OTP screen
  const [otp, setOtp] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

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

  // Resend timer effect
  useEffect(() => {
    let interval
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

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
    }

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
      { x: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
      '-=0.6'
    )

    // CTA button fade entrance
    entranceTimeline.fromTo(buttonRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.5'
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
  }, [step]) // Re-run entrance when step changes to animate new form inputs

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
  }, [step, loading]) // Re-bind on state/step changes when button renders

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validations
    if (!fullName) {
      setError('Full Name is required.')
      return
    }
    if (fullName.trim().length < 3) {
      setError('Full Name must be at least 3 characters long.')
      return
    }
    if (!email) {
      setError('Email address is required.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).')
      return
    }

    try {
      const res = await handleregister({
        email,
        fullname: fullName,
        password,
        isseller: false
      })
      if (res && res.requiresOtp) {
        setOtpEmail(email)
        setStep(2)
        setResendTimer(30)
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors[0].msg)
      } else if (err.msg) {
        setError(err.msg)
      } else {
        setError('Registration failed. Please check your credentials and try again.')
      }
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!otp) {
      setError('OTP is required.')
      return
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.')
      return
    }

    try {
      const res = await handleverifyotp({
        email: otpEmail,
        otp
      })
      if (res.user.role === "buyer" && res.success) {
        navigate('/')
      } else if (res.user.role === "seller" && res.success) {
        navigate('/dashbord/seller')
      } else if (res.user.role === "delivery" && res.success) {
        navigate('/dashbord/delivery')
      }
    } catch (err) {
      if (err.msg === 'OTP expired') {
        setError('OTP expired, please register again')
      } else if (err.msg === 'Account already verified') {
        setError('Account already exists, please login')
      } else if (err.msg === 'Invalid OTP') {
        setError('Invalid OTP, please try again')
      } else if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors[0].msg)
      } else if (err.msg) {
        setError(err.msg)
      } else {
        setError('Something went wrong, please try again')
      }
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setResendLoading(true)

    try {
      const res = await handleregister({
        email: otpEmail,
        fullname: fullName,
        password,
        isseller: false
      })
      if (res && res.requiresOtp) {
        setResendTimer(30)
      }
    } catch (err) {
      if (err.msg) {
        setError(err.msg)
      } else {
        setError('Failed to resend OTP, please try again.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const headingText = step === 1 ? "Create Account" : "Verify Email"

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
              {step === 1 ? (
                <>Join us to find your next <span className="font-bold">favorite</span> outfit.</>
              ) : (
                <>Check your email for the <span className="font-bold">OTP code</span>.</>
              )}
            </h1>
            <p className="text-[var(--dash-subtitle)] text-[15px]">
              {step === 1 ? "Welcome! Please enter your details to register." : "Enter the 6-digit code we sent you."}
            </p>
          </div>

            {step === 1 ? (
              <>
                {/* STEP 1: Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="w-full flex flex-col text-left">
                  {/* Error messaging */}
                  {error && (
                    <p className="font-mono text-xs text-red-500 mb-4 tracking-wide font-bold uppercase">
                      {error}
                    </p>
                  )}

                  {/* Field 1: Full Name */}
                  <div className="auth-input-wrapper flex flex-col">
                    <label className="auth-label">Full Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="auth-input"
                    />
                  </div>

                  {/* Field 2: Email Address */}
                  <div className="auth-input-wrapper flex flex-col">
                    <label className="auth-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                    />
                  </div>

                  {/* Field 3: Password */}
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

                  {/* CTA Button */}
                  <button
                    ref={buttonRef}
                    type="submit"
                    disabled={loading}
                    className="cta-button bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
                  >
                    {loading ? 'Creating...' : 'Register'}
                  </button>
                </form>

                {/* Google Sign Up Divider */}
                <div className="social-divider">
                  <div className="social-divider-line" />
                  <span className="social-divider-text">or</span>
                  <div className="social-divider-line" />
                </div>

                {/* Google Register Button */}
                <div className="google-signin-container">
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
                      setError('Google sign-up failed. Please try again.')
                    }}
                    mode="signup"
                  />
                </div>
              </>
            ) : (
              <>
                {/* STEP 2: OTP Verification */}
                <form onSubmit={handleOtpSubmit} className="w-full flex flex-col text-left">
                  {/* Error messaging */}
                  {error && (
                    <p className="font-mono text-xs text-red-500 mb-4 tracking-wide font-bold uppercase">
                      {error}
                    </p>
                  )}

                  {/* OTP sent message */}
                  <p className="font-body text-sm text-[var(--dash-subtitle)] mb-6 tracking-wide text-left">
                    OTP sent to: <span className="font-bold text-[var(--dash-title)]">{otpEmail}</span>
                  </p>

                  {/* OTP Input */}
                  <div className="auth-input-wrapper flex flex-col">
                    <label className="auth-label">Enter OTP</label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="auth-input otp-input"
                    />
                  </div>

                  {/* Verify Button */}
                  <button
                    ref={buttonRef}
                    type="submit"
                    disabled={loading}
                    className="cta-button mt-4 bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>

                {/* Resend OTP Section */}
                <div className="social-divider mt-6">
                  <div className="social-divider-line" />
                  <span className="social-divider-text">resend</span>
                  <div className="social-divider-line" />
                </div>

                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || resendLoading}
                  className="resend-otp-button rounded-full py-3"
                >
                  {resendTimer > 0 ? (
                    <>
                      Resend OTP in <span className="ml-2 font-bold">{resendTimer}s</span>
                    </>
                  ) : (
                    resendLoading ? 'Sending...' : 'Resend OTP'
                  )}
                </button>
              </>
            )}
        </div>

        {/* Bottom Footer links */}
        <div className="w-full text-center flex flex-col items-center mt-6 pt-2">
          {step === 1 && (
            <p className="auth-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Log in
              </Link>
            </p>
          )}
          <p className="auth-legal-text">
            © 2026 LUOMI LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
