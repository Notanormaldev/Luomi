# Luomi Atelier — Luxury Fashion E-Commerce Platform

Luomi is a premium, state-of-the-art MERN stack e-commerce application designed for a luxury fashion brand. The platform features a responsive boutique storefront, interactive AI styling assistant, detailed buyer order histories, and dedicated dashboards for Sellers and Delivery Partners.

---

## 🛠️ Architecture & Tech Stack

Luomi is architected using modern web design principles and database technologies:

### 1. Core Platform (MERN Stack)
- **MongoDB**: Schema-defined document database using Mongoose models for products, variants, orders, carts, and users.
- **Express.js & Node.js**: Modular backend controller routes with request validation and security middlewares.
- **React (Vite)**: Clean single-page application structure utilizing custom React hooks for auth, cart, and wishlist state management.
- **Vanilla CSS**: Premium monochrome color schemes, glassmorphism, responsive grids, and subtle micro-animations (e.g. custom toast notifications).

### 2. State & Caching (Redis)
- **Redis Cache**: Employed to manage session tokens, background tasks, and request caching to reduce MongoDB query load and ensure fast, real-time page loads.

### 3. AI Shopping Assistant ("Jerry")
- **Langchain & Google Gemini**: Integrated using `@langchain/google-genai` and configured with the `gemini-2.5-flash` model.
- **Context-Aware Recommendations**: Jerry reads the active product's JSON details and the entire catalog, prioritizing recommendations from the **same category / subCategory** (e.g. recommending shirts on a shirt detail page).
- **Physical Build Sizing Guides**: Adapts recommendations dynamically based on user body shape (e.g., suggesting relaxed/oversized fits or larger sizes L/XL/XXL for larger builds, and slim/fitted styles or XS/S for leaner/skinny builds).
- **Output Sanitization**: Includes instructions and programmatic filters to strip markdown double-asterisks (`**`) and double-hyphens (`--`) for seamless inline chat displays.

### 4. Database Queries (MongoDB Aggregation Pipelines)
- **Complex Aggregations**: Used for calculation of cart subtotals, item totals, live price revisions, stock checks, and matching variants.
- **Structured Order History**: Computes user purchase histories, counts item quantities, handles variant attributes, and dynamically calculates estimated delivery dates (7 days from creation).

### 5. Secure Authentication & Role Access
- **JSON Web Tokens (JWT)**: Secure cookie-based authorization handling roles:
  - `buyer`: Storefront browse, shopping cart, checkout, settings, and orders.
  - `seller`: Atelier Console dashboard access (sales stats, product management).
  - `delivery`: Regional order board, status handovers, verification keys.
- **BcryptJS**: Password hashing for secure user registration and login.

### 6. Transactions & Payment Gateways
- **Razorpay**: Integrated online card payment gateway, securing orders through cryptographic signature verification checks.
- **Cash on Delivery (COD)**: Stateful workflow ensuring order routing to delivery boards.

---

## 🚀 Key Modules & Features

### 🛍️ Cart & Checkout Flow
- **Stateful Cart Operations**: Instant quantity increments/decrements with direct stock limits checking.
- **Voucher System**: Voucher code verification (e.g., `LUOMI10` for 10% discount).
- **Premium Toast Notifications**: Replaced browser `alert()` popups with custom CSS slide-up notifications (`.lh-toast`).
- **Pincode & Contact Validation**: Form validation checking for 6-digit Indian pincodes and 10-digit mobile numbers.

### 💼 Seller Atelier Console
- **Sales Analytics**: Real-time sales counts, earnings, and order tracking.
- **Product Management**: Create, edit, and list luxury apparel with variant support (size, color, stock).
- **Settings Access**: Header settings shortcut to update profile details.

### 🚚 Delivery Partner Console
- **Regional Dispatch Board**: Accept pending deliveries in the same region.
- ** Handover Handoffs**: Track package items, view full Product IDs, and verify handovers using secure 6-character dropoff codes.

---

## 💻 How to Get Started

### Prerequisites
- Node.js (v18+)
- MongoDB (running instance or Atlas URI)
- Redis server (running locally or cloud instance)
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Luomi
   ```

2. Configure backend variables inside `Backend/.env`:
   ```env
   MONGO_URI=your-mongodb-connection-string
   JWT=your-jwt-secret-key
   GEMINI_API_KEY=your-google-gemini-api-key
   REDIS_HOST=your-redis-host
   REDIS_PORT=your-redis-port
   REDIS_PASSWORD=your-redis-password
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```

3. Install Backend dependencies & run:
   ```bash
   cd Backend
   npm install
   npm run dev
   ```

4. Install Frontend dependencies & run:
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```

5. Open [http://localhost:5173/](http://localhost:5173/) in your browser.
