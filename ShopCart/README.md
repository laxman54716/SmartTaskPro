# ShopCart E-Commerce Platform

A fully-functional, robust, and professionally designed full-stack e-commerce application.

## Live Demo

> **Frontend:** *(Add your Render Static Site URL here after deployment)*
> **Backend API:** *(Add your Render Web Service URL here after deployment)*
> **Health Check:** *(Your backend URL)*`/health`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shopcart.com` | `Password123!` |
| Customer | `alice@example.com` | `Password123!` |
| Customer | `bob@example.com` | `Password123!` |

*Note: First load may take ~30 seconds due to free-tier cold start.*

---

## Technologies Used

* **Frontend**: React, React Router, Vite, Context API, Axios, Custom CSS
* **Backend**: Node.js, Express.js
* **Database**: PostgreSQL (Neon — production, Docker — local development)
* **Authentication**: JWT (JSON Web Tokens), bcryptjs
* **Security**: Helmet, express-rate-limit, CORS, bcryptjs
* **Infrastructure**: Docker & Docker Compose (local dev), Render (production)

## Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Admin vs Customer)
   - Secure password hashing

2. **Product Management**
   - Browse products by category, search, and sorting
   - Detailed product view with stock availability
   - Admin panel for full CRUD operations on products

3. **Cart & Checkout Workflow**
   - Persistent cart synced with backend API
   - Address management for customers
   - Secure checkout flow (mock payment integrated)
   - Transactional inventory decrement with `SELECT FOR UPDATE` locking

4. **Order Management**
   - Customer order history and order tracking
   - Admin order fulfillment and status management
   - Cancellations and stock replenishment

## Production Architecture

```
User Browser
    ↓
React Frontend (Render Static Site)
    ↓
Node.js / Express API (Render Web Service)
    ↓
PostgreSQL (Neon — always-free tier)
```

## Running Locally

### Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for PostgreSQL)

### 1. Start the Database
```bash
docker compose up -d
```

### 2. Start the Backend
```bash
cd backend
npm install
npm start
```
Backend runs at `http://localhost:5000`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` (or `5174` if `5173` is in use)

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step production deployment instructions.

## Architecture Details

- **Concurrency Control**: PostgreSQL `SELECT FOR UPDATE` inside transactions prevents race conditions during checkout.
- **Deadlock Prevention**: Cart items are sorted by `product_id` before locking to prevent deadlocks.
- **Validation**: All backend inputs validated using `express-validator` middleware.
- **Security**: `helmet` for HTTP headers, `express-rate-limit` for rate limiting, strict CORS policies.
