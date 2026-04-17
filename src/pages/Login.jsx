import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Beer, Lock, User, AlertCircle, ChevronRight } from 'lucide-react'
import { login } from '../lib/auth'

export default function Login() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    
    // Simulate a small delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const role = login(id, password)
    if (!role) {
      setError('Invalid credentials. Please try again.')
      setIsSubmitting(false)
      return
    }
    navigate(role === 'admin' ? '/admin' : '/pos')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-gray-950 to-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30"
          >
            <Beer className="w-10 h-10 text-amber-500" />
          </motion.div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-2">BAR <span className="text-amber-500">POS</span></h1>
          <p className="text-gray-400 font-medium">Elevating Service Excellence</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-gray-400 text-sm font-semibold ml-1 flex items-center gap-2">
              <User className="w-4 h-4" /> User Identity
            </label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              className="input-field w-full"
              placeholder="Enter your unique ID"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 text-sm font-semibold ml-1 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Security Key
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field w-full"
              placeholder="Enter your secure password"
              autoComplete="current-password"
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 text-lg group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Enter Dashboard
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5">
          <div className="flex flex-col gap-3">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center mb-1">Access Levels</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-amber-500 font-bold text-xs mb-1">ADMINISTRATOR</p>
                <p className="text-gray-400 text-[10px] truncate">mehfil_admin / ...2025</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-amber-500 font-bold text-xs mb-1">STAFF CREW</p>
                <p className="text-gray-400 text-[10px] truncate">mehfil_staff / ...2025</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
