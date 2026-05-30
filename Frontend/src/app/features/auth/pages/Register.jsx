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

function Register() {
  const navigate = useNavigate()
  const { handleregister, handlegoogleauth, handleverifyotp, loading } = useauth()

  // Step 1: Registration form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
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
  const sellerToggleRef = useRef(null)

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

    // isSeller toggle fades in last and very subtly (max opacity 0.5)
    if (sellerToggleRef.current) {
      entranceTimeline.fromTo(sellerToggleRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.6, ease: 'power2.out' },
        '-=0.2'
      )
    }

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
        isseller: isSeller
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
        if (res.user.role == "buyer" && res.success) {
        navigate('/')
      }else if(res.user.role == "seller" && res.success){
        navigate('/dashbord/seller')
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
        isseller: isSeller
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
      <div className="form-column w-full md:w-[45%] h-screen flex flex-col justify-between py-8 px-8 sm:px-16 overflow-y-auto z-10 no-scrollbar">
        {/* Top brand header */}
        <div className="w-full flex flex-col items-center shrink-0">
          <Logo />
          <div className="divider-line h-[1px] auth-divider-line w-full mt-4 mb-2 origin-center" />
        </div>

        {/* Center Auth Form */}
        <div className="flex-1 w-full max-w-[400px] mx-auto flex flex-col justify-center">
          {/* Header */}
          <h1 className="font-heading text-[34px] sm:text-[38px] font-medium auth-heading mb-5 leading-none tracking-tight flex flex-row flex-wrap">
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

          {step === 1 ? (
            <>
              {/* STEP 1: Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="w-full flex flex-col text-left">
                {/* Error messaging */}
                {error && (
                  <p className="font-body text-xs text-red-500 mb-4 tracking-wide font-medium uppercase">
                    {error}
                  </p>
                )}

                {/* Field 1: Full Name */}
                <div className="auth-input-wrapper flex flex-col">
                  <label className="auth-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                  />
                  <span className="input-underline" />
                </div>

                {/* Field 2: Email Address */}
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

                {/* Field 3: Password */}
                <div className="auth-input-wrapper flex flex-col relative">
                  <label className="auth-label">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password..."
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

                {/* isSeller Pill Switch Toggle (Bottom Right of the Form Area) */}
                <div className="w-full flex justify-end mb-4">
                  <div 
                    ref={sellerToggleRef}
                    onClick={() => setIsSeller(!isSeller)}
                    className={`switch-container ${isSeller ? 'active' : ''}`}
                  >
                    <span>Register as Seller</span>
                    <div className="pill-switch">
                      <div className="pill-switch-handle" />
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={loading}
                  className="cta-button"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'JOIN LUOMI'}
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
                  <p className="font-body text-xs text-red-500 mb-4 tracking-wide font-medium uppercase">
                    {error}
                  </p>
                )}

                {/* OTP sent message */}
                <p className="font-body text-sm auth-text-otp-desc mb-6 tracking-wide">
                  OTP sent to: <span className="font-semibold">{otpEmail}</span>
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
                    className="auth-input otp-input text-center tracking-widest text-2xl"
                  />
                  <span className="input-underline" />
                </div>

                {/* Verify Button */}
                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={loading}
                  className="cta-button mt-4"
                >
                  {loading ? 'VERIFYING...' : 'VERIFY OTP'}
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
                className="resend-otp-button"
              >
                {resendTimer > 0 ? (
                  <>
                    Resend OTP in <span className="ml-1 font-semibold">{resendTimer}s</span>
                  </>
                ) : (
                  resendLoading ? 'SENDING OTP...' : 'RESEND OTP'
                )}
              </button>
            </>
          )}
        </div>

        {/* Bottom Footer links — with proper breathing room */}
        <div className="w-full text-center flex flex-col items-center gap-3 pt-6 shrink-0">
          {step === 1 && (
            <p className="font-label text-xs auth-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="auth-link hover:text-[#C0C0C0] transition-colors">
                Log in
              </Link>
            </p>
          )}
          <p className="font-legal text-[11px] auth-legal-text tracking-wide">
            © 2026 LUOMI LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

