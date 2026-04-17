import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertTriangle, ZapOff, X } from 'lucide-react'

export default function ItemCard({ item, onAdd }) {
  const [showVariants, setShowVariants] = useState(false)
  const isOut = item.out_of_stock
  const isLow = item.low_stock && !isOut
  
  const hasVariants = item.category === 'alcohol' || item.category === 'wine'

  const handleMainClick = () => {
    if (isOut) return
    if (hasVariants) {
      setShowVariants(true)
    } else {
      onAdd(item, 1, 'Standard', item.ml_per_unit)
    }
  }

  const handleVariantAdd = (e, ml, variantName) => {
    e.stopPropagation()
    // Price ratio: how many ml chosen vs the serving size (ml_per_unit)
    const ratio = ml / item.ml_per_unit
    onAdd(item, ratio, variantName, ml)
    setShowVariants(false)
  }

  return (
    <motion.div
      whileHover={!isOut && !showVariants ? { y: -5, scale: 1.02 } : {}}
      className={`
        relative group flex flex-col rounded-2xl h-40
        transition-all duration-300 select-none overflow-hidden
        ${isOut
          ? 'bg-surface-800/50 grayscale border-surface-700/50 cursor-not-allowed border'
          : 'bg-gradient-to-br from-surface-800 to-surface-900 border border-white/5 shadow-xl'
        }
        ${!showVariants && !isOut ? 'hover:border-amber-500/50 cursor-pointer' : ''}
      `}
    >
      <AnimatePresence mode="wait">
        {!showVariants ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleMainClick}
            className="flex-1 flex flex-col items-center justify-center p-4 relative"
          >
            {/* Background Decor */}
            {!isOut && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-2xl rounded-full group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
            )}

            {/* Badges */}
            <div className="absolute top-3 right-3 flex gap-1 pointer-events-none">
              {isLow && (
                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> LOW
                </span>
              )}
              {isOut && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ZapOff className="w-2.5 h-2.5" /> OUT
                </span>
              )}
            </div>

            {/* Category Indicator */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/20 group-hover:bg-amber-500 transition-all" />

            <div className="flex flex-col items-center gap-1 pointer-events-none">
              <span className={`text-sm font-bold leading-tight text-center ${isOut ? 'text-gray-500' : 'text-gray-200 group-hover:text-white'}`}>
                {item.name}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${isOut ? 'text-gray-600' : 'text-amber-500'}`}>₹{item.selling_price}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isOut ? 'text-gray-600' : 'text-gray-500 group-hover:text-gray-400'}`}>
                {isOut ? 'Unavailable' : `${item.units_left} units remaining`}
              </span>
            </div>

            {/* Hover Icon */}
            {!isOut && (
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 pointer-events-none">
                <div className="bg-amber-500 rounded-full p-1.5 shadow-lg">
                  <Plus className="w-4 h-4 text-black" />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="variants"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-surface-900/95 backdrop-blur-md p-3 flex flex-col z-10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-xs font-bold truncate pr-2">{item.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowVariants(false) }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { label: '30ml', ml: 30 },
                { label: '60ml', ml: 60 },
                { label: '90ml', ml: 90 },
                { label: '120ml', ml: 120 },
              ].map(variant => (
                <button
                  key={variant.label}
                  onClick={(e) => handleVariantAdd(e, variant.ml, variant.label)}
                  className="bg-surface-800 hover:bg-amber-500 hover:text-black text-gray-300 text-xs font-bold rounded-lg transition-colors border border-white/5"
                >
                  {variant.label}
                  <span className="block text-[10px] font-normal opacity-70">
                    ₹{((item.selling_price / item.ml_per_unit) * variant.ml).toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={(e) => handleVariantAdd(e, item.ml_per_unit, 'Bottle')}
              className="mt-2 w-full py-1.5 bg-amber-600/20 hover:bg-amber-500 text-amber-500 hover:text-black text-xs font-bold rounded-lg transition-colors border border-amber-500/30"
            >
              Bottle ({item.ml_per_unit}ml) — ₹{item.selling_price.toFixed(0)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
