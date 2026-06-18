# Luomi Atelier

A full-stack luxury fashion e-commerce platform built with the MERN stack.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| Cache / Session Blacklist | Redis (ioredis, RedisLabs) |
| Authentication | JWT (httpOnly cookies) + bcryptjs + Google OAuth 2.0 |
| Payments | Razorpay (HMAC-SHA256 signature verification) |
| Email | Brevo (SendinBlue) transactional email API |
| File Storage | ImageKit CDN |
| AI Assistant | LangChain + Google Gemini 2.5 Flash (with smart fallback) |
| AI Photo Validation | Ollama llama3.2-vision (with metadata fallback) |
| Frontend | React 19, Vite 8, Redux Toolkit |
| Styling | Vanilla CSS + Tailwind CSS v4 |

---

## 📁 Project Structure

```
Luomi/
├── Backend/           # Node.js Express REST API
│   ├── server.js      # Entry point
│   └── src/
│       ├── app.js               # Express setup, CORS, routes, error handler
│       ├── config/
│       │   ├── config.js        # Centralized env validation + config object
│       │   ├── db.js            # MongoDB connection
│       │   └── cache.js         # Redis (ioredis) client
│       ├── Middleware/
│       │   ├── authtoken.middleware.js    # JWT + Redis blacklist check
│       │   ├── authbuyer.middleware.js    # Buyer-only routes
│       │   ├── authseller.middleware.js   # Seller-only routes
│       │   └── authdelivery.middleware.js # Delivery-only routes
│       ├── models/              # Mongoose models (user, product, cart, order, wishlist)
│       ├── controllers/         # Business logic (auth, product, cart, order, wishlist, ai)
│       ├── services/            # Mailer (Brevo), Storage (ImageKit), Cleanup (cron)
│       ├── dao/                 # Cart aggregation pipeline (CartDAO)
│       ├── Routes/              # Express routers
│       ├── utils/               # OTP generator
│       └── validator/           # Input validation rules
└── Frontend/          # React + Vite SPA
    └── src/app/
        ├── features/
        │   ├── auth/      # Login, Register, OTP, Google, Settings
        │   ├── products/  # Home, Product Details, Seller Dashboard, Delivery Dashboard
        │   ├── cart/      # Cart, Checkout (COD + Razorpay), Order Success
        │   └── wishlist/
        └── app.routes.jsx, app.store.js
```

---

## 🔐 Authentication & Authorization

- **Email/Password** with OTP verification via Brevo
- **Google OAuth 2.0** via passport-google-oauth20
- JWT stored in `httpOnly`, `secure`, `sameSite` cookie (7-day expiry)
- **Token blacklisting**: On logout, token stored in Redis (TTL 1h) — old tokens immediately rejected
- **Role-based access**: `buyer`, `seller`, `delivery` — enforced via middleware at the route level

---

## 🛡️ Production-Grade Middleware (AWS-Ready)

### Helmet.js — HTTP Security Headers
Automatically sets all recommended headers:
- `Strict-Transport-Security` (HSTS) — forces HTTPS
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options` — prevents MIME sniffing
- `X-XSS-Protection` — browser XSS filter
- `Referrer-Policy` — controls referrer leakage

### Rate Limiting — Redis-Backed (Auto-Scaling Aware ⭐)
```
Global API:  200 requests / 15 min / IP
Auth routes: 20 attempts / 15 min / IP  (brute force protection)
```
> **Why Redis store matters for AWS Auto Scaling**: If you use in-memory rate limiting, each EC2 instance has its own counter. So with 5 instances, an attacker can make 5× the requests. The Redis-backed store is **shared across all instances** — rate limiting is truly global regardless of how many servers are running.

### Compression — GZIP Responses
All API responses are gzip-compressed. Reduces payload size ~70%.

### Health Check Endpoint — `/health`
```json
GET /health → 200 OK
{
  "status": "ok",
  "service": "luomi-api",
  "environment": "production",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": "3600s"
}
```
AWS ALB, ECS, App Runner, and Kubernetes all use this to determine if the instance is healthy.

### Graceful Shutdown — SIGTERM Handler
When AWS Auto Scaling terminates an instance (scale-in), it sends `SIGTERM`. Without a handler, all in-flight requests are **dropped immediately**.

With our handler:
1. Server stops accepting new connections
2. Existing requests get up to **10 seconds** to complete
3. Process exits cleanly — zero dropped requests during scale events

```js
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('uncaughtException', ...)
process.on('unhandledRejection', ...)
```

### Morgan — Production Log Format
- Development: `dev` (coloured, concise)
- Production: `combined` (Apache-style, compatible with AWS CloudWatch, Datadog, etc.)

---

## 🛒 Order Lifecycle

```
Buyer → Add to Cart → Checkout (COD/Razorpay)
  ↓ Order created (status: processing)
  ↓ Confirmation email sent
