import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

const app = express()
app.use(cors())
app.use(express.json())

// ── DB ──────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message))

// ── Models ──────────────────────────────────────────────────────────────────
const ItemSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  stock_ml:      { type: Number, required: true },
  cost_price:    { type: Number, required: true },
  selling_price: { type: Number, required: true },
  ml_per_unit:   { type: Number, required: true },
  category:      { type: String, default: 'alcohol' },
}, { timestamps: true })

const OrderItemSchema = new mongoose.Schema({
  item_id:       mongoose.Schema.Types.ObjectId,
  name:          String,
  quantity:      Number,   // fractional serves (quantity_ml / ml_per_unit)
  quantity_ml:   Number,   // actual ml served
  cost_price:    Number,
  selling_price: Number,
  ml_per_unit:   Number,
})

const OrderSchema = new mongoose.Schema({
  items: [OrderItemSchema],
  total: Number,
}, { timestamps: true })

const Item  = mongoose.models.Item  || mongoose.model('Item',  ItemSchema)
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)

// ── Auth ─────────────────────────────────────────────────────────────────────
const ADMIN_ID = process.env.ADMIN_ID || 'mehfil_admin'
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'MehfilAdmin2025'
const STAFF_ID = process.env.STAFF_ID || 'mehfil_staff'
const STAFF_PW = process.env.STAFF_PASSWORD || 'MehfilStaff2025'

function authAdmin(req, res, next) {
  const id = req.headers['x-user-id']
  const pw = req.headers['x-user-password']
  if (id === ADMIN_ID && pw === ADMIN_PW) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

function authStaff(req, res, next) {
  const id = req.headers['x-user-id']
  const pw = req.headers['x-user-password']
  if ((id === STAFF_ID && pw === STAFF_PW) || (id === ADMIN_ID && pw === ADMIN_PW)) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

// ── /api/items ───────────────────────────────────────────────────────────────
app.get('/api/items', authStaff, async (req, res) => {
  const isAdmin = req.headers['x-user-id'] === ADMIN_ID
  const items = await Item.find().lean()
  const mapped = items.map(item => {
    const units_left = Math.floor(item.stock_ml / item.ml_per_unit)
    const out = { _id: item._id, name: item.name, selling_price: item.selling_price,
      ml_per_unit: item.ml_per_unit, stock_ml: item.stock_ml, units_left,
      low_stock: units_left < 3, out_of_stock: units_left === 0, category: item.category }
    if (isAdmin) out.cost_price = item.cost_price
    return out
  })
  res.json(mapped)
})

app.post('/api/items', authAdmin, async (req, res) => {
  const { name, stock_ml, cost_price, selling_price, ml_per_unit, category } = req.body
  if (!name || stock_ml == null || cost_price == null || selling_price == null || ml_per_unit == null)
    return res.status(400).json({ error: 'Missing required fields' })
  const item = await Item.create({ name, stock_ml, cost_price, selling_price, ml_per_unit, category })
  res.status(201).json(item)
})

app.put('/api/items', authAdmin, async (req, res) => {
  const { id, ...updates } = req.body
  if (!id) return res.status(400).json({ error: 'Missing item id' })
  const item = await Item.findByIdAndUpdate(id, updates, { new: true })
  res.json(item)
})

app.delete('/api/items', authAdmin, async (req, res) => {
  const { id } = req.body
  await Item.findByIdAndDelete(id)
  res.json({ success: true })
})

// ── /api/order ───────────────────────────────────────────────────────────────
app.post('/api/order', authStaff, async (req, res) => {
  const { items } = req.body
  if (!items || !items.length) return res.status(400).json({ error: 'No items in order' })

  const orderItems = []
  let total = 0

  for (const { item_id, quantity_ml } of items) {
    const item = await Item.findById(item_id)
    if (!item) return res.status(404).json({ error: `Item not found` })
    if (item.stock_ml < quantity_ml)
      return res.status(400).json({ error: `Insufficient stock for ${item.name}` })
    // quantity in order = number of ml_per_unit servings sold (for reporting)
    const quantity = quantity_ml / item.ml_per_unit
    orderItems.push({ 
      item_id: item._id, 
      name: item.name, 
      quantity,
      quantity_ml,
      cost_price: item.cost_price,
      selling_price: item.selling_price, 
      ml_per_unit: item.ml_per_unit 
    })
    total += quantity * item.selling_price
    item.stock_ml -= quantity_ml
    await item.save()
  }

  const order = await Order.create({ items: orderItems, total })
  res.status(201).json(order)
})

// ── /api/dashboard ───────────────────────────────────────────────────────────
app.get('/api/dashboard', authAdmin, async (req, res) => {
  const range = req.query.range || '7d' // '1d' | '7d' | '30d' | 'all'

  const [allOrders, items] = await Promise.all([Order.find().lean(), Item.find().lean()])

  // Filter orders by range for stats
  let rangeStart = null
  if (range === '1d') {
    rangeStart = new Date(); rangeStart.setHours(0,0,0,0)
  } else if (range === '7d') {
    rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 7); rangeStart.setHours(0,0,0,0)
  } else if (range === '30d') {
    rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 30); rangeStart.setHours(0,0,0,0)
  }
  const orders = rangeStart
    ? allOrders.filter(o => new Date(o.createdAt) >= rangeStart)
    : allOrders

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const totalOrders  = orders.length

  const itemMap = {}
  items.forEach(i => { itemMap[i._id.toString()] = i })

  let totalCost = 0
  orders.forEach(order => {
    order.items.forEach(oi => {
      const cost = oi.cost_price != null ? oi.cost_price : (itemMap[oi.item_id?.toString()]?.cost_price || 0)
      // cost_price is per ml_per_unit; scale by actual ml served
      const serves = (oi.quantity_ml != null && oi.ml_per_unit)
        ? oi.quantity_ml / oi.ml_per_unit
        : oi.quantity
      totalCost += serves * cost
    })
  })

  const totalProfit = totalRevenue - totalCost

  const itemsSold = orders.reduce((s, o) => s + o.items.reduce((x, i) => {
    // Use quantity_ml / ml_per_unit for accurate serve count; fall back to quantity for old records
    const serves = (i.quantity_ml != null && i.ml_per_unit)
      ? i.quantity_ml / i.ml_per_unit
      : i.quantity
    return x + serves
  }, 0), 0)

  const lowStockItems = items
    .map(i => ({ ...i, units_left: Math.floor(i.stock_ml / i.ml_per_unit) }))
    .filter(i => i.units_left < 3)

  // Build chart data based on range
  const salesByDay = {}

  if (range === 'all') {
    allOrders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0]
      if (!salesByDay[key]) salesByDay[key] = { revenue: 0, orders: 0 }
      salesByDay[key].revenue += o.total
      salesByDay[key].orders += 1
    })
  } else {
    const days = range === '30d' ? 30 : range === '1d' ? 1 : 7
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
      salesByDay[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 }
    }
    orders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0]
      if (salesByDay[key]) { salesByDay[key].revenue += o.total; salesByDay[key].orders += 1 }
    })
  }

  const salesChart = Object.entries(salesByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d }))

  res.json({ totalRevenue, totalProfit, totalOrders, itemsSold, lowStockItems, salesChart })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 API server running on http://localhost:${PORT}`))
