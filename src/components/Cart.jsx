import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingCart, Receipt, XCircle } from 'lucide-react'

export default function Cart({ cart, onIncrease, onDecrease, onRemove, onCheckout, onClear }) {
  const total = Math.ceil(cart.reduce((s, i) => s + (i.cartQuantity * i.ratio * i.selling_price), 0))

  // Calculate ml already in cart per item _id
  function mlInCartForItem(itemId) {
    return cart
      .filter(i => i._id === itemId)
      .reduce((s, i) => s + i.cartQuantity * i.ml_per_serve, 0)
  }

  if (!cart.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface-800 rounded-full p-6 mb-4 border border-white/5"
        >
          <ShoppingCart className="w-10 h-10 text-surface-700" />
        </motion.div>
        <p className="font-bold text-gray-400">Your cart is empty</p>
        <p className="text-xs mt-1 text-gray-500">Add some drinks to start</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {cart.map(item => (
            <motion.div 
              key={item.cartItemId}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 bg-surface-800/80 backdrop-blur-sm rounded-2xl p-3 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">
                  {item.name} {item.variantName !== 'Standard' && <span className="text-amber-500 font-normal">({item.variantName})</span>}
                </p>
                <p className="text-amber-500 text-xs font-black">₹{(item.selling_price * item.ratio).toFixed(0)}</p>
              </div>
              
              {(() => {
                const atMax = mlInCartForItem(item._id) >= item.stock_ml
                return (
                  <div className="flex items-center bg-surface-900 rounded-xl p-1 border border-white/5">
                    <button
                      onClick={() => onDecrease(item.cartItemId)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-700 text-gray-400 hover:text-white transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white w-8 text-center text-sm font-black">{item.cartQuantity}</span>
                    <button
                      onClick={() => !atMax && onIncrease(item.cartItemId)}
                      disabled={atMax}
                      title={atMax ? 'No more stock available' : ''}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                        ${atMax
                          ? 'bg-surface-700/50 text-gray-600 cursor-not-allowed'
                          : 'hover:bg-amber-500 bg-amber-600/10 text-amber-500 hover:text-black'
                        }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )
              })()}

              <button
                onClick={() => onRemove(item.cartItemId)}
                className="text-gray-600 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pt-6 mt-4 border-t border-white/5 space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Order Total</span>
          <span className="text-white font-black text-2xl tracking-tighter">₹{total}</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={onCheckout}
            className="btn-primary w-full py-4 shadow-amber-900/40"
          >
            <Receipt className="w-5 h-5" />
            Generate Invoice
          </button>
          
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-red-400 py-2 text-xs font-bold transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  )
}