Seller → Mark "Out for Delivery"
  ↓ STOCK DECREMENTED (variant or base stock)
  ↓ "Out for Delivery" email sent to buyer
Delivery Partner (same city) → Sees order in dashboard
  ↓ Validates: product ID code + COD payment tick + delivery photo
  ↓ AI validates photo (Ollama vision / fallback metadata check)
  ↓ Photo uploaded to ImageKit
  ↓ Order status: delivered | paymentStatus: paid (COD)
  ↓ Seller notification emails sent
```

---

## 🤖 Jerry — AI Shopping Assistant

Powered by **LangChain + Google Gemini 2.5 Flash**. Jerry can:
- Answer product-specific questions (sizes, colors, fit, material, price, stock)
- Recommend products from the same category with markdown clickable links
- Give body-type based size recommendations (slim/heavy build)
- Handle budget queries — find items under a price limit
- Smart offline fallback if Gemini is unavailable

---

## ⚙️ Environment Variables (Backend)

Create `Backend/.env` with the following:

```env
MONGO_URI=mongodb+srv://...
JWT=your_jwt_secret_64_chars
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BREVO_API_KEY=...
GOOGLE_EMAIL=your@email.com
REDIS_HOST=...
REDIS_PORT=...
REDIS_PASSWORD=...
IMAGEKIT_PRIVATE_KEY=...
RAZORPAY_KEY_ID=rzp_test_or_live_...
RAZORPAY_KEY_SECRET=...
NODE_ENVIRONMENT=development  # or: production
GEMINI_API_KEY=...
FRONTEND_URL=http://localhost:5173  # or: https://your-domain.com
```

---

## 🚀 Running Locally

### Backend
```bash
cd Backend
npm install
npm run dev       # nodemon for hot-reload
```

### Frontend
```bash
cd Frontend
npm install
npm run dev       # Vite dev server on port 5173
```

The Vite proxy routes `/api/*` → `http://localhost:3000` automatically in dev.

---

## 🏭 Production Deployment (AWS)

### Backend (EC2 / App Runner / Elastic Beanstalk)
1. Set all environment variables on the server (not in `.env` file)
2. Set `NODE_ENVIRONMENT=production`, `FRONTEND_URL=https://yourdomain.com`
3. Switch Razorpay keys to **live** keys
4. Add Google OAuth callback URI to Google Console
5. Run: `npm start` (uses `node server.js` directly, no nodemon)
6. Use **pm2** for process management: `pm2 start server.js --name luomi-api`
7. Set up nginx reverse proxy with SSL (or use AWS ALB + ACM)

### Frontend (S3 + CloudFront / AWS Amplify)
1. Build: `npm run build` in `/Frontend`
2. Upload `dist/` to S3 bucket
3. Configure CloudFront — redirect all 404s to `index.html` (SPA routing)
4. Update axios baseURL to point to your backend API domain in production

> ⚠️ **Never commit `.env` to git.** Add it to `.gitignore`.

---

## 📧 Email Notifications

Transactional emails are sent at these milestones:
- ✅ Order Confirmed (COD)
- ✅ Payment Verified (Razorpay)
- ✅ Order Out for Delivery
- ✅ Order Delivered (to seller)

---

## 🧹 Background Jobs

- **Cleanup service** (`cleanup.service.js`): Runs every 5 minutes to delete Razorpay `pending` orders older than 10 minutes (abandoned checkouts)
