import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import config from './config/config.js'
import redis from './config/cache.js'
import authrouter from './Routes/auth.route.js'
import productroute from './Routes/product.route.js'
import cartroute from './Routes/cart.route.js'
import airoute from './Routes/ai.route.js'
import wishlistroute from './Routes/wishlist.route.js'
import orderRoute from './Routes/order.route.js'

const isProduction = config.NODE_ENVIRONMENT === 'production'

const app = express()

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
// Sets X-Frame-Options, X-XSS-Protection, HSTS, Content-Security-Policy etc.
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow ImageKit images
    contentSecurityPolicy: false // disabled — frontend handles its own CSP
}))

// ─── GZIP Compression ─────────────────────────────────────────────────────────
// Reduces response payload size, faster API responses
app.use(compression())

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            config.FRONTEND_URL,
            'http://localhost:5173'
        ].filter(Boolean)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))   // explicit limit prevents payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Logging ──────────────────────────────────────────────────────────────────
// 'combined' format in production for AWS CloudWatch / log aggregators
// 'dev'      format in development for readable terminal output
app.use(morgan(isProduction ? 'combined' : 'dev'))

// ─── Global Rate Limiter (Redis-backed, works across multiple EC2 instances) ──
// This is the "auto-scaling aware" rate limiter — shared state via Redis,
// so even if 10 EC2 instances are running, 100 req/15min is global, not per-instance.
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,     // 15 minutes
    max: 200,                      // 200 requests per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, msg: 'Too many requests. Please try again after 15 minutes.' },
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    })
})

// Strict limiter for auth routes (login, register, OTP) — prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,     // 15 minutes
    max: 20,                       // max 20 auth attempts per IP per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, msg: 'Too many authentication attempts. Please try again after 15 minutes.' },
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    })
})

app.use(globalLimiter)

// ─── Health Check Endpoint ─────────────────────────────────────────────────────
// AWS ALB / ECS / App Runner / Kubernetes liveness & readiness probes hit this.
// Must return 200 quickly — no DB queries here.
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'luomi-api',
        environment: config.NODE_ENVIRONMENT,
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`
    })
})

// ─── Passport (Google OAuth) ───────────────────────────────────────────────────
app.use(passport.initialize())
passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile)
}))

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authrouter)   // stricter limit on auth
app.use('/api/product', productroute)
app.use('/api/cart', cartroute)
app.use('/api/ai', airoute)
app.use('/api/wishlist', wishlistroute)
app.use('/api/order', orderRoute)

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, msg: 'Route not found' })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Never leaks stack traces in production
app.use((err, req, res, next) => {
    console.error('[Global Error]', err.stack || err.message)
    res.status(err.status || 500).json({
        success: false,
        msg: isProduction ? 'Internal server error' : (err.message || 'Internal server error')
    })
})

export default app