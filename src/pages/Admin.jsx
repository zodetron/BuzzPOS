import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts'
import { 
  Beer, LayoutDashboard, Package, TrendingUp, DollarSign, 
  ShoppingCart, AlertTriangle, ArrowUpRight, LogOut, 
  Plus, Edit3, Trash2, X, Save, Database, ArrowLeft
} from 'lucide-react'
import { api } from '../lib/api'
import { getUser, logout } from '../lib/auth'

const EMPTY_FORM = { name: '', stock_ml: '', cost_price: '', selling_price: '', ml_per_unit: '', category: 'alcohol' }
const EMPTY_DASH = { totalRevenue: 0, totalProfit: 0, totalOrders: 0, itemsSold: 0, lowStockItems: [], salesChart: [] }

export default function Admin() {
  const [tab, setTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState({ ...EMPTY_DASH })
  const [chartRange, setChartRange] = useState('7d')
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editId, setEditId] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dbStatus, setDbStatus] = useState('connecting')
  const navigate = useNavigate()
  const user = getUser()

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    fetchAll()
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [chartRange])

  async function fetchDashboard() {
    try {
      const dashRes = await api.getDashboard(chartRange)
      setDashboard(dashRes.data || { ...EMPTY_DASH })
      setDbStatus('ok')
    } catch {
      setDashboard({ ...EMPTY_DASH })
      setDbStatus('offline')
    }
  }

  async function fetchAll() {
    try {
      const [dashRes, itemsRes] = await Promise.all([api.getDashboard(chartRange), api.getItems()])
      setDashboard(dashRes.data || { ...EMPTY_DASH })
      setItems(itemsRes.data || [])
      setDbStatus('ok')
    } catch {
      setDashboard({ ...EMPTY_DASH })
      setItems([])
      setDbStatus('offline')
    }
  }

  function startEdit(item) {
    setEditId(item._id)
    setForm({
      name: item.name,
      stock_ml: item.stock_ml,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      ml_per_unit: item.ml_per_unit,
      category: item.category,
    })
    setTab('items')
  }

  function cancelEdit() {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        stock_ml: Number(form.stock_ml),
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        ml_per_unit: Number(form.ml_per_unit),
        category: form.category,
      }
      if (editId) {
        await api.updateItem({ id: editId, ...payload })
      } else {
        await api.createItem(payload)
      }
      cancelEdit()
      fetchAll()
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return
    await api.deleteItem(id)
    fetchAll()
  }

  const rangeLabel = { '1d': 'Today', '7d': 'This Week', '30d': 'This Month', 'all': 'All Time' }[chartRange]
  const stats = [
    { label: `Revenue (${rangeLabel})`, value: `₹${(Number(dashboard?.totalRevenue) || 0).toFixed(0)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: `Profit (${rangeLabel})`, value: `₹${(Number(dashboard?.totalProfit) || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: `Orders (${rangeLabel})`, value: dashboard?.totalOrders || 0, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: `Items Sold (${rangeLabel})`, value: dashboard?.itemsSold || 0, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="glass-card !rounded-none border-t-0 border-x-0 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/40">
            <Beer className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-base md:text-xl tracking-tight leading-none">ADMIN DASHBOARD</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{dbStatus === 'ok' ? 'Cloud Connected' : 'Connection Error'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => navigate('/pos')} 
            className="btn-secondary !py-2 !px-3 md:!px-4 text-xs md:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to POS</span>
          </button>
          <button 
            onClick={() => { logout(); navigate('/') }} 
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-surface-900/50 border-b border-white/5 px-4 md:px-8 flex gap-4 md:gap-8">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'items', label: 'Inventory', icon: Package }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              relative py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all flex items-center gap-2
              ${tab === t.id ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            <t.icon className={`w-4 h-4 ${tab === t.id ? 'text-amber-500' : 'text-gray-500'}`} />
            {t.label}
            {tab === t.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {tab === 'dashboard' ? (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              {/* Range Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-white font-black text-xl md:text-2xl tracking-tight">Overview</h2>
                  <p className="text-gray-500 text-xs mt-1">
                    {{ '1d': 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days', 'all': 'All time' }[chartRange]}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-surface-900/60 p-1 rounded-xl border border-white/5 self-start sm:self-auto overflow-x-auto no-scrollbar">
                  {[
                    { label: 'Today', value: '1d' },
                    { label: '1 Week', value: '7d' },
                    { label: '1 Month', value: '30d' },
                    { label: 'All Time', value: 'all' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setChartRange(opt.value)}
                      className={`px-3 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0
                        ${chartRange === opt.value
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/30'
                          : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-6 border border-white/5 flex items-center gap-4"
                  >
                    <div className={`${stat.bg} p-4 rounded-2xl`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                      <p className="text-white text-2xl font-black mt-0.5 tracking-tight">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chart & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 border border-white/5">
                  <div className="mb-8">
                    <h3 className="text-white font-black text-xl tracking-tight">Revenue Insights</h3>
                    <p className="text-gray-500 text-xs font-medium mt-1">
                      {{ '1d': 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days', 'all': 'All time' }[chartRange]}
                    </p>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboard.salesChart}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} 
                          dy={10}
                          tickFormatter={d => {
                            const date = new Date(d)
                            return chartRange === 'all'
                              ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
                              : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                          }}
                          interval={chartRange === 'all' ? 'preserveStartEnd' : chartRange === '30d' ? 4 : 0}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} 
                        />
                        <Tooltip
                          contentStyle={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                          itemStyle={{ color: '#f59e0b', fontWeight: 800 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorRev)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Low Stock Alerts */}
                  <div className="glass-card p-6 border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-red-500 p-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-white font-black text-sm uppercase tracking-widest">Stock Alerts</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {dashboard.lowStockItems?.length > 0 ? dashboard.lowStockItems.map(item => (
                        <div key={item._id} className="flex justify-between items-center bg-surface-900/50 p-3 rounded-xl border border-white/5">
                          <span className="text-white text-xs font-bold">{item.name}</span>
                          <span className="text-red-500 text-[10px] font-black bg-red-500/10 px-2 py-0.5 rounded-full">
                            {item.units_left} LEFT
                          </span>
                        </div>
                      )) : (
                        <p className="text-gray-500 text-xs italic text-center py-4">All stock levels healthy</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Summary Card */}
                  <div className="glass-card p-6 border border-white/5 bg-surface-900/40">
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Inventory Items</span>
                        <span className="text-white font-bold">{items.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Database Engine</span>
                        <span className="text-green-500 font-bold">MongoDB Atlas</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Server Status</span>
                        <span className="text-green-500 font-bold">Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Inventory Table */}
              <div className="glass-card overflow-hidden border border-white/5">
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-white font-black text-lg md:text-xl tracking-tight">Active Inventory</h3>
                  <button onClick={() => setTab('items')} className="text-amber-500 text-xs font-bold hover:underline flex items-center gap-1">
                    Manage All <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/2">
                      <tr>
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4">Volume</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4">Price / Unit</th>
                        <th className="px-6 py-4 text-right">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.slice(0, 5).map(item => {
                        const margin = item.selling_price - item.cost_price
                        return (
                          <tr key={item._id} className="hover:bg-white/2 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{item.name}</span>
                                <span className="text-[10px] text-gray-500 uppercase">{item.category}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono">{item.stock_ml}ml</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.low_stock ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                {item.units_left} UNITS
                              </span>
                            </td>
                            <td className="px-6 py-4 text-amber-500 font-black">₹{item.selling_price}</td>
                            <td className="px-6 py-4 text-right text-green-500 font-bold">+₹{margin}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-white/5">
                  {items.slice(0, 5).map(item => {
                    const margin = item.selling_price - item.cost_price
                    return (
                      <div key={item._id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-bold text-sm truncate">{item.name}</p>
                          <p className="text-gray-500 text-[10px] uppercase mt-0.5">{item.category} · {item.stock_ml}ml</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.low_stock ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {item.units_left}
                          </span>
                          <span className="text-amber-500 font-black text-sm">₹{item.selling_price}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="items"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {/* Form Side */}
              <div className="lg:col-span-1 order-1 lg:order-none">
                <div className="glass-card p-5 md:p-8 border border-white/5 lg:sticky lg:top-32">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="bg-amber-500/10 p-2 rounded-lg">
                      {editId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                    </div>
                    <h3 className="text-white font-black text-lg md:text-xl tracking-tight">
                      {editId ? 'Modify Product' : 'Onboard Product'}
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Product Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="input-field w-full"
                        placeholder="e.g. Jack Daniels"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Category</label>
                        <select
                          value={form.category}
                          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                          className="input-field w-full appearance-none"
                        >
                          <option value="alcohol">Alcohol</option>
                          <option value="beer">Beer</option>
                          <option value="wine">Wine</option>
                          <option value="soft drink">Soft Drink</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Vol (ml)</label>
                        <input
                          type="number"
                          value={form.stock_ml}
                          onChange={e => setForm(f => ({ ...f, stock_ml: e.target.value }))}
                          className="input-field w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Cost Price</label>
                        <input
                          type="number"
                          value={form.cost_price}
                          onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                          className="input-field w-full"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Sell Price</label>
                        <input
                          type="number"
                          value={form.selling_price}
                          onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))}
                          className="input-field w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">ml per Unit (Serving Size)</label>
                      <input
                        type="number"
                        value={form.ml_per_unit}
                        onChange={e => setForm(f => ({ ...f, ml_per_unit: e.target.value }))}
                        className="input-field w-full"
                        required
                      />
                    </div>

                    {formError && (
                      <p className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{formError}</p>
                    )}

                    <div className="flex gap-3 pt-2 md:pt-4">
                      <button type="submit" disabled={saving} className="btn-primary flex-1">
                        <Save className="w-4 h-4" />
                        {saving ? 'Processing...' : editId ? 'Update' : 'Confirm'}
                      </button>
                      {editId && (
                        <button type="button" onClick={cancelEdit} className="btn-secondary">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* List Side */}
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-black text-lg md:text-xl tracking-tight">Active Inventory ({items.length})</h3>
                </div>

                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item._id} className="glass-card p-3 md:p-4 border border-white/5 flex items-center gap-3 md:gap-6 group hover:bg-surface-900/60 transition-all">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-800 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Beer className={`w-5 h-5 md:w-6 md:h-6 ${item.low_stock ? 'text-red-500' : 'text-amber-500'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-black text-sm md:text-base truncate tracking-tight">{item.name}</h4>
                          {item.low_stock && (
                            <span className="hidden sm:inline bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">Low</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-500 flex-wrap">
                          <span>{item.category}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{item.stock_ml}ml</span>
                          <span className="text-amber-500">₹{item.selling_price}/unit</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 md:gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 bg-surface-800 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 bg-surface-800 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-black text-base md:text-lg">{Math.floor(item.stock_ml / item.ml_per_unit)}</p>
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Units</p>
                      </div>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center py-16 bg-surface-900/30 rounded-3xl border border-dashed border-white/5">
                      <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold text-sm">No inventory found. Add your first item above.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
