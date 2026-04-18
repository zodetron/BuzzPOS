// api/dashboard.js
// GET /api/dashboard?range=1d|7d|30d|all
// Returns revenue, profit, orders, items sold, low stock alerts, and chart data.
// Admin only.

import { connectDB, Item, Order } from './_db.js'
import { requireAdmin } from './_auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-user-id,x-user-password')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!requireAdmin(req, res)) return

  try {
    await connectDB()

    const range = req.query.range || '7d' // '1d' | '7d' | '30d' | 'all'

    const [allOrders, items] = await Promise.all([
      Order.find().lean(),
      Item.find().lean(),
    ])

    // ── Filter orders by range ────────────────────────────────────────────────
    let rangeStart = null
    if (range === '1d') {
      rangeStart = new Date(); rangeStart.setHours(0, 0, 0, 0)
    } else if (range === '7d') {
      rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 7); rangeStart.setHours(0, 0, 0, 0)
    } else if (range === '30d') {
      rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 30); rangeStart.setHours(0, 0, 0, 0)
    }

    const orders = rangeStart
      ? allOrders.filter(o => new Date(o.createdAt) >= rangeStart)
      : allOrders

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalOrders  = orders.length

    const itemMap = {}
    items.forEach(i => { itemMap[i._id.toString()] = i })

    let totalCost = 0
    orders.forEach(order => {
      order.items.forEach(oi => {
        const cost = oi.cost_price != null
          ? oi.cost_price
          : (itemMap[oi.item_id?.toString()]?.cost_price || 0)
        const serves = (oi.quantity_ml != null && oi.ml_per_unit)
          ? oi.quantity_ml / oi.ml_per_unit
          : oi.quantity
        totalCost += serves * cost
      })
    })

    const totalProfit = totalRevenue - totalCost

    const itemsSold = orders.reduce((s, o) =>
      s + o.items.reduce((x, i) => {
        const serves = (i.quantity_ml != null && i.ml_per_unit)
          ? i.quantity_ml / i.ml_per_unit
          : i.quantity
        return x + serves
      }, 0), 0)

    // ── Low stock ─────────────────────────────────────────────────────────────
    const lowStockItems = items
      .map(i => ({ ...i, units_left: Math.floor(i.stock_ml / i.ml_per_unit) }))
      .filter(i => i.units_left < 3)

    // ── Chart data ────────────────────────────────────────────────────────────
    const salesByDay = {}

    if (range === 'all') {
      allOrders.forEach(o => {
        const key = new Date(o.createdAt).toISOString().split('T')[0]
        if (!salesByDay[key]) salesByDay[key] = { revenue: 0, orders: 0 }
        salesByDay[key].revenue += o.total
        salesByDay[key].orders  += 1
      })
    } else {
      const days = range === '30d' ? 30 : range === '1d' ? 1 : 7
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        salesByDay[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 }
      }
      orders.forEach(o => {
        const key = new Date(o.createdAt).toISOString().split('T')[0]
        if (salesByDay[key]) {
          salesByDay[key].revenue += o.total
          salesByDay[key].orders  += 1
        }
      })
    }

    const salesChart = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, ...d }))

    return res.status(200).json({
      totalRevenue,
      totalProfit,
      totalOrders,
      itemsSold,
      lowStockItems,
      salesChart,
    })

  } catch (err) {
    console.error('[/api/dashboard]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
