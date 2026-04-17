# Bar POS

Full-stack bar Point of Sale system — React + Vercel Serverless + MongoDB Atlas.

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Configure environment**
   Copy `.env.example` to `.env` and fill in your values:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/barpos
   ADMIN_ID=admin
   ADMIN_PASSWORD=admin123
   STAFF_ID=staff
   STAFF_PASSWORD=staff123
   ```

3. **Run locally** (requires Vercel CLI for API routes)
   ```bash
   npm install -g vercel
   vercel dev
   ```
   Or just run the frontend:
   ```bash
   npm run dev
   ```

4. **Deploy to Vercel**
   - Push to GitHub
   - Import project in Vercel dashboard
   - Add all `.env` variables in Vercel → Settings → Environment Variables
   - Deploy

## Credentials

| Role  | ID    | Password  |
|-------|-------|-----------|
| Admin | admin | admin123  |
| Staff | staff | staff123  |

Change these in your Vercel environment variables.

## Routes

- `/` — Login
- `/pos` — Staff billing screen
- `/admin` — Admin dashboard + inventory

## API Endpoints

| Method | Path            | Auth    | Description              |
|--------|-----------------|---------|--------------------------|
| GET    | /api/items      | Staff+  | Get items (no cost data) |
| POST   | /api/items      | Admin   | Create item              |
| PUT    | /api/items      | Admin   | Update item              |
| DELETE | /api/items      | Admin   | Delete item              |
| POST   | /api/order      | Staff+  | Place order, deduct stock|
| GET    | /api/dashboard  | Admin   | Analytics + charts       |
