# Baby Toys E-Commerce (MERN)

Backend so far: Auth, Products, Categories, Cart, Orders (with payment-ready lifecycle), Wishlist, Reviews (with moderation).
Still to build: Payment webhook integration, Admin analytics dashboard, full frontend pages, tests beyond auth, deployment.

## What you need installed on your computer

1. **Node.js** v18+ — https://nodejs.org (download the LTS version, install it, click Next through everything)
2. **A MongoDB database** — easiest option: free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
   - Sign up → Create a free (M0) cluster → Database Access: create a user + password → Network Access: allow access from anywhere (0.0.0.0/0) for now → Connect → "Drivers" → copy the connection string (looks like `mongodb+srv://user:pass@cluster...`)

## Step-by-step: run the backend locally

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
```
[db] MongoDB connected: ...
[server] Listening on port 5000 (development)
```

## Step-by-step: check it's working

Open a browser and go to: **http://localhost:5000/api/health**
You should see: `{"status":"ok","timestamp":"..."}`

Test the product list: **http://localhost:5000/api/products**
You should see JSON with 20 products and pagination info.

## Demo accounts (created by the seed script)

| Role | Email | Password |
|---|---|---|
| Customer | customer@demo.com | Password123 |
| Staff | staff@demo.com | Password123 |
| Admin | admin@demo.com | Password123 |

## Step-by-step: run the frontend locally

Open a **second, new terminal window** (keep the backend running in the first one):

```bash
cd baby-toys-store/client
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser. You should see the homepage, and
`/products`, `/login`, `/register` should all work and talk to the backend.

## Run the automated tests

```bash
cd server
npm test
```

## Project structure

See `docs/PLAN.md` (or the planning document you already have) for the full architecture, schema, and phase breakdown.

## Environment variables

All documented in `.env.example` at the project root. Never commit a real `.env` file — only `.env.example` should be in git.
