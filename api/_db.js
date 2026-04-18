// api/_db.js
// Singleton MongoDB connection using Mongoose.
// Vercel serverless functions are stateless but the Node process can be reused
// between warm invocations, so we cache the connection on the global object to
// avoid opening a new connection on every request.

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable')
}

// ── Connection cache ──────────────────────────────────────────────────────────
let cached = global._mongooseCache
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

// ── Schemas & Models ──────────────────────────────────────────────────────────
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

// Guard against model re-registration on hot reloads
export const Item  = mongoose.models.Item  || mongoose.model('Item',  ItemSchema)
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)
