// api/items.js
// Handles GET / POST / PUT / DELETE for inventory items.
// Vercel routes all /api/items requests here.

import { connectDB, Item } from './_db.js'
import { requireStaff, requireAdmin, ADMIN_ID_VALUE } from './_auth.js'

export default async function handler(req, res) {
  // CORS headers (needed when Vite dev server proxies or for direct calls)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-id,x-user-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectDB()

    // ── GET /api/items ────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      if (!requireStaff(req, res)) return

      const isAdmin = req.headers['x-user-id'] === ADMIN_ID_VALUE
      const items = await Item.find().lean()

      const mapped = items.map(item => {
        const units_left = Math.floor(item.stock_ml / item.ml_per_unit)
        const out = {
          _id:           item._id,
          name:          item.name,
          selling_price: item.selling_price,
          ml_per_unit:   item.ml_per_unit,
          stock_ml:      item.stock_ml,
          units_left,
          low_stock:     units_left < 3,
          out_of_stock:  units_left === 0,
          category:      item.category,
        }
        if (isAdmin) out.cost_price = item.cost_price
        return out
      })

      return res.status(200).json(mapped)
    }

    // ── POST /api/items ───────────────────────────────────────────────────────
    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return

      const { name, stock_ml, cost_price, selling_price, ml_per_unit, category } = req.body
      if (!name || stock_ml == null || cost_price == null || selling_price == null || ml_per_unit == null) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const item = await Item.create({ name, stock_ml, cost_price, selling_price, ml_per_unit, category })
      return res.status(201).json(item)
    }

    // ── PUT /api/items ────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      if (!requireAdmin(req, res)) return

      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: 'Missing item id' })

      const item = await Item.findByIdAndUpdate(id, updates, { new: true })
      if (!item) return res.status(404).json({ error: 'Item not found' })
      return res.status(200).json(item)
    }

    // ── DELETE /api/items ─────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return

      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'Missing item id' })

      await Item.findByIdAndDelete(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    console.error('[/api/items]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
