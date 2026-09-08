# Little Sprout — Baby Toys E-Commerce Platform (MERN Stack)

A production-style full-stack e-commerce platform for baby and toddler toys, built as an
Advanced MERN Stack Internship Project for **ULT Technology**.

**Live Demo:** https://baby-toys-store-six.vercel.app
**Backend API:** https://baby-toys-store-production.up.railway.app
**API Health Check:** https://baby-toys-store-production.up.railway.app/api/health

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Redux Toolkit, React Router, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM), hosted on MongoDB Atlas |
| Authentication | JWT (access + refresh tokens), bcrypt password hashing |
| Payments | Stripe (sandbox/test mode) |
| Testing | Jest, Supertest, mongodb-memory-server |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## Features

- **Authentication & Authorization** — JWT access/refresh tokens, role-based access
  (Customer, Staff, Admin), protected routes on both frontend and backend.
- **Product Catalog** — Search, filters (category, age range, brand, price, rating),
  sorting, server-side pagination, product variants, safety information.
- **Cart & Checkout** — Persistent cart, server-side stock validation, multi-step
  checkout (address → shipping → payment), server-calculated totals.
- **Payments** — Stripe integration (sandbox mode), payment confirmation, order status
  transitions, stock restoration on payment failure.
- **Order Lifecycle** — Controlled status machine (Pending → Paid → Processing → Packed
  → Shipped → Delivered, with Cancel/Return flows), status history.
- **Reviews & Ratings** — Verified-purchase detection, moderation queue (pending →
  approved/rejected), rating aggregation.
- **Wishlist** — Add/remove products, persisted per user.
- **Admin Dashboard** — Revenue/order analytics, top-selling products, category
  breakdown, inventory alerts, order fulfillment management, audit logs.
- **Security** — bcrypt password hashing, rate limiting, CORS, Helmet security headers,
  NoSQL injection sanitization, no stack traces exposed in production.

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Frontend — Vercel"]
        A[React SPA<br/>Redux Toolkit + React Router]
    end

    subgraph Server["Backend — Railway"]
        B[Express REST API]
        C[JWT Auth Middleware]
        D[Controllers]
        E[Services]
    end

    subgraph External["External Services"]
        F[(MongoDB Atlas)]
        G[Stripe Sandbox]
    end

    A -- HTTPS / JSON --> B
    B --> C --> D --> E
    E -- Mongoose --> F
    E -- Payment Intents / Webhooks --> G
```

**Request flow:** the React SPA calls the Express REST API over HTTPS. Every protected
route passes through JWT authentication and role-authorization middleware before
reaching a controller. Controllers delegate business logic to services, which read and
write to MongoDB Atlas via Mongoose and talk to Stripe for payment processing.

---

## Database Schema (Entity Relationship)

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER ||--|| CART : owns
    USER ||--|| WISHLIST : owns
    USER ||--o{ AUDITLOG : "acted by"

    PRODUCT ||--o{ ORDER_ITEM : "included in"
    PRODUCT ||--o{ REVIEW : "reviewed in"
    PRODUCT }o--|| CATEGORY : "belongs to"
    PRODUCT ||--o{ WISHLIST_ITEM : "saved in"
    PRODUCT ||--o{ CART_ITEM : "added to"

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : "paid via"
    ORDER }o--o| COUPON : "discounted by"

    CART ||--o{ CART_ITEM : contains
    WISHLIST ||--o{ WISHLIST_ITEM : contains

    USER {
        string name
        string email
        string passwordHash
        string role
        string status
    }
    PRODUCT {
        string name
        string slug
        string sku
        number price
        number stock
        string ageRange
        string inventoryStatus
    }
    CATEGORY {
        string name
        string slug
        boolean active
    }
    ORDER {
        string orderNumber
        string status
        object pricing
        object shippingAddress
    }
    PAYMENT {
        string provider
        string transactionId
        string status
        number amount
    }
    REVIEW {
        number rating
        string moderationStatus
        boolean verifiedPurchase
    }
    COUPON {
        string code
        string type
        number value
    }
    AUDITLOG {
        string action
        string entity
        date timestamp
    }
```

**Indexing decisions:** `slug` and `sku` are unique-indexed on `Product` for fast direct
lookups; `category`, `price`, and `rating.average` are indexed to support the catalog
filter/sort queries without scanning the full collection; a text index on
`name`/`description` powers the search feature; `Order.user` and `Order.status` are
indexed together since the most common admin/customer queries filter by both.

---

## API Overview

Full endpoint list is implemented under `/api`. Key modules:

