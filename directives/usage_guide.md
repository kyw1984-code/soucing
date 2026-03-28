# Coupang Sourcing Finder Usage Guide

This project is a Next.js 14 based web application for analyzing Coupang product sourcing opportunities.

## Environment Variables (.env.local)

You must set the following environment variables in your Vercel project or `.env.local` file:

```env
COUPANG_PARTNERS_ACCESS_KEY=YOUR_PARTNERS_ACCESS_KEY
COUPANG_PARTNERS_SECRET_KEY=YOUR_PARTNERS_SECRET_KEY
COUPANG_VENDOR_ID=YOUR_VENDOR_ID
COUPANG_SELLER_ACCESS_KEY=YOUR_SELLER_ACCESS_KEY
COUPANG_SELLER_SECRET_KEY=YOUR_SELLER_SECRET_KEY
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Schema

To use the caching feature, create a table named `coupang_cache` in your Supabase database:

```sql
create table coupang_cache (
  id uuid default gen_random_uuid() primary key,
  keyword text unique not null,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Index for faster keyword search
create index idx_coupang_cache_keyword on coupang_cache(keyword);
```

## Key Features

1. **HMAC Signature Auth**: Automatically handles Coupang Partners API authentication.
2. **Edge Runtime**: API routes use Vercel Edge Runtime for low latency.
3. **Caching Strategy**: Queries are cached in Supabase for 1 hour to prevent API Rate Limit issues.
4. **Sourcing Metrics**:
   - **Sourcing Score**: 0-100 score based on sales potential.
   - **Competition Strength**: Calculated as `reviews / days`.
   - **Sale Index**: Virtual metric representing inventory turnover.

## How to Run

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Build for production: `npm run build`
