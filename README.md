# MerchStore

Next.js 15 + Prisma + Neon PostgreSQL — ready for Vercel.

## Deploy
1. Push to GitHub
2. Import on Vercel (env vars already documented below)
3. Build runs: `prisma generate && prisma db push && seed && next build`
   → no local Node needed

## Env (Vercel)
- DATABASE_URL = Neon connection string
- JWT_SECRET = long random string
- ADMIN_EMAIL / ADMIN_PASSWORD
- NEXT_PUBLIC_STORE_NAME=MerchStore
- CURRENCY=EGP
- PAYMENT_MODE=mock
- DEFAULT_SHIPPING_COST=50
- FREE_SHIPPING_THRESHOLD=500

Admin login after deploy: ADMIN_EMAIL / ADMIN_PASSWORD
