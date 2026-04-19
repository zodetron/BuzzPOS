import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Beer, Search, LogOut, Database, 
  LayoutDashboard, Info, RefreshCcw, Wine, ShoppingCart, X
} from 'lucide-react'
import { api } from '../lib/api'
import { getUser, logout } from '../lib/auth'
import { generateBill } from '../lib/generateBill'
import ItemCard from '../components/ItemCard'
import Cart from '../components/Cart'
import BillModal from '../components/BillModal'

export default function POS() {
  const [items, setItems] = useState([])
  const [cart, setCart] = useState([])
  const [showBill, setShowBill] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [dbOnline, setDbOnline] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const navigate = useNavigate()
  const user = getUser()

  useEffect(() => {
    if (!user) { navigate('/'); return }
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await api.getItems()
      const data = Array.isArray(res.data) ? res.data : []
      setItems(data)
      setDbOnline(data.length >= 0 && res.data !== null)
    } catch {
      setItems([])
      setDbOnline(false)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(item, ratio, variantName = 'Standard', ml = item.ml_per_unit) {
    setCart(prev => {
      const mlInCart = prev
        .filter(i => i._id === item._id)
        .reduce((s, i) => s + i.cartQuantity * i.ml_per_serve, 0)
      if (mlInCart + ml > item.stock_ml) return prev
      const cartItemId = `${item._id}-${variantName}`
      const existing = prev.find(i => i.cartItemId === cartItemId)
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, cartQuantity: i.cartQuantity + 1 } : i)
      }
      return [...prev, { ...item, cartItemId, ratio, ml_per_serve: ml, variantName, cartQuantity: 1 }]
    })
  }

  function increase(cartItemId) {
    setCart(prev => {
      const target = prev.find(i => i.cartItemId === cartItemId)
      if (!target) return prev
      const mlInCart = prev
        .filter(i => i._id === target._id)
        .reduce((s, i) => s + i.cartQuantity * i.ml_per_serve, 0)
      if (mlInCart + target.ml_per_serve > target.stock_ml) return prev
      return prev.map(i => i.cartItemId === cartItemId ? { ...i, cartQuantity: i.cartQuantity + 1 } : i)
    })
  }

  function decrease(cartItemId) {
    setCart(prev => {
      const item = prev.find(i => i.cartItemId === cartItemId)
      if (!item) return prev
      if (item.cartQuantity === 1) return prev.filter(i => i.cartItemId !== cartItemId)
      return prev.map(i => i.cartItemId === cartItemId ? { ...i, cartQuantity: i.cartQuantity - 1 } : i)
    })
  }

  function remove(cartItemId) {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
  }

  async function handleCheckout() {
    setLoading(true)
    try {
      const orderItems = cart.map(i => ({ 
        item_id: i._id, 
        quantity_ml: i.cartQuantity * i.ml_per_serve
      }))
      const orderRes = await api.placeOrder(orderItems)
      const total = Math.ceil(cart.reduce((s, i) => s + (i.cartQuantity * i.ratio * i.selling_price), 0))
      const dailyOrderNo = orderRes?.data?.dailyOrderNo || null
      generateBill(cart, total, dailyOrderNo)
      setCart([])
      setShowBill(false)
      setShowCart(false)
      fetchItems()
    } catch (err) {
      alert(err?.response?.data?.error || 'Order failed. Check DB connection.')
    } finally {
      setLoading(false)
    }
  }

  const total = Math.ceil(cart.reduce((s, i) => s + (i.cartQuantity * i.ratio * i.selling_price), 0))
  const cartCount = cart.reduce((s, i) => s + i.cartQuantity, 0)
  const categories = ['all', ...new Set(items.map(i => i.category))]
  
  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || i.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col selection:bg-amber-500/30">
      {/* Header */}
      <header className="glass-card !rounded-none border-t-0 border-x-0 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/40">
              <Beer className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg md:text-xl tracking-tight leading-none">MEHFIL</h1>
              <p className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5">Terminal Active</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-surface-900 rounded-full px-4 py-1.5 border border-white/5">
            <Database className={`w-3.5 h-3.5 ${dbOnline ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {dbOnline ? 'Cloud Sync Online' : 'Offline Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors text-sm font-bold bg-white/5 hover:bg-amber-500/10 px-3 md:px-4 py-2 rounded-xl border border-white/5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <button 
            onClick={() => { logout(); navigate('/') }} 
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-bold px-2 py-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 md:p-6 gap-3 md:gap-6">
          {/* Controls Area */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search drinks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field w-full pl-11"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    whitespace-nowrap px-3 md:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0
                    ${activeCategory === cat 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' 
                      : 'bg-surface-800 text-gray-400 hover:bg-surface-700 hover:text-white border border-white/5'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
            <AnimatePresence mode="popLayout">
              {!dbOnline && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-4 flex items-center gap-3 text-amber-500"
                >
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-medium">
                    Database not connected. Launch with <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">vercel dev</code> for cloud features.
                  </p>
                </motion.div>
              )}

              {filtered.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
                >
                  {filtered.map(item => (
                    <ItemCard
                      key={item._id}
                      item={item}
                      onAdd={addToCart}
                      cartQty={cart
                        .filter(c => c._id === item._id)
                        .reduce((s, c) => s + c.cartQuantity, 0)}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center mt-16 text-gray-600"
                >
                  <div className="w-20 h-20 bg-surface-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
                    <Wine className="w-10 h-10" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">No matches found</h3>
                  <p className="text-sm max-w-xs text-center text-gray-500">Try adjusting your search or category filters.</p>
                  <button 
                    onClick={() => {setSearch(''); setActiveCategory('all')}}
                    className="mt-4 flex items-center gap-2 text-amber-500 font-bold hover:underline text-sm"
                  >
                    <RefreshCcw className="w-4 h-4" /> Reset Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Cart Sidebar */}
        <aside className="hidden md:flex w-96 glass-card !rounded-none border-y-0 border-r-0 p-6 flex-col relative z-40 bg-surface-900/50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-white font-black text-2xl tracking-tight flex items-center gap-3">
              Order
              {cart.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                  {cartCount}
                </span>
              )}
            </h2>
            <div className="p-2 bg-surface-800 rounded-lg text-gray-500">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Cart
              cart={cart}
              onIncrease={increase}
              onDecrease={decrease}
              onRemove={remove}
              onCheckout={() => setShowBill(true)}
              onClear={() => setCart([])}
            />
          </div>
        </aside>
      </div>

      {/* Mobile Cart FAB */}
      <AnimatePresence>
        {!showCart && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="md:hidden fixed bottom-6 right-6 z-50 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-amber-900/50 flex items-center gap-3 font-bold"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 ? (
              <>
                <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                <span className="bg-black/20 rounded-lg px-2 py-0.5 text-sm font-black">₹{total}</span>
              </>
            ) : (
              <span>Cart</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-900 rounded-t-3xl border-t border-white/10 flex flex-col"
              style={{ maxHeight: '85vh' }}
            >
              {/* Drawer Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-surface-700 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-3">
                  Order
                  {cartCount > 0 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                      {cartCount}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 bg-surface-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-5">
                <Cart
                  cart={cart}
                  onIncrease={increase}
                  onDecrease={decrease}
                  onRemove={remove}
                  onCheckout={() => { setShowCart(false); setShowBill(true) }}
                  onClear={() => { setCart([]); setShowCart(false) }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBill && (
          <BillModal
            cart={cart}
            total={total}
            onClose={() => setShowBill(false)}
            onConfirm={handleCheckout}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
