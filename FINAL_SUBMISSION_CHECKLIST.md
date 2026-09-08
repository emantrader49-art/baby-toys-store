# Final Submission Checklist — Baby Toys E-Commerce Platform

**Deadline:** 15 September 2026

---

## Links to submit

| Item | Link |
|---|---|
| GitHub repository | https://github.com/emantrader49-art/baby-toys-store |
| Live frontend | https://baby-toys-store-six.vercel.app |
| Live backend / API | https://baby-toys-store-production.up.railway.app |
| API health check | https://baby-toys-store-production.up.railway.app/api/health |

---

## Demo credentials (non-production)

| Role | Email | Password |
|---|---|---|
| Customer | customer@demo.com | Password123 |
| Staff | staff@demo.com | Password123 |
| Admin | admin@demo.com | Password123 |

---

## Checklist status

- [x] GitHub repository link
- [x] Live frontend URL
- [x] Live backend/API URL
- [x] Database/seed instructions (in README.md)
- [x] Admin demo credentials
- [x] Customer demo credentials
- [x] API documentation (README.md — API Overview section)
- [x] Architecture diagram (README.md — Mermaid diagram)
- [x] Database diagram (README.md — Mermaid ER diagram)
- [x] Testing evidence (31 automated tests in `server/src/__tests__/`)
- [x] Screenshots (in `docs/` — 10 screenshots covering customer + admin flows)
- [ ] Demo video / screen recording
- [x] Final README
- [x] All environment variables documented in `.env.example`
- [x] No secrets committed to repository
- [x] MongoDB password changed from weak default to a strong password
- [ ] Final submission completed by 15 September 2026

---

## What was verified end-to-end (manually tested)

- Customer registration → stored in MongoDB Atlas
- Login / logout (JWT access + refresh token, cross-domain cookie)
- Product browsing, search, filtering
- Add to cart, cart persistence, quantity handling
- Multi-step checkout (shipping address → payment)
- Stripe sandbox payment → order marked "Paid"
- Order appears in customer's order history
- Admin login and Admin Dashboard (revenue, orders, top products, customers)
- Admin order fulfillment — order status transitions (Paid → Processing, etc.)

## What to verify before final submission (recommended, not yet manually re-checked)

- [ ] Wishlist add/remove from the UI
- [ ] Submitting and viewing a product review from the UI
- [ ] Coupon code application at checkout
- [ ] Mobile/tablet responsive check
- [ ] Record and add the short demo video
