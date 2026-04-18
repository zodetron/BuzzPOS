// api/order.js
// POST /api/order — place an order, deduct stock, persist to DB.

import { connectDB, Item, Order } from './_db.js'
import { requireStaff } from './_auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-id,x-user-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!requireStaff(req, res)) return

  try {
    await connectDB()

    const { items } = req.body
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items in order' })
    }

    const orderItems = []
    let total = 0

    for (const { item_id, quantity_ml } of items) {
      if (!item_id || quantity_ml == null || quantity_ml <= 0) {
        return res.status(400).json({ error: 'Invalid item entry' })
      }

      const item = await Item.findById(item_id)
      if (!item) return res.status(404).json({ error: `Item not found: ${item_id}` })

      if (item.stock_ml < quantity_ml) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` })
      }

      // quantity = fractional serves (used for reporting / profit calc)
      const quantity = quantity_ml / item.ml_per_unit

      orderItems.push({
        item_id:       item._id,
        name:          item.name,
        quantity,
        quantity_ml,
        cost_price:    item.cost_price,
        selling_price: item.selling_price,
        ml_per_unit:   item.ml_per_unit,
      })

      total += quantity * item.selling_price
      item.stock_ml -= quantity_ml
      await item.save()
    }

    const order = await Order.create({ items: orderItems, total })
    return res.status(201).json(order)

  } catch (err) {
    console.error('[/api/order]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