| Module | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, refresh, logout, forgot-password |
| Products | `/api/products` | search/filter/sort/paginate, admin CRUD |
| Categories | `/api/categories` | public read, admin CRUD |
| Cart | `/api/cart` | authenticated, server-validated stock |
| Wishlist | `/api/wishlist` | authenticated |
| Orders | `/api/orders` | create, list, status transitions |
| Payments | `/api/payments` | Stripe intent creation, webhook, sandbox confirm |
| Reviews | `/api/products/:id/reviews`, `/api/reviews/:id` | create, moderate |
| Admin Analytics | `/api/analytics` | revenue, top products, inventory alerts, audit logs |

All list endpoints return a consistent envelope:
```json
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 42 } }
```

---

## Getting Started (Local Development)

### What you need installed on your computer

1. **Node.js** v18+ — https://nodejs.org (download the LTS version, install it, click Next through everything)
2. **A MongoDB database** — easiest option: free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
   - Sign up → Create a free (M0) cluster → Database Access: create a user + password → Network Access: allow access from anywhere (0.0.0.0/0) for now → Connect → "Drivers" → copy the connection string (looks like `mongodb+srv://user:pass@cluster...`)

### Step-by-step: run the backend locally

```bash
# 1. Unzip the project, then open a terminal inside it
cd baby-toys-store

# 2. Go into the server folder and install dependencies
cd server
npm install

# 3. Create your real .env file from the example
cp ../.env.example .env
# (on Windows: copy ..\.env.example .env)

# 4. Open .env in any text editor and paste your MongoDB connection string
# into MONGO_URI= , and set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to any
# long random strings (e.g. mash the keyboard for 40 characters).

# 5. Seed demo data (creates 42 products, categories, demo accounts, coupons)
npm run seed

# 6. Start the backend
npm run dev
```

If everything is correct, you'll see:

[db] MongoDB connected: ...
[server] Listening on port 5000 (development)


### Step-by-step: check it's working

Open a browser and go to: **http://localhost:5000/api/health**
You should see: `{"status":"ok","timestamp":"..."}`

Test the product list: **http://localhost:5000/api/products**
You should see JSON with products and pagination info.

### Demo accounts (created by the seed script)

| Role | Email | Password |
|---|---|---|
| Customer | customer@demo.com | Password123 |
| Staff | staff@demo.com | Password123 |
| Admin | admin@demo.com | Password123 |

### Step-by-step: run the frontend locally

Open a **second, new terminal window** (keep the backend running in the first one):

```bash
cd baby-toys-store/client
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser. You should see the homepage, and
`/products`, `/login`, `/register` should all work and talk to the backend.

---

## Testing

The project includes 30+ automated tests (Jest + Supertest + in-memory MongoDB),
covering authentication, authorization, product search/filter, cart validation,
wishlist, reviews and moderation, payments, webhooks, and admin analytics.

```bash
cd server
npm test
```

---

## Deployment

| Part | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys from `main`, `client/` as root directory, includes `vercel.json` SPA rewrite so client-side routes work on direct load/refresh |
| Backend | Railway | Auto-deploys from `main`, `server/` as root directory, `npm start` |
| Database | MongoDB Atlas | M0 free-tier cluster, network access configured for Railway |
| Payments | Stripe | Sandbox/test mode — no real charges are made |

**Cross-domain auth note:** because the frontend and backend are on different domains,
the refresh-token cookie uses `sameSite: "none"` (with `secure: true`) in production so
the browser will send it across origins; in local development it falls back to `"lax"`.

---

## Environment Variables

All documented in `.env.example` at the project root. Never commit a real `.env` file —
only `.env.example` should be in git. Production secrets (JWT secrets, MongoDB
connection string, Stripe keys) are configured directly in the Railway and Vercel
dashboards, not in the repository.

---

## Project Structure

baby-toys-store/
├── client/ # React frontend (Vite, Redux Toolkit, Tailwind)
│ └── src/
│ ├── features/ # Redux slices (auth, cart, wishlist, etc.)
│ ├── pages/ # Route-level pages
│ └── layouts/ # Shared layout shells
├── server/ # Express backend
│ └── src/
│ ├── controllers/ # Request handlers
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API route definitions
│ ├── services/ # Business logic (tokens, pricing, stripe, audit log)
│ ├── middleware/ # Auth, validation, error handling
│ └── tests/ # Automated test suites
├── .env.example
└── README.md


---

## Screenshots

_Screenshots of the customer storefront and admin dashboard are included in the `docs/`
folder of this repository._
