import { motion } from 'framer-motion'
import { Receipt, X, Printer, CheckCircle2 } from 'lucide-react'

export default function BillModal({ cart, total, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="glass-card w-full sm:max-w-md overflow-hidden relative z-10 rounded-t-3xl sm:rounded-2xl"
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-surface-700 rounded-full" />
        </div>

        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-white text-lg font-black tracking-tight">Invoice Preview</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-surface-900/50 rounded-2xl p-4 border border-white/5 mb-5">
            <div className="space-y-3 mb-5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {cart.map(item => (
                <div key={item.cartItemId} className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">
                      {item.name} {item.variantName !== 'Standard' && <span className="text-amber-500 font-normal">({item.variantName})</span>}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">₹{(item.selling_price * item.ratio).toFixed(0)} × {item.cartQuantity}</p>
                  </div>
                  <span className="text-amber-500 font-black text-sm flex-shrink-0">₹{(item.cartQuantity * item.ratio * item.selling_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-white/10 pt-4 flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Payable Amount</p>
                <p className="text-white font-black text-3xl tracking-tighter mt-1">₹{total.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="btn-secondary">
              Back
            </button>
            <button onClick={onConfirm} disabled={loading} className="btn-primary">
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Complete & Print
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-amber-500/5 p-3 border-t border-white/5 text-center">
          <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-[0.2em]">Thank you for choosing Bar POS</p>
        </div>
      </motion.div>
    </div>
  )
}
