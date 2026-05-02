import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const USAGE_KEY = 'tinylink-usage-count'
// Show ad every N uses
const TRIGGER_EVERY = 3

export function incrementUsage() {
  const count = parseInt(localStorage.getItem(USAGE_KEY) ?? '0', 10) + 1
  localStorage.setItem(USAGE_KEY, String(count))
  return count
}

export default function UsageModal() {
  const [open, setOpen] = useState(false)
  const [countdown, setCountdown] = useState(8)

  useEffect(() => {
    const count = parseInt(localStorage.getItem(USAGE_KEY) ?? '0', 10)
    if (count > 0 && count % TRIGGER_EVERY === 0) {
      setOpen(true)
      setCountdown(8)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setCountdown(8)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [open, countdown])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="card max-w-md w-full p-6 text-center relative"
          >
            <div className="w-14 h-14 rounded-full bg-[#00C4A7]/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="text-[#00C4A7]" size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You're a Power User!</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              TinyLink Pro stays free thanks to our sponsors. Just a moment...
            </p>

            {/* Ad placeholder */}
            <div className="ad-placeholder h-[200px] w-full mb-4 rounded-xl">
              <span>Advertisement</span>
            </div>

            <button
              disabled={countdown > 0}
              onClick={() => setOpen(false)}
              className={`btn-primary w-full transition-opacity ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {countdown > 0 ? `Continue in ${countdown}s` : 'Continue Shortening'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
