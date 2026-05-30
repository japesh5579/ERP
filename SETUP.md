# Transformer ERP — Setup Guide

Enterprise inventory and production management system for transformer manufacturing.

---

## Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |

---

## 1. Install dependencies

```bash
cd transformer-erp
npm install
```

---

## 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/transformer_erp"

# Generate a secret: run  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="paste-generated-secret-here"

NEXTAUTH_URL="http://localhost:3000"
```

### Setting up PostgreSQL on Windows

If PostgreSQL is not installed, download from https://www.postgresql.org/download/windows/

After installation, create the database:

```bash
# Open psql as postgres user
psql -U postgres

# Inside psql:
CREATE DATABASE transformer_erp;
\q
```

---

## 3. Set up the database

Generate the Prisma client and run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Create tables (run migrations)
npm run db:migrate
# When prompted for migration name, type: init
```

---

## 4. Seed sample data

Load the database with realistic sample data:

```bash
npm run db:seed
```

This creates:
- **5 users** across all roles
- **4 vendors** (copper, steel, insulation, oil suppliers)
- **12 raw materials** covering all categories
- **7 transformers** in various production stages
- **3 clients** (power utilities + industrial)
- **3 purchase orders** in different statuses
- **9 quality test records**
- **3 dispatch records**

### Login credentials (all use password: `admin123`)

| Role | Email |
|------|-------|
| Super Admin | admin@transformerco.in |
| Production Manager | production@transformerco.in |
| Inventory Manager | inventory@transformerco.in |
| Quality Engineer | quality@transformerco.in |
| Dispatch Staff | dispatch@transformerco.in |

---

## 5. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Module Overview

### Dashboard
- KPI cards: active productions, low stock alerts, dispatch stats, revenue
- Monthly production bar chart + production-by-stage pie chart
- Stock alerts panel with visual progress bars
- Real-time activity feed

### Raw Material Inventory (`/inventory`)
- Full CRUD for all 9 material categories
- Visual stock-level indicators (Critical / Low / OK)
- Record material usage linked to transformer production runs
- Vendor association per material

### Production Management (`/production`)
- Track transformers through 8-stage workflow:
  `Raw Material → Assembly → Coil Winding → Core Assembly → Oil Filling → Testing → QC Approval → Dispatch Ready`
- Assign engineers, set deadlines, link clients
- Full stage history audit trail
- Detailed transformer view with timeline

### Quality Testing (`/quality`)
- Record test results: Voltage, Load, Temperature Rise, Insulation Resistance, Turns Ratio, Final QC
- PASS / FAIL / CONDITIONAL PASS outcomes
- Link tests to specific transformers and engineers
- Filter by type, result, transformer

### Dispatch Management (`/dispatch`)
- Auto-generate invoice numbers
- Track delivery status: Pending → In Transit → Delivered
- Record partial/full payments
- Transporter and tracking number management

### Vendors (`/vendors`)
- Vendor CRUD with GST number tracking
- Soft delete (deactivate without losing history)

### Purchase Orders (`/purchase-orders`)
- Multi-line item POs linked to vendors and materials
- Status workflow: Pending → Approved → Ordered → Received
- Receiving a PO automatically restocks all linked materials

### User Management (`/users`) — Super Admin only
- Create users with role assignment
- Activate / deactivate accounts
- Reset passwords

---

## Role Permissions

| Module | Super Admin | Prod. Manager | Inventory Mgr | Quality Eng. | Dispatch |
|--------|:-----------:|:-------------:|:-------------:|:------------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | View | ✅ | View | View |
| Production | ✅ | ✅ | View | View | View |
| Quality Tests | ✅ | View | View | ✅ | View |
| Dispatch | ✅ | View | View | View | ✅ |
| Vendors | ✅ | View | ✅ | View | View |
| Purchase Orders | ✅ | View | ✅ | View | View |
| Users | ✅ | — | — | — | — |

---

## Production Deployment

### Build for production

```bash
npm run build
npm run start
```

### Environment variables for production

```env
DATABASE_URL="postgresql://user:password@your-db-host:5432/transformer_erp"
AUTH_SECRET="strong-random-secret-64-chars-minimum"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### Recommended hosting stack

| Layer | Option |
|-------|--------|
| App server | Node.js PM2 / Docker |
| Database | PostgreSQL on Neon / Supabase / self-hosted |
| Reverse proxy | Nginx |
| SSL | Let's Encrypt / Cloudflare |

### Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Database Management

```bash
# View all tables in Prisma Studio (browser GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Push schema changes without migration history (dev only)
npm run db:push

# Create a new migration after schema changes
npm run db:migrate
```

---

## Project Structure

```
transformer-erp/
├── prisma/
│   ├── schema.prisma          # All database models and enums
│   └── seed.ts                # Sample data seed script
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # All protected pages
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── inventory/
│   │   │   ├── production/
│   │   │   │   └── [id]/      # Transformer detail
│   │   │   ├── quality/
│   │   │   ├── dispatch/
│   │   │   ├── vendors/
│   │   │   ├── purchase-orders/
│   │   │   └── users/
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── ui/                # Shadcn base components
│   │   ├── layout/            # Sidebar, Header
│   │   └── dashboard/         # Charts, stats cards
│   ├── lib/
│   │   ├── prisma.ts          # Database client singleton
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── utils.ts           # Helpers, formatters, constants
│   ├── middleware.ts           # Route protection
│   └── types/                 # TypeScript type definitions
└── SETUP.md
```

---

## Troubleshooting

**`DATABASE_URL` connection error**
- Verify PostgreSQL is running: `pg_isready`
- Check host/port/credentials in `.env`
- Ensure the database exists: `psql -U postgres -c "\l"`

**`prisma generate` error**
- Run `npm install` first
- Delete `.next/` and `node_modules/.prisma` then retry

**Login not working after seed**
- Ensure `npm run db:seed` completed without errors
- Password for all accounts is `admin123`
- Check `AUTH_SECRET` is set in `.env`

**Port 3000 already in use**
```bash
# Run on a different port
npm run dev -- -p 3001
```
