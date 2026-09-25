# ShopCart E-Commerce Platform — Deployment Guide

## Production Architecture
```
User Browser → React Frontend (Render Static Site) → Node/Express API (Render Web Service) → PostgreSQL (Neon)
```

---

## STEP 1: Push Code to GitHub

All deployment-ready code changes have been made. Push to GitHub:

```bash
cd c:\Users\Lenovo\.gemini\antigravity-ide\scratch\SmartTaskPro\ShopCart
git add -A
git commit -m "feat: prepare ShopCart for production deployment"
git push origin main
```

---

## STEP 2: Create Neon PostgreSQL Database (FREE — No Expiry)

1. Go to **https://neon.tech** → Sign up (GitHub login works)
2. Click **"Create Project"**
   - **Project name:** `shopcart`
   - **Region:** Choose the one closest to you (e.g., `AWS US East`)
   - **PostgreSQL version:** `15` or latest
3. After creation, copy the **connection string**. It looks like:
   ```
   postgresql://neondb_owner:AbCdEfGh@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this — you'll need it for both the schema setup and Render.**

### Initialize the Database

Open a terminal and run the schema, then the seed data against your Neon database:

```bash
cd c:\Users\Lenovo\.gemini\antigravity-ide\scratch\SmartTaskPro\ShopCart\backend

# Set the Neon connection string temporarily
set DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-your-endpoint.neon.tech/neondb?sslmode=require
set NODE_ENV=production

# Run schema
node src/db/runSchema.js

# Run seed
node src/db/runSeed.js
```

You should see:
```
Schema created successfully
Database seeded successfully
```

---

## STEP 3: Deploy Backend on Render (FREE Web Service)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo: `laxman54716/SmartTaskPro`
4. Configure:
   - **Name:** `shopcart-api`
   - **Root Directory:** `ShopCart/backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste your Neon connection string from Step 2)* |
| `JWT_SECRET` | *(generate a strong random secret, e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)* |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | *(leave blank for now — you'll fill this after Step 4)* |
| `PORT` | `10000` |

6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. Your backend URL will be something like: `https://shopcart-api.onrender.com`
9. **Test it:** Open `https://shopcart-api.onrender.com/health` in your browser
   - You should see: `{"status":"ok","service":"shopcart-api"}`

---

## STEP 4: Deploy Frontend on Render (FREE Static Site)

1. On Render dashboard, click **"New" → "Static Site"**
2. Connect the same GitHub repo: `laxman54716/SmartTaskPro`
3. Configure:
   - **Name:** `shopcart`
   - **Root Directory:** `ShopCart/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Add Environment Variable:**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://shopcart-api.onrender.com/api` |

   *(Replace `shopcart-api` with whatever name Render assigned your backend)*

5. Under **"Redirects/Rewrites"** add:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`

   *(This ensures React Router works on direct URL navigation)*

6. Click **"Create Static Site"**
7. Wait for deployment
8. Your frontend URL will be something like: `https://shopcart.onrender.com`

---

## STEP 5: Update CORS (Backend)

Now go back to your **backend web service** on Render:

1. Go to **"Environment"** tab
2. Update the `CLIENT_URL` variable to your frontend URL:
   ```
   https://shopcart.onrender.com
   ```
3. Click **"Save Changes"** — Render will auto-redeploy

---

## STEP 6: Verify Everything Works

Open your frontend URL in the browser and test:

### Authentication
- [ ] Register a new account
- [ ] Login with: `admin@shopcart.com` / `Password123!`
- [ ] Login with: `alice@example.com` / `Password123!`
- [ ] Logout

### Customer Flow
- [ ] Browse products on homepage
- [ ] Search for "MacBook"
- [ ] Filter by category
- [ ] Open product details
- [ ] Add to cart
- [ ] View cart, change quantity
- [ ] Add address
- [ ] Checkout with COD
- [ ] View order history
- [ ] Cancel a pending order

### Admin Flow
- [ ] Login as admin
- [ ] View all orders
- [ ] Create a new product
- [ ] Update a product
- [ ] Delete a product
- [ ] Update order status

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@shopcart.com` | `Password123!` |
| **Customer** | `alice@example.com` | `Password123!` |
| **Customer** | `bob@example.com` | `Password123!` |

*These are fictional demo accounts created specifically for the public demo.*

---

## Environment Variables Reference

### Backend (Render Web Service)
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Random 64-character hex string |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `7d`) |
| `CLIENT_URL` | Frontend production URL |
| `PORT` | `10000` (Render default) |

### Frontend (Render Static Site)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL + `/api` suffix |

---

## Known Free-Tier Limitations

| Service | Limitation |
|---------|-----------|
| **Render Web Service** | Spins down after 15 minutes of inactivity. First request after idle takes ~30-50 seconds (cold start). |
| **Render Static Site** | 100 GB/month bandwidth. More than enough for a demo. |
| **Neon PostgreSQL** | 0.5 GB storage. Scales to zero after 5 min idle (brief cold start on reconnect). Always free — no 30-day expiry. |

---

## Local Development (Still Works)

```bash
# Start PostgreSQL via Docker
docker-compose up -d

# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Local URLs:
- Frontend: http://localhost:5174
- Backend: http://localhost:5000
- Health: http://localhost:5000/health
