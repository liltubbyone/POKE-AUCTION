# PokeAuction

A full-stack Pokemon surprise wheel auction site. Users buy spots in an auction pool. When all spots are filled, a provably-fair cryptographic wheel spins and randomly assigns each bidder a random item from the pool.

## Tech Stack

- **Next.js 14** (App Router + TypeScript)
- **Tailwind CSS** (dark theme, black/gold)
- **Prisma 7 + SQLite** (via better-sqlite3 driver adapter)
- **NextAuth.js** (JWT sessions, credentials provider)
- **Stripe** (card payments)
- **PayPal JS SDK** (PayPal payments)
- **bcryptjs** (password hashing)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXTAUTH_SECRET` — Run `openssl rand -base64 32` to generate
- `NEXTAUTH_URL` — Your site URL (e.g. `http://localhost:3000`)
- `STRIPE_SECRET_KEY` — From Stripe Dashboard
- `STRIPE_PUBLISHABLE_KEY` — From Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` — From Stripe CLI or webhook settings
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — From PayPal Developer Dashboard
- `NEXT_PUBLIC_VENMO_HANDLE` — Your Venmo handle (e.g. `@YourHandle`)
- `NEXT_PUBLIC_CASHAPP_HANDLE` — Your Cash App handle (e.g. `$YourHandle`)

### 3. Initialize database

```bash
npm run db:push
```

### 4. Seed the database

This creates the admin user and pre-loads inventory + first auction:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5. Run development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Admin Access

- URL: `/admin`
- Email: `admin@pokeauction.com`
- Password: `changeme123`

**IMPORTANT:** Change the admin password immediately after first login!

## Database

Database file is at `prisma/dev.db`. To view/edit with a GUI:

```bash
npm run db:studio
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Home with active auctions |
| `/inventory` | Full item catalog with tiers |
| `/auction/[id]` | Auction room with spin wheel |
| `/auth/login` | Sign in |
| `/auth/register` | Create account |
| `/profile` | User profile, spot history, address |
| `/admin` | Admin dashboard (admin only) |
| `/admin/inventory` | Manage inventory quantities |
| `/admin/auctions/new` | Create new auction |

## Auction Flow

1. Admin creates an auction via `/admin/auctions/new`
2. Users register and buy spots (Stripe, PayPal, Venmo, or Cash App)
3. For Venmo/Cash App: admin manually confirms payment in the dashboard
4. When all spots are filled, admin triggers the spin (or it auto-triggers)
5. Cryptographic seed is generated and published
6. Items are randomly shuffled and assigned to spot numbers
7. Results are revealed with animation
8. Admin ships items and enters tracking numbers

## Policies (MUST DISPLAY)

- **NO REFUNDS** — All sales are final
- **100% RANDOMIZED** — Never manipulated
- **BUYER PAYS SHIPPING** — No free shipping, no sales tax
- **PROVABLY FAIR** — Cryptographic seed published before spin

## Stripe Webhook (Production)

Set up a Stripe webhook pointing to `/api/payments/stripe/webhook` for:
- `payment_intent.succeeded`

## Deployment

For production deployment, update:
1. `NEXTAUTH_URL` to your domain
2. `DATABASE_URL` / db path if needed
3. All Stripe keys to live mode
4. Set strong `NEXTAUTH_SECRET`
