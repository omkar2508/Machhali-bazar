# MachhliBazaar — Fresh Fish Marketplace

Ratnagiri fishermen → QA Inspection → Pune customers

---

## Architecture

```
frontend/   ← Next.js 15 app (port 3000)
backend/    ← Express + MongoDB Atlas (port 4000)
```

Auth: Custom JWT (no Supabase). Token stored in `localStorage`.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env`:
```
PORT=4000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/machhli_bazaar?retryWrites=true&w=majority
JWT_SECRET=change_this_to_something_long_and_random
FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev    # nodemon auto-reload
# or
npm start      # production
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
npm run dev    # http://localhost:3000
```

---

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Whitelist your IP (or use `0.0.0.0/0` for dev)
5. Click **Connect → Drivers** → copy the connection string
6. Replace `<password>` and paste into backend `.env` as `MONGO_URI`

---

## User Roles

| Role | Can do |
|------|--------|
| **customer** | Browse fish, add to cart, place orders, view own orders |
| **fisherman** | Create/edit/delete fish listings |
| **qa** | Approve / degrade / reject fish listings; update order status |
| **admin** | Everything QA can do + view all users + stats dashboard |

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/user/signup` | — | Register |
| POST | `/user/login` | — | Login, returns JWT |
| GET | `/user/me` | Bearer | Get own profile |

### Fish
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/fish` | — | List approved/degraded fish (public) |
| GET | `/fish/all` | qa/admin | List all fish |
| GET | `/fish/mine` | fisherman | Own listings |
| POST | `/fish` | fisherman | Create listing |
| PUT | `/fish/:id` | fisherman | Update own listing |
| DELETE | `/fish/:id` | fisherman | Delete own listing |
| PATCH | `/fish/:id/qa` | qa/admin | Update QA status |

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | customer | Place order |
| GET | `/orders/mine` | customer | Own orders |
| GET | `/orders` | qa/admin | All orders |
| PATCH | `/orders/:id/status` | qa/admin | Update status |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/stats` | admin | Platform stats |
| GET | `/admin/users` | admin | All users |

---

## Frontend Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/auth` | Public | Login / Signup |
| `/browse` | Public | Browse fish listings |
| `/cart` | Customer | Cart + checkout |
| `/orders` | Customer | Order history |
| `/fisherman` | Fisherman | Manage listings |
| `/qa` | QA / Admin | Inspect fish + orders |
| `/admin` | Admin | Stats + users + orders |

---

## Bugs Fixed

1. **Supabase removed** — all auth replaced with custom JWT (login/signup hit your own Express backend)
2. **react-router-dom removed** — all navigation uses Next.js `Link`, `useRouter`, `usePathname`
3. **auth-context.tsx** — rewrote from scratch (original referenced `supabase` without import)
4. **ProtectedRoute** — uses `useRouter().replace()` instead of `<Navigate>`
5. **FishCard** — uses `next/navigation` instead of `react-router-dom`
6. **Navbar** — uses `next/link` and `usePathname` instead of react-router
7. **Backend db.js** — replaced MySQL with MongoDB Atlas mongoose connection
8. **Backend package.json** — added `"type": "module"` for ES imports
9. **All missing pages created** — browse, cart, orders, fisherman, qa, admin
10. **All missing API routes created** — fish CRUD, orders, admin stats
"# Machhali-bazar" 
